/* eslint-disable no-unused-vars */
const path = require('path');

const spotify = require('../helpers/spotify');
const serverMethods = require('../helpers/server-methods');
const slack = require('../helpers/slack');
const resetScript = require('../scripts/reset');
const logger = require('../helpers/logger');

const { app: appConfig } = require('../config');

module.exports = {

  index: async (req, res) => {
    const html = `
          <!DOCTYPE html>
          <html>
            <head></head>
            <body>
              <h1>Welcome to Paystack Music!</h1>
              <p>Visit <a href="/authorize">/authorize</a> to get started if you're not logged in already</p>
            </body>
          </html>
        `;
    res.send(html);
  },

  authorize: async (req, res) => {
    const authURL = spotify.createAuthURL();
    const html = `
          <!DOCTYPE html>
          <html>
            <head></head>
            <body>
              <h1>Hello!</h1>
              <p>Please make sure you're logged into Spotify</p>
              <a target="_blank" href="${authURL}">Click here to authorize</a>
            </body>
          </html>
        `;
    res.send(html);
  },

  callback: async (req, res) => {
    try {
      const { code } = req.query;
      await spotify.performAuthentication(code);

      const html = `
            <!DOCTYPE html>
            <html>
              <head></head>
              <body>
                <h1>All done!</h1>
                <p>Send a POST request to <a target="_blank" href="#">${appConfig.triggerUri}</a> with the parameters { year (yyyy), month (mm), day (dd) } to generate a playlist.</p>
                </br>
                <p>NB: Playlists are generated for the month <b>before</b> the date specified in your request params</p>
              </body>
            </html>
          `;
      res.send(html);
    } catch (error) {
      logger.error(error);
      res.send({
        message: 'Callback failed, it\'s probably an authentication issue',
      });
    }
  },

  trigger: async (req, res) => {
    try {
      const { day, month, year } = req.body;
      const { status, message, code } = await serverMethods.trigger({ day, month, year });
      return res.status(code).send({ status, message });
    } catch (error) {
      const stringError = JSON.stringify(error);
      slack.sendMonitorMessage(stringError);
      return res.status(500).send({
        message: 'Trigger is broken, check Slack',
        error,
      });
    }
  },

  clearAuth: async (req, res) => {
    try {
      const clearedAuth = await spotify.clearAuthentication();
      return res.status(200).send({
        message: 'Authentication cleared',
        data: clearedAuth,
      });
    } catch (err) {
      slack.sendMonitorMessage(JSON.stringify(err));
      return res.status(500).send({
        message: 'An error occurred while trying to clear authentication',
        err,
      });
    }
  },

  getPlaylistByID: async (req, res) => {
    try {
      const { id } = req.params;

      const playlist = await spotify.findPlaylist(id);
      if (!playlist) {
        return res.status(404).send({
          status: false,
          message: 'Playlist not found',
        });
      }
      return res.status(200).send({
        status: true,
        data: playlist,
      });
    } catch (err) {
      logger.error(err);
      return res.status(500).send({ message: 'An error occurred' });
    }
  },

  covers: (req, res) => {
    res.sendFile(path.join(`${__dirname}/../views/covers.html`));
  },

  reset: async (req, res) => {
    try {
      const { resetToken } = req.body;

      if (appConfig.resetToken !== resetToken) {
        res.status(401).send({
          status: false,
          message: 'You dey whine me?',
        });
        return;
      }

      // Response is sent here
      res.status(200).send({
        status: true,
        message: 'Resetting the playlist. Check #feed-music-api-monitors for results/errors.',
      });

      // Post-processing
      slack.sendMonitorMessage('Resetting Playlists..');

      const results = await resetScript.run();

      slack.sendMonitorMessage(`Finished resetting playlists with status ${JSON.stringify(results)}`);

      return;
    } catch (err) {
      // We aren't sending any 500 response because this is a post-process flow
      logger.error(err);
      slack.sendMonitorMessage(err);
    }
  },

  webhook: (req, res) => { },

  wrappedGetTopArtists: async (req, res) => {
    try {
      const limit = req.query.limit || 3;
      const { year } = req.query;

      const data = await serverMethods.getTopArtists({ year, limit });

      return res.status(200).send({
        status: true,
        data,
      });
    } catch (err) {
      logger.error(err);
      slack.sendMonitorMessage(err);
      return res.status(500).send({ message: 'An error occurred' });
    }
  },

  wrappedGetContributorTopArtists: async (req, res) => {
    try {
      const limit = req.query.limit || 3;
      const { year, name } = req.query;

      const contributor = await serverMethods.getContributorByName({ name });

      if (!contributor) {
        return res.status(400).send({
          status: false,
          message: 'We could not find any contributor with this name.',
        });
      }

      // eslint-disable-next-line no-underscore-dangle
      const results = await serverMethods.getContributorTopArtists(year, contributor._id, limit);

      const { about, profile_image: profileImage } = contributor;

      const data = {
        contributor: { name, about, profileImage },
        artists: results,
      };

      return res.status(200).send({
        status: true,
        data,
      });
    } catch (err) {
      logger.error(err);
      slack.sendMonitorMessage(err);
      return res.status(500).send({ message: 'An error occurred' });
    }
  },
};
