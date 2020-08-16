const Joi = require('@hapi/joi');

module.exports = {
  getAudioFeaturesParams: Joi.object().keys({
    id: Joi.string().required(),
  }),
  getTrackDataBody: Joi.object().keys({
    spotify_ids: Joi.array().items(Joi.string()).required(),
  }),
};
