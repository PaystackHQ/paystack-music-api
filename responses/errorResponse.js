const logger = require('../helpers/logger');

const errorResponse = (res, err) => {
  logger.error(err);
  return res.status(500).send({ success: false, message: 'An error occurred' });
};

module.exports = errorResponse;
