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
  const responses = [];
  const months = util.fetchPastMonths(12);
  for (let i = 0; i < months.length; i += 1) {
    const pastMonth = months[i];
    const { day, month, year } = pastMonth;
    const response = await serverMethods.trigger({ day, month, year });
    responses.push(response);
    await util.sleep(800);
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
