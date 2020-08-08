const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
  name: String,
  profile_image: String,
  about: String,
  slackId: String,
});
const Contributor = mongoose.model('Contributor', contributorSchema);

module.exports = Contributor;
