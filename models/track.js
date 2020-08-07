const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  service: String,
  title: String,
  artist: String,
  track_url: String,
  preview_url: String,
  trackId: String,
  duration: Number,
  isExplicit: Boolean,
  contributors: [{ type: mongoose.ObjectId, ref: 'Contributor' }],
  artists: [{ type: mongoose.ObjectId, ref: 'Artist' }],
  analytics: mongoose.Mixed,
});
const Track = mongoose.model('Track', trackSchema, 'tracks');

module.exports = Track;
