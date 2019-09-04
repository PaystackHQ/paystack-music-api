const SpotifyWebApi = require('spotify-web-api-node');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter);

db.defaults({
  accessToken: null,
  refreshToken: null,
  timestamp: null
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
    return spotifyApi.authorizationCodeGrant(code)
      .then(response => {
        return {
          timestamp: Date.now(),
          accessToken: response.body['access_token'],
          refreshToken: response.body['refresh_token'],
        }
      });
  },

  getTokensFromDB() {
    const accessToken = db.get('accessToken').value();
    const refreshToken = db.get('refreshToken').value();
    const timestamp = db.get('timestamp').value();
    return {
      timestamp,
      accessToken,
      refreshToken
    }
  },

  setTokensInDB(params) {
    db.set('accessToken', params.accessToken).write();
    db.set('refreshToken', params.refreshToken).write();
    db.set('timestamp', params.timestamp).write();
  },

  setAccessTokenInDB(token) {
    db.set('accessToken', token).write();
    db.set('timestamp', Date.now()).write();
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
      .then(response => response.body['access_token']);
  },

  createPlaylist(name) {
    const userId = process.env.SPOTIFY_USER_ID;
    return spotifyApi.createPlaylist(userId, name, {
      'public': true
    }).then(response => response.body);
  },

  addTracksToPlaylist(id, tracks) {
    return spotifyApi.addTracksToPlaylist(id, tracks);
  }
};