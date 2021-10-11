const validator = require('validator');

const handleErrorResponse = (error) => ({
  status: false, message: error && error.details[0] && error.details[0].message,
});

const sanitizeInput = (input) => Object.entries(input).reduce((sanitizedInput, [key, value]) => {
  // sanitize only string input
  const sanitizedValue = typeof value === 'string' ? validator.escape(value) : value;
  return { ...sanitizedInput, [key]: sanitizedValue };
}, {});

/**
 * @description returns the data to be validated for a request
 * @param {Object} req The Express Request Object
 * @param {String} bodyParamsOrQuery determines what part of the request should be validated
 * @returns {Object}
 */
const getDataToValidate = (req, bodyParamsOrQuery) => {
  const { body, query, params } = req;
  if (bodyParamsOrQuery === 'query') {
    return query;
  }
  if (bodyParamsOrQuery === 'params') {
    return params;
  }
  return body;
};

const validate = (schema, bodyParamsOrQuery = 'body') => (req, res, next) => {
  if (!schema) return next();
  const dataToValidate = getDataToValidate(req, bodyParamsOrQuery);
  const { error, value } = schema.validate(dataToValidate, { stripUnknown: true });
  if (error) {
    const { status, message } = handleErrorResponse(error);
    return res.status(400).send({ status, message });
  }
  req[bodyParamsOrQuery] = sanitizeInput(value);
  return next();
};

module.exports = { validate, sanitizeInput };
