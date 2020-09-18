const moment = require('moment');
const config = require('../config');
const slack = require('./slack');
const spotify = require('./spotify');
const color = require('./color');
const image = require('./image');
const util = require('./util');
const Playlist = require('../models/playlist');

const trigger = async ({ day, month, year }) => {
  const { status, message, code } = await spotify.performAuthentication();
  if (!status) {
    return { status, message, code };
  }

  const date = util.getFormattedDate({ day, month, year });
  const playlistMonth = moment(date).subtract(1, 'months');
  const playlistName = spotify.generatePlaylistName(playlistMonth);

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

  if (!(history.messages && history.messages.length)) {
    return {
      status: false,
      code: 404,
      message: 'Could not find any messages. Please check the channel and try again.',
    };
  }

  const spotifyMessages = slack.filterSpotifyMessages(history.messages);
  const tracks = slack.filterSpotifyTracks(spotifyMessages);
  const [contributors, playlist] = await Promise.all([
    slack.saveContributors(tracks),
    spotify.createPlaylist(playlistName),
  ]);
  playlist.date_added = playlistMonth.utc().toDate();
  const savedPlaylist = await spotify.savePlaylist(playlist, contributors);

  await Promise.all([
    spotify.saveTracks(tracks, savedPlaylist),
    spotify.getAudioAnalyticsForTracks(tracks),
    spotify.getPreviewUrlForTracks(tracks),
  ]);

  // and songs to playlist
  const trackURIs = tracks.map((track) => `spotify:track:${track.trackId}`);

  // upload in batches of 99
  const batchSize = 99;
  for (let i = 0; i < trackURIs.length; i += batchSize) {
    const batch = trackURIs.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    await spotify.addTracksToPlaylist(playlist.id, batch);
  }
  // get playlist cover art
  const fetchedPlaylist = await spotify.getPlaylist(playlist.id);
  const [{ url: coverImageUrl }] = fetchedPlaylist.images;

  // pick color from current cover art
  const dominantColor = await color.getBackgroundColorFromImage(coverImageUrl);

  // save the playlist color
  await Playlist
    .findOneAndUpdate({ spotifyId: fetchedPlaylist.id }, { hex: dominantColor }, { upsert: true });

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
    await spotify.setPlaylistCover(fetchedPlaylist.id, newCoverImage);
  }

  if (config.sendPlaylistsToSlackChannel) {
    // send playlist to slack
    await slack.sendMessage(fetchedPlaylist.external_urls.spotify);
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
