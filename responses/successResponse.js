/**
 * Handler for success responses
 * @param {*} res
 * @param {*} code
 * @param {*} message
 * @param {*} data
 */

/* eslint-disable-next-line max-len */
const successResponse = (res, code, message, data) => res.status(code).send({ success: false, message, data });

module.exports = successResponse;
