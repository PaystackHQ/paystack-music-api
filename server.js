// server.js
// where your node app starts

// init project
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const path = require('path');
const { app: appConfig } = require('./config');
const logger = require('./helpers/logger');

const controllers = require('./controllers/index');

require('./db');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', controllers.index);

app.get('/authorize', controllers.authorize);

app.get('/callback', controllers.callback);

app.post('/trigger', controllers.trigger);

app.get('/playlist/:id', controllers.getPlaylistByID);

app.get('/playlists', controllers.getAllPlaylists);

app.get('/covers', controllers.covers);

app.get('/track/:id/audio-features', controllers.getTrackAudioFeatures);

app.post('/track/data', controllers.getTrackData);

app.post('/reset', controllers.reset);

// eslint-disable-next-line no-unused-vars
app.post('/webhook', controllers.webhook);

// listen for requests :)
const listener = app.listen(appConfig.port, () => {
  logger.info(`Your app is listening on port ${listener.address().port}`);
});
