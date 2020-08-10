const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: String,
  url: String,
  spotifyId: { type: String, index: true, unique: true },
});
const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;
