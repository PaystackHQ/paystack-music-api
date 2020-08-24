const logger = require('../helpers/logger');
const slack = require('../helpers/slack');

/**
 * Method to return 5xx errors
 * @param {*} res
 * @param {*} error
 */
const serverErrorResponse = (res, error, code = 500) => {
  logger.error(error);
  slack.sendMonitorMessage(error);
  return res.status(code).send({ success: false, message: 'An error occurred' });
};

module.exports = serverErrorResponse;
