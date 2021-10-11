const mongoose = require('mongoose');
const { db: { uri: databaseURI } } = require('./index');
const logger = require('../helpers/logger');
const { gracefulShutdown } = require('../helpers/util');

mongoose.connect(databaseURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

const conn = mongoose.connection;

conn.on('open', () => {
  logger.info('Database Connected');
});

conn.on('error', (err) => {
  logger.error(`Connection error: ${err.message}`);
});

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
