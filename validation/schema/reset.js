const Joi = require('@hapi/joi');

module.exports = {
  resetBody: Joi.object().keys({
    resetToken: Joi.string().required(),
  }),
};
