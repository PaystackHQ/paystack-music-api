const mongoose = require('mongoose');
const { db: { uri: databaseURI } } = require('./index');
const logger = require('../helpers/logger');
const { gracefulShutdown } = require('../helpers/util');

async function connect() {
  logger.info('connecting to database');
  return mongoose.connect(databaseURI);
}

let connection = null;

(async () => {
  try {
    connection = await connect();
    logger.info('connected to database');
  } catch (error) {
    logger.error(error);
  }
})();

// graceful shutdown for nodemon restarts
process.once('SIGUSR2', () => {
  gracefulShutdown(connection, 'nodemon restart', logger.info);
  process.kill(process.pid, 'SIGUSR2');
});

// graceful shutdown for app termination
process.on('SIGINT', () => {
  gracefulShutdown(connection, 'app termination', logger.info);
  process.exit(0);
});
