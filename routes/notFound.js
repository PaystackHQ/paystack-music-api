const express = require('express');

const router = express.Router();

const notFound = require('../controllers/notFound');

router.get('/', notFound);

module.exports = router;
