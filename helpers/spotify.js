/* eslint-disable no-underscore-dangle */
const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const moment = require('moment');
const cryptoJS = require('crypto-js');
const { spotify: spotifyConfig } = require('../config');
const { chunkArray } = require('./util');

const Authentication = require('../models/authentication');
const Playlist = require('../models/playlist');
const Artist = require('../models/artist');
const Track = require('../models/track');
const Contributor = require('../models/contributor');
const logger = require('./logger');

const spotifyApi = (() => {
  let instance = null;
  return {
    getInstance: () => {
      if (!instance) {
        instance = new SpotifyWebApi({
          clientId: spotifyConfig.clientId,
          clientSecret: spotifyConfig.clientSecret,
          redirectUri: spotifyConfig.redirectUri,
        });
      }
      return instance;
    },
  };
})();

const scopes = ['playlist-modify-public', 'ugc-image-upload'];
const TOKEN_DURATION_IN_HOURS = 1;
const encryptionSecret = spotifyConfig.tokenSecret;

const createAuthURL = () => spotifyApi.getInstance().createAuthorizeURL(scopes);

const setTokensOnAPIObject = (params) => {
  const spotifyApiInstance = spotifyApi.getInstance();
  spotifyApiInstance.setAccessToken(params.accessToken);
  spotifyApiInstance.setRefreshToken(params.refreshToken);
};

const setAccessTokenOnAPIObject = (token) => {
  spotifyApi.getInstance().setAccessToken(token);
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

const getTokensFromAPI = async (code) => spotifyApi.getInstance().authorizationCodeGrant(code)
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

const refreshAccessTokenFromAPI = () => spotifyApi.getInstance().refreshAccessToken()
  .then((response) => response.body.access_token);

const performAuthentication = async (code = '') => {
  const authToken = await Authentication.findOne({}, {}, { sort: { expires_at: -1 } });
  let accessToken = authToken ? decryptToken(authToken.access_token) : '';
  const refreshToken = authToken ? decryptToken(authToken.refresh_token) : '';

  if (!authToken) {
    if (!code) {
      return { status: false, message: 'Call "/authorize" my g', code: 401 };
    }
    const newCredentials = await getTokensFromAPI(code);
    const encryptedAccessToken = encryptToken(newCredentials.accessToken);
    const encryptedRefreshToken = encryptToken(newCredentials.refreshToken);

    await saveTokensToDB({
      accessToken: encryptedAccessToken, refreshToken: encryptedRefreshToken,
    });
    setTokensOnAPIObject(newCredentials);
    return {
      status: true, message: 'Authentication successful: New tokens generated', data: newCredentials, code: 200,
    };
  }

  if (moment.utc().diff(moment(authToken.expires_at), 'hours') >= TOKEN_DURATION_IN_HOURS) {
    spotifyApi.getInstance().setRefreshToken(refreshToken);
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
  return {
    status: true, message: 'Authentication successful', data: tokens, code: 200,
  };
};

const clearAuthentication = async () => Authentication.deleteMany({});

const createPlaylist = (name) => {
  const { userId } = spotifyConfig;
  return spotifyApi.getInstance().createPlaylist(userId, name, { public: true })
    .then((response) => response.body);
};

const addTracksToPlaylist = (id, tracks) => (
  spotifyApi.getInstance().addTracksToPlaylist(id, tracks)
);

const getPlaylist = (id) => spotifyApi.getInstance().getPlaylist(id)
  .then((response) => response.body);

const setPlaylistCover = async (id, image) => {
  const { data: { accessToken } } = await performAuthentication();
  const url = `https://api.spotify.com/v1/playlists/${id}/images`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'image/jpeg',
  };
  return axios.put(url, image, { headers })
    .then((response) => response.data);
};

/**
 * @description sanitizes the response for spotify's get audio track features API
 * @param {Object|null} data The data to be sanitized
 * @returns {Object} the sanitized audio features for a track
 */
const sanitizeGetAudioFeaturesForTrackResponse = (data) => {
  if (!data) return {};
  const { duration_ms: durationMs, ...dataWithoutDurationInMs } = data;
  return { ...dataWithoutDurationInMs, duration: durationMs / 1000 };
};

/**
 * @description returns the features for a single track
 * @param {String} tracks A single track URL (string)
 * @returns {Promise<Object>} The audio features for a track
 */
const getAudioFeaturesForTrack = (trackID) => (
  spotifyApi.getInstance().getAudioFeaturesForTrack(trackID)
    .then((response) => sanitizeGetAudioFeaturesForTrackResponse(response.body))
);

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
  return {
    mediaType,
    trackId,
  };
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

  const trackDataPromises = trackIdChunks.map((chunk) => spotifyApi.getInstance().getTracks(chunk));

  const responses = await Promise.all(trackDataPromises);
  responses.forEach((response) => {
    const { tracks } = response.body;
    Array.prototype.push.apply(trackDataArray, tracks);
  });

  return trackDataArray.filter((track) => !!track)
    .map((track) => ({
      explicit: track.explicit,
      duration: track.duration_ms / 1000,
      url: track.external_urls.spotify,
      name: track.name,
      artists: track.artists,
      artist_names: track.artists.map((artist) => artist.name),
      album_covers: track.album.images,
      trackId: track.id,
    }));
}

