const mongoose = require('mongoose');
const { db: { uri: databaseURI } } = require('./index');
const logger = require('../helpers/logger');

mongoose.connect(databaseURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('open', () => {
  logger.info('Database Connected');
})
  .on('error', (err) => {
    logger.error(`Connection error: ${err.message}`);
  });
