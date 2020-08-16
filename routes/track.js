const express = require('express');
const { validate: validateRequest } = require('../validation/validate');
const validationSchemas = require('../validation/schema');

const router = express();

const controllers = require('../controllers/track');

router.get('/:id/audio-features', validateRequest(validationSchemas.getAudioFeaturesParams, 'params'), controllers.getTrackAudioFeatures);

router.post('/data', validateRequest(validationSchemas.getTrackDataBody), controllers.getTrackData);

module.exports = router;
