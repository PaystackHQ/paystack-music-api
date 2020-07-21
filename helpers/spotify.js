const SpotifyWebApi = require('spotify-web-api-node');
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');
const axios = require('axios');

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

const scopes = ['playlist-modify-public', 'ugc-image-upload'];

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
    return spotifyApi.createPlaylist(userId, name, { 'public': true })
      .then(response => response.body);
  },

  addTracksToPlaylist(id, tracks) {
    return spotifyApi.addTracksToPlaylist(id, tracks);
  },

  getPlaylist(id) {
    return spotifyApi.getPlaylist(id)
      .then(response => response.body);
  },

  setPlaylistCover (id, image) {
    const url = `https://api.spotify.com/v1/playlists/${id}/images`;
    const headers = {
      Authorization: `Bearer ${db.get('accessToken').value()}`,
      "Content-Type": "image/jpeg",
    };
    return axios.put(url, image, { headers })
      .then(response => response.data);
  }, 

  /**
   * @description returns the features for a single track
   * @param {String} tracks A single track URL (string)
   * @returns {Promise<Object>} The audio features for a track
   */
  getTrackFeatures(trackID) {
    return spotifyApi.getAudioFeaturesForTrack(trackID)
      .then(response => response.body);
  },
  /**
   * @description confirms that a URL is a Spotify URL
   * @param {String} trackURL the URL to be checked
   * @returns {Boolean}
   */
  isSpotifyTrack (trackURL) {
    let [, , , mediaType, id] = trackURL.split('/');
    return id && mediaType === 'track';
  },
  /**
   * @description gets the ID from a Spotify URL
   * @param {*} trackURL a valid Spotify URL
   * @returns {Number} The Spotify Track ID
   */
  getSpotifyId (trackURL) {
    let [, , , , id] = trackURL.split('/');
    ([ id ] = id.split('?'));
    return id;
  },
};