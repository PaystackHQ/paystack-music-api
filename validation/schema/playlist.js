const Joi = require('@hapi/joi');

module.exports = {
  getPlaylistByIdParams: Joi.object().keys({
    id: Joi.string().required(),
  }),
};
