const express = require('express');
const { validate: validateRequest } = require('../validation/validate');
const validationSchemas = require('../validation/schema');

const router = express.Router();

const controllers = require('../controllers');

/**
 * @openapi
 * /:
 *   get:
 *     description: Welcome to Paystack Music!
 *     responses:
 *       200:
 *         description: Returns HTML Page showing a welcome message.
 */
router.get('/', controllers.index);

/**
 * @openapi
 * /authorize:
 *   get:
 *    summary: Authorizes a user.
 *    responses:
 *       '200':
 *         description: OK
 */
router.get('/authorize', controllers.authorize);

/**
 * @openapi
 *  /callback:
 *      get:
 *       summary: Callback after authentication
 *       parameters:
 *          - name: code
 *            in: query
 */
router.get('/callback', validateRequest(validationSchemas.callbackQuery, 'query'), controllers.callback);

router.post('/trigger', validateRequest(validationSchemas.trigger), controllers.trigger);

// TODO:: This needs to be changed to /playlists/:id for it to live in the playlists router.
/**
 * @openapi
 *  /playlist/{id}:
 *      get:
 *       summary: Get playlist by ID
 *       parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            description: The ID of the playlist to be fetched
 *       responses:
 *       '200':
 *         description: Success - Playlist returned
 */
router.get('/playlist/:id', validateRequest(validationSchemas.getPlaylistByIdParams, 'params'), controllers.getPlaylistByID);

router.get('/covers', controllers.covers);

router.post('/reset', validateRequest(validationSchemas.resetBody), controllers.reset);

router.post('/webhook', controllers.webhook);

router.get('/wrapped/top-artists', validateRequest(validationSchemas.wrappedGetTopArtists, 'query'), controllers.wrappedGetTopArtists);
router.get('/wrapped/top-artists/contributor', validateRequest(validationSchemas.wrappedGetContributorTopArtists, 'query'), controllers.wrappedGetContributorTopArtists);

module.exports = router;
