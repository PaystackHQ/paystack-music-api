const express = require('express');

const router = express();

const controllers = require('../controllers');

router.get('/', controllers.index);

router.get('/authorize', controllers.authorize);

router.get('/callback', controllers.callback);

router.post('/trigger', controllers.trigger);

// TODO:: This needs to be changed to /playlists/:id for it to live in the playlists router.
router.get('/playlist/:id', controllers.getPlaylistByID);

router.get('/covers', controllers.covers);

router.post('/reset', controllers.reset);

router.post('/webhook', controllers.webhook);

module.exports = router;
