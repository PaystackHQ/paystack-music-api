const logger = require('../helpers/logger');
const slack = require('../helpers/slack');

/**
 * Handler for success responses
 * @param {Object} res
 * @param {Number} code
 * @param {String} message
 * @param {Array|Object} data
 */
const successResponse = (res, code, message, data) => (
  res.status(code).send({ success: true, message, data })
);

/**
 * Method to return client error responses
 * @param {Object} res
 * @param {Number} code
 * @param {String} message
 */
const clientErrorResponse = (res, code, message) => (
  res.status(code).send({ success: false, message })
);

/**
 * Method to return 5xx errors
 * @param {Object} res
 * @param {Object} error
 * @param {Number} code
 */
const serverErrorResponse = (res, error, code = 500) => {
  logger.error(error);
  slack.sendMonitorMessage(error);
  return res.status(code).send({ success: false, message: 'An error occurred' });
};

module.exports = {
  successResponse,
  clientErrorResponse,
  serverErrorResponse,
};
