const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: String,
  description: String,
  url: String,
  spotifyId: String,
  date: Date,
  tracks: [{ type: mongoose.ObjectId, ref: 'Track' }],
  contributors: [mongoose.ObjectId],
});
const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