/**
 * @description Saves playlist to the database
 * @param {Array<Object>} playlistData playlist information
 * @param {Array<Object>} contributors contributor information
 * @returns {Promise<>}
 */
const savePlaylist = async (playlistData, contributors) => {
  const contributorIds = contributors.map((c) => c._id);
  const playlist = await Playlist.create({
    name: playlistData.name,
    description: playlistData.description,
    playlist_url: playlistData.external_urls.spotify,
    playlist_uri: `spotify:playlist:${playlistData.id}`,
    spotifyId: playlistData.id,
    date_added: playlistData.date_added,
    contributors: contributorIds,
  });
  return playlist;
};

const saveArtists = async (trackDetails) => {
  const artists = trackDetails.map((track) => track.artists).flat();
  const artistDocs = artists.map((artist) => ({
    updateOne: {
      filter: { spotifyId: artist.id },
      update: {
        name: artist.name,
        url: artist.href,
        spotifyId: artist.id,
      },
      upsert: true,
    },
  }));
  try {
    await Artist.bulkWrite(artistDocs);
  } catch (err) {
    logger.error(err);
  }
};

/**
 * @description Saves playlist tracks to the database
 * @param {Array<Object>} tracksData array of tracks to be saved
 * @param {Object} playlist
 * @returns {Promise<Object>}
 */
const saveTracks = async (tracksData, playlist) => {
  const spotifyTrackIds = tracksData.map((track) => track.trackId);
  const trackDetails = await getTrackData(spotifyTrackIds);

  // Save artists
  await saveArtists(trackDetails);

  const tracksDocs = await Promise.all(trackDetails.map(async (track) => {
    const slackData = tracksData.find((t) => t.trackId === track.trackId);
    const contributors = await Contributor.find({ slackId: { $in: slackData.users } });
    const contributorIds = contributors.map((c) => c._id);

    const spotifyArtistIds = track.artists.map((artist) => artist.id);
    const artists = await Artist.find({ spotifyId: { $in: spotifyArtistIds } });
    const artistIds = artists.map((a) => a._id);

    return {
      service: track.service,
      title: track.name,
      track_url: track.url,
      trackId: track.trackId,
      contributors: contributorIds,
      artists: artistIds,
      artist_names: track.artist_names.join(', '),
      isExplicit: track.explicit,
    };
  }));

  const tracks = await Track.insertMany(tracksDocs);
  const trackIds = tracks.map((t) => t._id);
  playlist.tracks.push(...trackIds);
  await playlist.save();
};

const updateTracks = async (criteria, updateData, upsert = true) => (
  Track.updateMany(criteria, updateData, { upsert })
);

const updateTracksWithAnalytics = async (tracks) => {
  const validTracks = tracks.filter(Boolean);
  const trackUpdatePromises = validTracks.map((track) => {
    const sanitisedTrack = sanitizeGetAudioFeaturesForTrackResponse(track);
    const { id: trackId, ...restOfTrack } = sanitisedTrack;
    return updateTracks({ trackId }, { analytics: restOfTrack });
  });
  return Promise.all(trackUpdatePromises);
};

const updateTracksWithPreviewUrls = async (tracks) => {
  const validTracks = tracks.filter(Boolean);
  // Updates multiple just in-case the track already exists, inserts if it doesn't exist
  const trackUpdatePromises = validTracks.map((track) => (
    updateTracks({ trackId: track.id }, { preview_url: track.preview_url })));
  return Promise.all(trackUpdatePromises);
};

/**
 * @description Returns a playlist
 * @param {Array<Object>} tracks array of tracks
 * @returns {Promise<>}
 */
const fetchAudioAnalyticsForTracks = async (tracks) => {
  const trackIds = tracks.map((t) => t.trackId);
  const trackIdChunks = chunkArray(trackIds, 50);

  const trackAnalyticsPromises = trackIdChunks.map((chunk) => (
    spotifyApi.getInstance().getAudioFeaturesForTracks(chunk)
  ));

  const responses = await Promise.all(trackAnalyticsPromises);
  const tracksWithAudioFeatures = responses.reduce((allTracks, { body: responseBody }) => {
    const { audio_features: audioFeatures } = responseBody;
    return [...allTracks, ...audioFeatures];
  }, []);

  return tracksWithAudioFeatures;
};

