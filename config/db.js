const mongoose = require('mongoose');
const { db: { uri: databaseURI } } = require('./index');
const logger = require('../helpers/logger');
const { gracefulShutdown } = require('../helpers/util');

const conn = async function connection() {
  logger.info('connecting to database');
  await mongoose.connect(databaseURI);
};

try {
  conn();
} catch (error) {
  logger.error(error);
}

// graceful shutdown for nodemon restarts
process.once('SIGUSR2', () => {
  gracefulShutdown(conn, 'nodemon restart', logger.info, () => {
    process.kill(process.pid, 'SIGUSR2');
  });
});

// graceful shutdown for app termination
process.on('SIGINT', () => {
  gracefulShutdown(conn, 'app termination', logger.info, () => {
    process.exit(0);
  });
});

module.exports = conn;
