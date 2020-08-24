/**
 * Method to return client error responses
 * @param {*} res 
 * @param {*} code 
 * @param {*} message 
 */
const clientErrorResponse = (res, code, message) => {
  return res.status(code).send({ success: false, message });
};

module.exports = clientErrorResponse;
