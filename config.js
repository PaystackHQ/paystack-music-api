require('dotenv').config();

module.exports = {
  app: {
    port: process.env.PORT,
    triggerUri: process.env.APP_TRIGGER_URI,
    resetToken: process.env.APP_RESET_TOKEN,
    setPlaylistCover: process.env.SET_PLAYLIST_COVER === 'true' || process.env.SET_PLAYLIST_COVER === true,
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
    monitoringChannel: process.env.SLACK_MONITOR_CHANNEL,
  },
  debugMode: process.env.DEBUG === 'true',
  sendPlaylistsToSlackChannel: process.env.SEND_PLAYLISTS_TO_SLACK === 'true',
};
