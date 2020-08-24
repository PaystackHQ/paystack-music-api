/**
 * Handler for success responses
 * @param {*} res 
 * @param {*} code 
 * @param {*} message 
 * @param {*} data 
 */
const successResponse = (res, code, message, data) => {
  return res.status(code).send({ success: false, message, data });
};

module.exports = successResponse;
