const axios = require('axios');
const moment = require('moment');

module.exports = {
  async fetchSlackHistory() {
    const startTime = moment('2019-08').startOf('month').format('X.SSSSSS');
    const endTime = moment('2019-08').endOf('month').format('X.SSSSSS');
    const url = `https://slack.com/api/conversations.history?token=${process.env.SLACK_TOKEN}&channel=${process.env.SLACK_CHANNEL}&oldest=${startTime}&latest=${endTime}inclusive=true&pretty=1`;
    return axios.get(url).then(response => response.data);
  },
  
  filterSpotifyMessages(messages) {
    const songs = []
    messages.forEach(msg => {
      if (msg.attachments && msg.attachments.length) {
        msg.attachments.forEach(attachment => {
          if (attachment.service_name === "Spotify") {
            // attachment.service_name === "YouTube") {
            songs.push({ 
              service: attachment.service_name, 
              title: attachment.title, 
              link: attachment.title_link 
            });
          }
        });
      }
    });
    return songs;
  },
  
  filterSpotifyTracks(spotifyMessages) {
    return 
  },
  
  fetchTrackId(track) {
    
  }
};