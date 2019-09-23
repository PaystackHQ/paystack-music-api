const axios = require('axios');

module.exports = {
  async fetchChannelHistory(month) {
    const startTime = month.startOf('month').format('X.SSSSSS');
    const endTime = month.endOf('month').format('X.SSSSSS');
    const url = `https://slack.com/api/conversations.history?token=${process.env.SLACK_TOKEN}&channel=${process.env.SLACK_CHANNEL}&oldest=${startTime}&latest=${endTime}inclusive=true&pretty=1`;
    return axios.get(url).then(response => response.data);
  },

  filterSpotifyMessages(messages) {
    const spotifyMessages = []
    messages.forEach(msg => {
      if (msg.attachments && msg.attachments.length) {
        msg.attachments.forEach(attachment => {
          if (attachment.service_name === "Spotify") {
            // attachment.service_name === "YouTube") {
            spotifyMessages.push({
              service: attachment.service_name,
              title: attachment.title,
              link: attachment.title_link
            });
          }
        });
      }
    });
    return spotifyMessages;
  },

  filterSpotifyTracks(spotifyMessages) {
    const tracks = [];
    spotifyMessages.forEach(msg => {
      const urlSplit = msg.link.split('/');
      if (urlSplit[3] === 'track') {
        tracks.push({
          ...msg,
          id: urlSplit[4],
        });
      }
    });
    return tracks.map(track => ({
      ...track,
      id: track.id.split('?')[0]
    }));
  },

  createPlaylist(token, name, description) {
    const url = 'https://api.spotify.com/v1/playlists';
    const headers = {
      Authorization: `Bearer ${process.env.SPOTIFY_TOKEN}`
    };
    return axios.post(url, {
      name,
      description,
      public: true
    }, {
      headers
    }).then(response => response.data);
  },

  getSpotifyToken() {
    const encodedToken = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY}`).toString('base64');
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedToken}`
    };
  },

  sendMessage(message) {
    const url = 'https://slack.com/api/chat.postMessage';
    const channel = process.env.SLACK_DM_ONYEKACHI;
    const headers = {
      Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
      'Content-Type': 'application/json'
    };

    return axios.post(url, {
      channel,
      text: message
    }, { headers }).then(response => response.data);
  }
};