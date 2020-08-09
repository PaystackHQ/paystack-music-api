require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT,
    triggerUri: process.env.APP_TRIGGER_URI,
  },
  db: {
    uri: process.env.DB_URI,
  },
  spotify: {
    token: process.env.SPOTIFY_TOKEN,
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    userId: process.env.SPOTIFY_USER_ID,
    tokenSecret: process.env.TOKEN_SECRET,
    clientToken: process.env.SPOTIFY_CLIENT_TOKEN,
  },
  slack: {
    token: process.env.SLACK_TOKEN,
    sourceChannel: process.env.SLACK_SOURCE_CHANNEL,
    targetChannel: process.env.SLACK_TARGET_CHANNEL,
  },
  debugMode: process.env.DEBUG === 'true',
};
