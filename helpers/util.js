const moment = require('moment');

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} Array to split
 * @param chunkSize {number} Size of every group
 */
function chunkArray(myArray, chunkSize) {
  const results = [];

  while (myArray.length) {
    results.push(myArray.splice(0, chunkSize));
  }

  return results;
}

/**
 * Gets the first day of the past x months
 * @param {number} duration - number of months to backtrack
 * @returns {Array} - e.g. [ { date: 01, month: 02, year: 2020 }, ... ]
 */
function fetchPastMonths(duration) {
  const months = [];

  const dateEnd = moment();
  const dateStart = moment().subtract(duration, 'month');

  while (dateEnd.diff(dateStart, 'months') >= 0) {
    months.push({
      day: 1, // we only need the first day
      month: dateStart.month() + 1,
      year: dateStart.year(),
    });
    dateStart.add(1, 'month');
  }
  return months;
}

/**
 * Sleep in ms
 * @param {number} durationInMs
 */
function sleep(durationInMs) {
  return new Promise((r) => setTimeout(r, durationInMs));
}

/**
 *
 * capture app termination / restart events
 * To be called when process is restarted or terminated
 * @param {string} msg
 * @param {string} cb
 */
function gracefulShutdown(conn, msg, infoLogger) {
  conn.disconnect();
  infoLogger(`Mongoose disconnected through ${msg}`);
}

/**
 * @description prepends 0 to a number if it is less than 10
 * @param {String|Number} time time period to prepend zero to
 * @returns {Number}
 */
const prependZeroIfLessThanTen = (time) => {
  const numericTime = Number(time);
  return numericTime < 10 ? `0${numericTime}` : numericTime;
};

/**
 * @description returns formatted date
 * @param {String|Number} param0{day}
 * @param {String|Number} param1{month}
 * @param {String|Number} param2{year}
 */
const getFormattedDate = ({ day, month, year }) => {
  const [dateMonth, dateDay] = [month, day].map(prependZeroIfLessThanTen);
  return `${year}-${dateMonth}-${dateDay}`;
};

module.exports = {
  chunkArray,
  fetchPastMonths,
  sleep,
  gracefulShutdown,
  getFormattedDate,
};
