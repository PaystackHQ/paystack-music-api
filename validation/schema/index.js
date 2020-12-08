const Joi = require('@hapi/joi');
const { getPlaylistByIdParams } = require('./playlist.js');
const { resetBody } = require('./reset');
const { getAudioFeaturesParams, getTrackDataBody } = require('./track');

module.exports = {
  trigger: Joi.object().keys({
    day: Joi.number().integer().min(1).max(31)
      .required(),
    month: Joi.number().integer().min(1).max(12)
      .required(),
    year: Joi.number().required(),
  }),
  callbackQuery: Joi.object().keys({
    code: Joi.string().required(),
  }),
  wrappedGetTopArtists: Joi.object().keys({
    limit: Joi.number(),
    year: Joi.number().required(),
  }),
  wrappedGetContributorTopArtists: Joi.object().keys({
    limit: Joi.number(),
    // matches a string with one space and possibly a hyphen
    name: Joi.string().regex(/[a-zA-Z\- ]/).required(),
    year: Joi.number().required(),
  }),
  getPlaylistByIdParams,
  resetBody,
  getAudioFeaturesParams,
  getTrackDataBody,
};