/**
 * @description uses the Spotify API to fetch preview URLs for a list of tracks
 * @param {Array} tracks array of tracks to get preview urls for
 * @returns {Array} array of tracks with preview urls attached
 */
const fetchPreviewUrlForTracks = async (tracks) => {
  const trackIds = tracks.map((t) => t.trackId);
  const trackIdChunks = chunkArray(trackIds, 50);

  const trackDataPromises = trackIdChunks.map((chunk) => spotifyApi.getInstance().getTracks(chunk));

  const responses = await Promise.all(trackDataPromises);
  const fetchedTracks = responses.reduce((acc, { body: responseBody }) => {
    const { tracks: fetchedTrack } = responseBody;
    return [...acc, ...fetchedTrack];
  }, []);

  return fetchedTracks;
};

const handleTracksUpdateWithAnalytics = async (tracks) => {
  const tracksWithAnalytics = await fetchAudioAnalyticsForTracks(tracks);
  return updateTracksWithAnalytics(tracksWithAnalytics);
};

const handleTracksUpdateWithPreviewUrls = async (tracks) => {
  const tracksWithPreviewUrls = await fetchPreviewUrlForTracks(tracks);
  return updateTracksWithPreviewUrls(tracksWithPreviewUrls);
};

/**
 * @description Returns all the tracks with missing analytics
 * @returns {Promise<>}
 */
const findTracksWithoutField = async (field) => Track.find({ [field]: { $exists: false } });

/**
 * @description sanitizes the response from the fetch single playlist endpoint
 * @param {Object} playlist A Playlist object
 * @returns {Object} A sanitized playlist object with artists as a comma separated list
 */
const sanitizeGetSinglePlaylistResponse = (playlist) => {
  const tracks = playlist.tracks
    .reduce((playlistTracks, track) => {
      const trackDoc = track._doc;
      const artistNames = [...new Set(trackDoc.artists.map((each) => each.name))].join(', ');
      return [...playlistTracks,
        { ...trackDoc, artists: artistNames },
      ];
    }, []);
  return { ...playlist, tracks };
};

/**
 * @description Returns a playlist
 * @param {String} playlistId ID of the playlist we want
 * @returns {Promise<Object>} The playlist data
 */
const findPlaylist = async (playlistId) => {
  const contributorFields = {
    _id: 1,
    name: 1,
    about: 1,
    profile_image: 1,
  };
  const playlist = await Playlist.findById(playlistId)
    .select({
      name: 1, description: 1, playlist_url: 1, playlist_uri: 1, hex: 1,
    })
    .populate({
      path: 'tracks',
      select: {
        _id: 1,
        service: 1,
        title: 1,
        track_url: 1,
        preview_url: 1,
        trackId: 1,
        analytics: 1,
        artist_names: 1,
      },
      populate: [
        {
          path: 'contributors',
          model: 'Contributor',
          select: contributorFields,
        },
        {
          path: 'artists',
          model: 'Artist',
        },
      ],
    })
    .populate({
      path: 'contributors',
      model: 'Contributor',
      select: contributorFields,
    })
    .exec();
  if (!playlist) return null;
  return sanitizeGetSinglePlaylistResponse(playlist._doc);
};

/**
 * @description returns an array of playlists
 * @returns {Promise<Array>} The playlist data for multiple playlists
 */
const findAllPlaylists = async () => Playlist.find({}, {
  name: 1, description: 1, playlist_url: 1, playlist_uri: 1, hex: 1,
}, {}).sort({ date_added: -1 });

const deletePlaylist = async (id) => {
  const playlist = await Playlist.findById(id).select({ _id: 1, name: 1 });
  if (!playlist) return null;
  const deletedPlaylist = await Playlist.deleteOne({ _id: id });
  return { ...deletedPlaylist, name: playlist.name };
};

/**
 * @description generate playlist name from formatted month
 * @param {Number} playlistMonth
 * @returns {String} the playlist name
 */
const generatePlaylistName = (playlistMonth) => playlistMonth.format('MMMM YYYY');

module.exports = {
  createAuthURL,
  performAuthentication,
  clearAuthentication,
  createPlaylist,
  addTracksToPlaylist,
  getPlaylist,
  setPlaylistCover,
  getAudioFeaturesForTrack,
  findTracksWithoutField,
  isSpotifyTrack,
  getTrackData,
  getSpotifyUrlParts,
  savePlaylist,
  saveTracks,
  handleTracksUpdateWithAnalytics,
  handleTracksUpdateWithPreviewUrls,
  findPlaylist,
  findAllPlaylists,
  generatePlaylistName,
  deletePlaylist,
};
