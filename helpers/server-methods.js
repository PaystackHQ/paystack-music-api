const moment = require('moment');
const config = require('../config');
const slack = require('./slack');
const spotify = require('./spotify');
const color = require('./color');
const image = require('./image');
const logger = require('./logger');
const Playlist = require('../models/playlist');

const trigger = async ({ day, month, year }) => {
  if (!(day && month && year)) {
    return { status: false, code: 400, message: 'Parameters "day", "month" and "year" are required' };
  }
  await spotify.performAuthentication();

  const dateMonth = Number(month) < 10 ? `0${Number(month)}` : month;
  const dateDay = Number(day) < 10 ? `0${Number(day)}` : day;

  const date = `${year}-${dateMonth}-${dateDay}`;
  const playlistMonth = moment(date).subtract(1, 'months');
  const playlistName = playlistMonth.format('MMMM YYYY');
  // Search for an existing playlist before continueing the playlist creation process.
  // A case insensitive search is used for completeness.
  // Please see https://github.com/PaystackHQ/paystack-music-api/pull/15#discussion_r467569438
  // for more context.
  const playlistExists = await Playlist.findOne({ name: new RegExp(`^${playlistName}$`, 'i') });
  if (playlistExists) {
    return {
      status: false,
      code: 409,
      message: 'The playlist for this month has already been created',
    };
  }
  const history = await slack.fetchChannelHistory(playlistMonth);
  logger.debug('Fetched channel history');

  if (!(history.messages && history.messages.length)) {
    return {
      status: false,
      code: 404,
      message: 'Could not find any messages. Please check the channel and try again.',
    };
  }

  const spotifyMessages = slack.filterSpotifyMessages(history.messages);
  const tracks = slack.filterSpotifyTracks(spotifyMessages);
  const contributors = await slack.saveContributors(tracks);
  logger.debug('Saved contributors');
  // create new playlist
  let playlist = await spotify.createPlaylist(playlistName);
  playlist.date_added = playlistMonth.utc().toDate();
  logger.debug('Created spotify playlist');
  const savedPlaylist = await spotify.savePlaylist(playlist, contributors);
  logger.debug('Saved spotify playlist');
  await spotify.saveTracks(tracks, savedPlaylist);
  logger.debug('Saved tracks');
  await spotify.getAudioFeaturesForTracks(tracks);
  await spotify.getPreviewUrlForTracks(tracks);
  logger.debug('Fetched audio features for tracks');

  // and songs to playlist
  const trackURIs = tracks.map((track) => `spotify:track:${track.id}`);

  // upload in batches of 99
  const batchSize = 99;
  for (let i = 0; i < trackURIs.length; i += batchSize) {
    const batch = trackURIs.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    await spotify.addTracksToPlaylist(playlist.id, batch);
  }
  // get playlist cover art
  playlist = await spotify.getPlaylist(playlist.id);
  logger.debug('Fetched playlist');
  const coverImageUrl = playlist.images[0].url;

  // pick color from current cover art
  const dominantColor = await color.getBackgroundColorFromImage(coverImageUrl);

  // save the playlist color
  await Playlist
    .findOneAndUpdate({ spotifyId: playlist.id }, { hex: dominantColor }, { upsert: true });
  logger.debug('Saved playlist color');

  // This is necessary because Chromium is causing issues and we don't need the cover
  // (for now)
  if (config.app.setPlaylistCover) {
    // create new cover art
    const newCoverImage = await image.generateCoverImage({
      color: dominantColor,
      month: playlistMonth.format('MMMM'),
      year: playlistMonth.format('YYYY'),
    });

    // attach album art to playlist
    await spotify.setPlaylistCover(playlist.id, newCoverImage);
    logger.debug('Set playlist cover');
  }

  if (config.sendPlaylistsToSlackChannel) {
    // send playlist to slack
    await slack.sendMessage(playlist.external_urls.spotify);
    await slack.sendMessage(`There were ${history.messages.length} messages in the music channel for ${playlistMonth.format('MMMM')} ${playlistMonth.format('YYYY')}`);
  }

  // finish
  return {
    status: true,
    code: 200,
    message: `${playlistName} playlist, check spotify (or your Slack DMs if you're Kachi :))`,
  };
};

module.exports = {
  trigger,
};
