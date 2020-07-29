const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
  name: String,
  photoUrl: String,
  slackId: String,
});
const Contributor = mongoose.model('Contributor', contributorSchema);

module.exports = Contributor;
