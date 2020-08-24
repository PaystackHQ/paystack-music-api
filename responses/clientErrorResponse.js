/**
 * Method to return client error responses
 * @param {*} res
 * @param {*} code
 * @param {*} message
 */

/* eslint-disable-next-line max-len */
const clientErrorResponse = (res, code, message) => res.status(code).send({ success: false, message });

module.exports = clientErrorResponse;
