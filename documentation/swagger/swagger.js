const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paystack Music API',
      version: '1.0.0',
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = options;
