const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  service: String,
  title: String,
  url: String,
  trackId: String,
  contributors: [mongoose.ObjectId],
  playlist: { type: mongoose.ObjectId, ref: 'Playlist' },
});
const Track = mongoose.model('Track', trackSchema);

module.exports = Track;
