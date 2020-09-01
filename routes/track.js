const express = require('express');
const { validate: validateRequest } = require('../validation/validate');
const validationSchemas = require('../validation/schema');

const router = express.Router();

const controllers = require('../controllers/track');

router.get('/populate-analytics', controllers.getTrackAudioFeatures);
router.get('/populate-previews', controllers.populateTrackPreviews);

router.post('/data', validateRequest(validationSchemas.getTrackDataBody), controllers.getTrackData);

module.exports = router;
