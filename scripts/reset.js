// Fetches all the playlists, contributors, artists, tracks from scratch.

const Artist = require('../models/artist');
const Track = require('../models/track');
const Contributor = require('../models/contributor');
const Playlist = require('../models/playlist');
const serverMethods = require('../helpers/server-methods');
const util = require('../helpers/util');

const deletionQueries = [
  Artist.deleteMany({}),
  Track.deleteMany({}),
  Contributor.deleteMany({}),
  Playlist.deleteMany({}),
];

const trigger = async () => {
  const months = util.fetchPastMonths(12);
  // reduce over map/foreach because we need the playlists to be generated sequentially
  const responses = months.reduce(async (accPromise, cur) => {
    await util.sleep(800);
    const acc = await accPromise;
    const { day, month, year } = cur;
    const response = await serverMethods.trigger({ day, month, year });
    return [...acc, response];
  }, Promise.resolve([]));
  return responses;
};

const run = async () => {
  await Promise.all(deletionQueries);
  return trigger();
};

module.exports = {
  run,
};
