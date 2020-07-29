const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  service: String,
  title: String,
  url: String,
  trackId: String,
  contributors: [mongoose.ObjectId],
  playlist: mongoose.ObjectId,
});
const Track = mongoose.model('Track', trackSchema);

module.exports = Track;
