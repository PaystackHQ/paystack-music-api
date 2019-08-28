// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const axios = require('axios');

const TOKEN = 'xoxp-8842510723-138344650327-740974107989-8d11b1059a5b4e8bc9854fbc048dbc5f';
const CHANNEL_ID = 'C7JECTX2T';

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  // response.sendFile(__dirname + '/views/index.html');
  const url = `https://slack.com/api/conversations.history?token=${TOKEN}&channel=${CHANNEL_ID}`;
  axios.get(url)
    .then(r => {
      console.log(r);
      response.end(r);
    }).catch(error => {
      response.send('error o');
      console.log(error);
    });
  // C7JECTX2T
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
