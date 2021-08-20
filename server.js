// server.js
// where your node app starts

// init project
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

const app = express();
const path = require('path');
const { app: appConfig } = require('./config');
const logger = require('./helpers/logger');
const swaggerDefinition = require('./documentation/swagger/swagger');

const indexRouter = require('./routes/index');
const playlistRouter = require('./routes/playlists');
const trackRouter = require('./routes/track');

require('./config/db');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(helmet());
app.disable('x-powered-by');

const swaggerSpec = swaggerJsdoc(swaggerDefinition);

const openAPIDefinition = JSON.stringify(swaggerSpec, null, 4);

fs.writeFile('./documentation/swagger/swagger.json', openAPIDefinition, (err) => {
  if (err) {
    throw err;
  }
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', indexRouter);
app.use('/playlists', playlistRouter);
app.use('/track', trackRouter);

// listen for requests :)
const listener = app.listen(appConfig.port, () => {
  logger.info(`Your app is listening on port ${listener.address().port}`);
});

module.exports = app;
