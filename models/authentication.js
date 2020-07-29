const mongoose = require('mongoose');

const { Schema } = mongoose;

const authenticationSchema = new Schema({
  access_token: String,
  refresh_token: String,
  created_at: Date,
  expires_at: Date,
});

const Authentication = mongoose.model('Authentication', authenticationSchema);
module.exports = Authentication;
