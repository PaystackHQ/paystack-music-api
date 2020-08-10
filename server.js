// server.js
// where your node app starts

// init project
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const path = require('path');
const { app: appConfig } = require('./config');
const logger = require('./helpers/logger');
const spotify = require('./helpers/spotify');
const serverMethods = require('./helpers/server-methods');
const slack = require('./helpers/slack');
const resetScript = require('./scripts/reset');

require('./db');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
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
});

app.get('/authorize', async (req, res) => {
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
});

app.get('/callback', async (req, res) => {
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
    res.send(JSON.stringify(error));
  }
});

app.post('/trigger', async (req, res) => {
  try {
    const { day, month, year } = req.body;
    const { status, message, code } = await serverMethods.trigger({ day, month, year });
    return res.status(code).send({ status, message });
  } catch (error) {
    const e = { message: error.message, stack: error.stack };
    slack.sendMonitorMessage(JSON.stringify(e));
    return res.send(JSON.stringify(e));
  }
});

app.get('/playlist/:id', async (req, res) => {
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
    return res.status(500).send({ message: 'An error occurred' });
  }
});

app.get('/playlists', async (req, res) => {
  try {
    const playlists = await spotify.findAllPlaylists();
    return res.status(200).send({
      status: true,
      data: playlists,
    });
  } catch (err) {
    return res.status(500).send({ message: 'An error occurred' });
  }
});

app.get('/covers', (req, res) => {
  res.sendFile(path.join(`${__dirname}/views/covers.html`));
});

app.get('/track/:id/audio-features', async (req, res) => {
  try {
    const { id: trackId } = req.params;
    if (!trackId) {
      return res.status(400).send({
        status: false,
        message: '"track_id" is required',
      });
    }

    await spotify.performAuthentication();
    const trackFeatures = await spotify.getAudioFeaturesForTrack(trackId);
    return res.status(200).send({
      status: true,
      data: trackFeatures,
    });
  } catch (err) {
    return res.status(500).send({ message: 'An error occurred' });
  }
});

app.post('/track/data', async (req, res) => {
  try {
    const { track_ids: ids } = req.body;
    if (!ids && !Array.isArray(ids)) {
      return res.status(400).send({
        status: false,
        message: '"track_ids" is required',
      });
    }

    const result = await spotify.performAuthentication();
    if (result && result.code === 401) {
      return res.status(401).send({ message: result.message });
    }

    const data = await spotify.getTrackData(ids);

    return res.status(200).send({
      status: true,
      data,
    });
  } catch (err) {
    return res.status(500).send({ message: 'An error occurred' });
  }
});

app.post('/reset', async (req, res) => {
  try {
    const { resetToken } = req.body;

    if (appConfig.resetToken !== resetToken) {
      res.status(401).send({
        status: false,
        message: 'You dey whine me?',
      });
      return;
    }

    // Reponse is sent here
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
    slack.sendMonitorMessage(JSON.stringify(err));
  }
});

// eslint-disable-next-line no-unused-vars
app.post('/webhook', (req, res) => {

});

// listen for requests :)
const listener = app.listen(appConfig.port, () => {
  logger.info(`Your app is listening on port ${listener.address().port}`);
});
