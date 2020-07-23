const SpotifyWebApi = require('spotify-web-api-node');
const axios = require('axios');
const moment = require('moment');
const Authentication = require('../models/authentication');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const scopes = ['playlist-modify-public', 'ugc-image-upload'];
const TOKEN_DURATION_IN_HOURS = 1;

const spotify = {
  createAuthURL() {
    return spotifyApi.createAuthorizeURL(scopes);
  },

  getAuthTokens: async (code = '') => {
    const authToken = await Authentication.findOne({}, {}, { sort: { expires_at: -1 } });
    let accessToken = authToken ? authToken.access_token : '';

    if (!authToken && code) {
      const newCredentials = await spotify.getTokensFromAPI(code);
      await spotify.saveTokensToDB(newCredentials);
      spotify.setTokensOnAPIObject(newCredentials);
      return newCredentials;
    }

    if (moment.utc().diff(moment(authToken.expires_at), 'hours') >= 1) {
      accessToken = await spotify.refreshAccessTokenFromAPI();
      await spotify.saveTokensToDB({ accessToken, refreshToken: authToken.refresh_token });
      spotify.setAccessTokenOnAPIObject(accessToken);
    }

    const tokens = {
      accessToken: authToken.access_token,
      refreshToken: authToken.refresh_token,
    };
    spotify.setTokensOnAPIObject(tokens);
    return tokens;
  },

  async getTokensFromAPI(code) {
    return spotifyApi.authorizationCodeGrant(code)
      .then((response) => ({
        accessToken: response.body.access_token,
        refreshToken: response.body.refresh_token,
      }));
  },

  saveTokensToDB: async (params) => {
    try {
      const newAuth = new Authentication({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        created_at: moment.utc().format(),
        expires_at: moment.utc().add(TOKEN_DURATION_IN_HOURS, 'hour').format(),
      });
      await newAuth.save();
    } catch (error) {
      console.log('something went wrong saving auth data');
    }
  },

  setTokensOnAPIObject(params) {
    spotifyApi.setAccessToken(params.accessToken);
    spotifyApi.setRefreshToken(params.refreshToken);
  },

  setAccessTokenOnAPIObject(token) {
    spotifyApi.setAccessToken(token);
  },

  refreshAccessTokenFromAPI() {
    return spotifyApi.refreshAccessToken()
      .then((response) => response.body.access_token);
  },

  createPlaylist(name) {
    const userId = process.env.SPOTIFY_USER_ID;
    return spotifyApi.createPlaylist(userId, name, { public: true })
      .then((response) => response.body);
  },

  addTracksToPlaylist(id, tracks) {
    return spotifyApi.addTracksToPlaylist(id, tracks);
  },

  getPlaylist(id) {
    return spotifyApi.getPlaylist(id)
      .then((response) => response.body);
  },

  setPlaylistCover: async (id, image) => {
    const { accessToken } = await spotify.getAuthTokens();
    const url = `https://api.spotify.com/v1/playlists/${id}/images`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'image/jpeg',
    };
    return axios.put(url, image, { headers })
      .then((response) => response.data);
  },

  /**
   * @description returns the features for a single track
   * @param {String} tracks A single track URL (string)
   * @returns {Promise<Object>} The audio features for a track
   */
  getAudioFeaturesForTrack(trackID) {
    return spotifyApi.getAudioFeaturesForTrack(trackID)
      .then((response) => response.body);
  },
  /**
   * @description confirms that a URL is a Spotify URL
   * @param {String} trackURL the URL to be checked
   * @returns {Boolean}
   */
  isSpotifyTrack(trackURL) {
    const [, , , mediaType, id] = trackURL.split('/');
    return id && mediaType === 'track';
  },
  /**
   * @description gets the ID from a Spotify URL
   * @param {*} trackURL a valid Spotify URL
   * @returns {Number} The Spotify Track ID
   */
  getSpotifyIdFromURL(trackURL) {
    let [, , , , id] = trackURL.split('/');
    ([id] = id.split('?'));
    return id;
  },
};

module.exports = spotify;
