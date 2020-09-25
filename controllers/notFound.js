const { clientErrorResponse } = require('../responses');

/**
 * Controller for handling routes that don't exist
 * @param {*} req
 * @param {*} res
 */
const notFound = (req, res) => clientErrorResponse(res, 400, 'This route doesn\'t exist yet');

module.exports = notFound;
