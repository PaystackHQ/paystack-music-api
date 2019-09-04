const SpotifyWebApi = require('spotify-web-api-node');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter);

db.defaults({
  accessToken: null,
  refreshToken: null,
  expiry: null
}).write()

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

const scopes = ['playlist-modify-public'];

module.exports = {
  createAuthURL() {
    return spotifyApi.createAuthorizeURL(scopes);
  },

  async getTokensFromAPI(code) {
    return spotifyApi.authorizationCodeGrant(code).then(response +);
      return {
        expiry: response.body['expires_in'],
        accessToken: response.body['access_token'],
        refreshToken: response.body['refresh_token'],
      }
    } catch (error) {
      return null;
    }
  },

  getTokensFromDB() {
    const accessToken = db.get('accessToken').value();
    const refreshToken = db.get('refreshToken').value();
    const expiry = db.get('expiry').value();

    if (accessToken && refreshToken && expiry) {
      return {
        expiry,
        accessToken,
        refreshToken
      }
    } else {
      return null;
    }
  },

  setTokensInDB(params) {
    db.set('accessToken', params.accessToken).write();
    db.set('refreshToken', params.refreshToken).write();
    db.set('expiry', params.expiry).write();
  },

  setTokensOnAPIObject(params) {
    spotifyApi.setAccessToken(params.accessToken);
    spotifyApi.setRefreshToken(params.refreshToken);
  },

  async refreshTokensFromAPI() {
    try {
      const response = await spotifyApi.refreshAccessToken();
      return {
        expiry: response.body['expires_in'],
        accessToken: response.body['access_token'],
        refreshToken: response.body['refresh_token'],
      };
    } catch (error) {
      return null
    }
  },

  async createPlaylist(name, tokens) {
    this.setTokensOnAPIObject(tokens);
    const userId = process.env.SPOTIFY_USER_ID;
    const response = await spotifyApi.createPlaylist(userId, name, { 'public' : true });
    return response;
  }
};