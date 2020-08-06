const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const moment = require('moment');
const cryptoJS = require('crypto-js');
const { spotify: spotifyConfig } = require('../config');
const { chunkArray } = require('./util');

const Authentication = require('../models/authentication');
const Playlist = require('../models/playlist');
const Track = require('../models/track');
const Contributor = require('../models/contributor');

const spotifyApi = new SpotifyWebApi({
  clientId: spotifyConfig.clientId,
  clientSecret: spotifyConfig.clientSecret,
  redirectUri: spotifyConfig.redirectUri,
});

const scopes = ['playlist-modify-public', 'ugc-image-upload'];
const TOKEN_DURATION_IN_HOURS = 1;
const encryptionSecret = spotifyConfig.tokenSecret;

const createAuthURL = () => spotifyApi.createAuthorizeURL(scopes);

const setTokensOnAPIObject = (params) => {
  spotifyApi.setAccessToken(params.accessToken);
  spotifyApi.setRefreshToken(params.refreshToken);
};

const setAccessTokenOnAPIObject = (token) => {
  spotifyApi.setAccessToken(token);
};

const encryptToken = (token) => {
  const encryptedToken = cryptoJS.AES.encrypt(token, encryptionSecret).toString();
  return encryptedToken;
};

const decryptToken = (token) => {
  const decryptedTokenBytes = cryptoJS.AES.decrypt(token, encryptionSecret);
  const decryptedToken = decryptedTokenBytes.toString(cryptoJS.enc.Utf8);
  return decryptedToken;
};

const getTokensFromAPI = async (code) => spotifyApi.authorizationCodeGrant(code)
  .then((response) => ({
    accessToken: response.body.access_token,
    refreshToken: response.body.refresh_token,
  }));

const saveTokensToDB = async (params) => {
  try {
    const newAuth = new Authentication({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      created_at: moment.utc().format(),
      expires_at: moment.utc().add(TOKEN_DURATION_IN_HOURS, 'hour').format(),
    });
    await newAuth.save();
  } catch (error) {
    throw new Error('Something went wrong saving tokens to DB');
  }
};

const refreshAccessTokenFromAPI = () => spotifyApi.refreshAccessToken()
  .then((response) => response.body.access_token);

const performAuthentication = async (code = '') => {
  const authToken = await Authentication.findOne({}, {}, { sort: { expires_at: -1 } });
  let accessToken = authToken ? decryptToken(authToken.access_token) : '';
  const refreshToken = authToken ? decryptToken(authToken.refresh_token) : '';

  if (!authToken && code) {
    const newCredentials = await getTokensFromAPI(code);
    const encryptedAccessToken = encryptToken(newCredentials.accessToken);
    const encryptedRefreshToken = encryptToken(newCredentials.refreshToken);

    await saveTokensToDB({
      accessToken: encryptedAccessToken, refreshToken: encryptedRefreshToken,
    });
    setTokensOnAPIObject(newCredentials);
    return newCredentials;
  }

  if (moment.utc().diff(moment(authToken.expires_at), 'hours') >= TOKEN_DURATION_IN_HOURS) {
    spotifyApi.setRefreshToken(refreshToken);
    accessToken = await refreshAccessTokenFromAPI();
    const encryptedAccessToken = encryptToken(accessToken);
    const encryptedRefreshToken = encryptToken(refreshToken);
    await saveTokensToDB({
      accessToken: encryptedAccessToken, refreshToken: encryptedRefreshToken,
    });
    setAccessTokenOnAPIObject(accessToken);
  }

  const tokens = {
    accessToken,
    refreshToken,
  };
  setTokensOnAPIObject(tokens);
  return tokens;
};

const createPlaylist = (name) => {
  const { userId } = spotifyConfig;
  return spotifyApi.createPlaylist(userId, name, { public: true })
    .then((response) => response.body);
};

const addTracksToPlaylist = (id, tracks) => spotifyApi.addTracksToPlaylist(id, tracks);

const getPlaylist = (id) => spotifyApi.getPlaylist(id)
  .then((response) => response.body);

const setPlaylistCover = async (id, image) => {
  const { accessToken } = await performAuthentication();
  const url = `https://api.spotify.com/v1/playlists/${id}/images`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'image/jpeg',
  };
  return axios.put(url, image, { headers })
    .then((response) => response.data);
};

/**
 * @description returns the features for a single track
 * @param {String} tracks A single track URL (string)
 * @returns {Promise<Object>} The audio features for a track
 */
const getAudioFeaturesForTrack = (trackID) => spotifyApi.getAudioFeaturesForTrack(trackID)
  .then((response) => response.body);
/**
 * @description confirms that a URL is a Spotify URL
 * @param {String} trackURL the URL to be checked
 * @returns {Boolean}
 */
