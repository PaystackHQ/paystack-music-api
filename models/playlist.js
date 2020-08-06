const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: String,
  description: String,
  url: String,
  spotifyId: String,
  date_added: Date,
  tracks: [{ type: mongoose.ObjectId, ref: 'Track' }],
  contributors: [{ type: mongoose.ObjectId, ref: 'Contributor' }],
});
const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
