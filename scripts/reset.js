// Fetches all the playlists, contributors, artists, tracks from scratch.

const Track = require('../models/track');
const Contributor = require('../models/contributor');
const Playlist = require('../models/playlist');
const serverMethods = require('../helpers/server-methods');
const util = require('../helpers/util');

const deletionQueries = [
  Track.deleteMany({}),
  Contributor.deleteMany({}),
  Playlist.deleteMany({}),
];

const trigger = async () => {
  const responses = [];
  const months = util.fetchPastMonths(12);
  for (let i = 0; i < months.length; i += 1) {
    const pastMonth = months[i];
    const { day, month, year } = pastMonth;
    const response = await serverMethods.trigger({ day, month, year });
    responses.push(response);
    await util.sleep(500);
  }
  return responses;
};

const run = async () => {
  await Promise.all(deletionQueries);
  return trigger();
};

module.exports = {
  run,
};