const isSpotifyTrack = (trackURL) => {
  const [, , , mediaType, id] = trackURL.split('/');
  return id && mediaType === 'track';
};
/**
 * @description Get the ID and media type from a Spotify URL.
 * @param {string} trackUrl A valid Spotify URL.
 * @returns {object} The Spotify track ID and media type.
 */
const getSpotifyUrlParts = (trackUrl) => {
  const [, , , mediaType, trackId] = trackUrl.split('?')[0].split('/');
  return { mediaType, trackId };
};

/**
 * @description returns track data for tracks
 * @param {Array} trackIds IDs for tracks
 * @returns {Promise<Object[]>} The track data for multiple tracks
 */
async function getTrackData(trackIds) {
  const areIdsValid = trackIds.every((id) => !!id);
  if (!areIdsValid) {
    throw new Error('Invalid IDs passed');
  }
  const trackIdChunks = chunkArray(trackIds, 50);
  const trackDataArray = [];

  const trackDataPromises = trackIdChunks.map((chunk) => spotifyApi.getTracks(chunk));

  const responses = await Promise.all(trackDataPromises);
  responses.forEach((response) => {
    const { tracks } = response.body;
    Array.prototype.push.apply(trackDataArray, tracks);
  });

  return trackDataArray.filter((track) => !!track).map((track) => ({
    explicit: track.explicit,
    duration: track.duration_ms / 1000,
    url: track.external_urls.spotify,
    name: track.name,
    artist_names: track.artists.map((artist) => artist.name),
    album_covers: track.album.images,
    id: track.id,
  }));
}

const savePlaylist = async (playlistData, contributors) => {
  // eslint-disable-next-line no-underscore-dangle
  const contributorIds = contributors.map((c) => c._id);
  const playlist = await Playlist.create({
    name: playlistData.name,
    description: playlistData.description,
    url: playlistData.external_urls.spotify,
    spotifyId: playlistData.id,
    date: playlistData.date,
    contributors: contributorIds,
  });
  return playlist;
};

const saveTracks = async (tracksData, playlist) => {
  const tracksDocs = await Promise.all(tracksData.map(async (track) => {
    const contributors = await Contributor.find({ slackId: { $in: track.users } });
    // eslint-disable-next-line no-underscore-dangle
    const contributorIds = contributors.map((c) => c._id);
    return {
      service: track.service,
      title: track.title,
      url: track.link,
      trackId: track.id,
      contributors: contributorIds,
    };
  }));
  const tracks = await Track.insertMany(tracksDocs);
  const trackIds = tracks.map((t) => t._id);
  playlist.tracks.push(...trackIds);
  await playlist.save();
};

/**
 * @description Returns a playlist
 * @param {String} playlistId ID of the playlist we want
 * @param {Number} skip Number of playlists to skip during pagination
 * @param {Number} limit Number of playlists to return
 * @returns {Promise<Object>} The playlist data
 */
const findPlaylist = async (playlistId, skip, limit) => {
  return Playlist.findOne({_id: ObjectId(playlistId)})
    .select({ contributors: 0, __v: 0 })
    .populate({
      path: 'tracks',
      select: {
        _id: 1,
        service: 1,
        title: 1,
        url: 1,
        trackId: 1,
      },
      populate: {
        path: 'contributors',
        model: 'Contributor',
      },
      options: {
        skip,
        limit,
      },
  }).exec();
}

/**
 * @description returns an array of contributors to a playlist
 * @param {String} playlistId ID of the playlist whose contributors we want
 * @param {Number} skip Number of playlists to skip during pagination
 * @param {Number} limit Number of playlists to return
 * @returns {Array} The contributor data for multiple contributors
 */
const findContributors = async (playlistId, skip, limit) => {
  const playlist = await Playlist.findById(playlistId)
    .select({ tracks: 0, __v: 0 })
    .populate({
      path: 'contributors',
      options: {
        sort: {
          name: 1,
        },
        skip,
        limit,
      },
  }).exec();
  if (!playlist) return [];
  return playlist.contributors;
}

/**
 * @description returns an array of playlists
 * @param {Number} skip Number of playlists to skip during pagination
 * @param {Number} limit Number of playlists to return
 * @returns {Promise<Array>} The playlist data for multiple playlists
 */
const findAllPlaylists = async (skip, limit) => {
  return Playlist.find({}, { tracks: 0, contributors: 0, __v: 0 }, {skip, limit}).sort({date_added: -1});
}

module.exports = {
  createAuthURL,
  performAuthentication,
  createPlaylist,
  addTracksToPlaylist,
  getPlaylist,
  setPlaylistCover,
  getAudioFeaturesForTrack,
  isSpotifyTrack,
  getTrackData,
  getSpotifyUrlParts,
  savePlaylist,
  saveTracks,
  findPlaylist,
  findContributors,
  findAllPlaylists,
};
