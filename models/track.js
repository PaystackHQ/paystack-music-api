const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  service: String,
  title: String,
  url: String,
  trackId: String,
  contributors: [{type: mongoose.ObjectId, ref: 'Contributor'}],
});
const Track = mongoose.model('Track', trackSchema, 'tracks');

module.exports = Track;
