const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const moment = require('moment');
const cryptoJS = require('crypto-js');
const { chunkArray } = require('./util');

const Authentication = require('../models/authentication');
const Playlist = require('../models/playlist');
const Track = require('../models/track');
const Contributor = require('../models/contributor');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const scopes = ['playlist-modify-public', 'ugc-image-upload'];
const TOKEN_DURATION_IN_HOURS = 1;
const encryptionSecret = process.env.TOKEN_SECRET;

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
  const userId = process.env.SPOTIFY_USER_ID;
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
    contributors: contributorIds,
  });
  return playlist.id;
};

const saveTracks = async (tracksData, playlistId) => {
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
      playlist: playlistId,
    };
  }));
  await Track.insertMany(tracksDocs);
};

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
};
