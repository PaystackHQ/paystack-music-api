const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  service: String,
  title: String,
  artist: String,
  track_url: String,
  preview_url: String,
  trackId: String,
  isExplicit: Boolean,
  contributors: [{ type: mongoose.ObjectId, ref: 'Contributor' }],
  artists: [{ type: mongoose.ObjectId, ref: 'Artist' }],
  artist_names: String,
  analytics: mongoose.Mixed,
});
const Track = mongoose.model('2020Tracks', trackSchema, '2020Tracks');

module.exports = Track;
