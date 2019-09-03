const SpotifyWebApi = require('spotify-web-api-node');

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

  async getTokens(code) {
    try {
      const response = await spotifyApi.authorizationCodeGrant(code);
      return {
        expiry: response.body['expires_in'],
        accessToken: response.body['access_token'],
        refreshToken: response.body['refresh_token'],
      }
    } catch (error) {
      return null;
    }
  }
};