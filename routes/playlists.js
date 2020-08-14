const express = require('express');

const router = express();

const controllers = require('../controllers/playlist');

// TODO:: This needs to be changed to /playlists/:id for it to live under here.
// router.get('/playlist/:id', controllers.getPlaylistByID);

router.get('/', controllers.getAllPlaylists);

module.exports = router;
