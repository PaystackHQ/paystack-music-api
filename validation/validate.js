const handleErrorResponse = (error) => ({
  status: false, message: error?.details[0]?.message,
});

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
  const { error } = schema.validate(dataToValidate, { stripUnknown: true });
  if (error) {
    const { status, message } = handleErrorResponse(error);
    return res.status(400).send({ status, message });
  }
  return next();
};

module.exports = { validate };
