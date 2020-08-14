const express = require('express');

const router = express();

const controllers = require('../controllers/track');

router.get('/:id/audio-features', controllers.getTrackAudioFeatures);

router.post('/data', controllers.getTrackData);

module.exports = router;
