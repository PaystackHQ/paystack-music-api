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
        accessToken: response.body['expires_in']
      }
    } catch (error) {

    }
  }
};
