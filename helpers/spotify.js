const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const moment = require('moment');
const cryptoJS = require('crypto-js');

const Authentication = require('../models/authentication');

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
 * @description gets the ID from a Spotify URL
 * @param {*} trackURL a valid Spotify URL
 * @returns {Number} The Spotify Track ID
 */
const getSpotifyIdFromURL = (trackURL) => {
  let [, , , , id] = trackURL.split('/');
  ([id] = id.split('?'));
  return id;
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
  getSpotifyIdFromURL,
};
