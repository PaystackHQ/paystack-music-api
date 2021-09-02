const express = require('express');
const { validate: validateRequest } = require('../validation/validate');
const validationSchemas = require('../validation/schema');

const router = express.Router();

const controllers = require('../controllers');

router.get('/', controllers.index);

router.get('/authorize', controllers.authorize);

router.get('/callback', validateRequest(validationSchemas.callbackQuery, 'query'), controllers.callback);

router.post('/trigger', validateRequest(validationSchemas.trigger), controllers.trigger);

router.post('/clear-auth', controllers.clearAuth);

// TODO:: This needs to be changed to /playlists/:id for it to live in the playlists router.
router.get('/playlist/:id', validateRequest(validationSchemas.getPlaylistByIdParams, 'params'), controllers.getPlaylistByID);

router.get('/covers', controllers.covers);

router.post('/reset', validateRequest(validationSchemas.resetBody), controllers.reset);

router.post('/webhook', controllers.webhook);

router.get('/wrapped/top-artists', validateRequest(validationSchemas.wrappedGetTopArtists, 'query'), controllers.wrappedGetTopArtists);
router.get('/wrapped/top-artists/contributor', validateRequest(validationSchemas.wrappedGetContributorTopArtists, 'query'), controllers.wrappedGetContributorTopArtists);

module.exports = router;
