const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  service: String,
  title: String,
  artist: String,
  track_url: String,
  trackId: String,
  contributors: [{type: mongoose.ObjectId, ref: 'Contributor'}],
  analytics: mongoose.Mixed,
});
const Track = mongoose.model('Track', trackSchema, 'tracks');

module.exports = Track;
