const winston = require('winston');
const config = require('../config');
const slack = require('./slack');

const infoTransport = new winston.transports.Console({ level: 'info' });

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to console
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    infoTransport,
  ],
});

if (config.debugMode) {
  // we don't need the info transport in debug mode, cause the debug transport handles
  // it
  logger.remove(infoTransport);

  // - Write all logs with level `debug` and below to console and a debug file
  logger.add(new winston.transports.Console({ level: 'debug' }));
  logger.add(new winston.transports.File({ filename: 'debug.log', level: 'debug' }));
}

module.exports = {
  error(err) {
    slack.sendMonitorMessage(err);
    return logger.log('error', err.stack || err.message);
  },
  info(msg) {
    return logger.log('info', msg);
  },
  debug(msg) {
    return logger.log('debug', msg);
  },
  warn(msg) {
    return logger.log('warn', msg);
  },
};
