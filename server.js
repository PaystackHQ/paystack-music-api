// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const axios = require('axios');

const token = 'oxp-8842510723-138344650327-740974107989-8d11b1059a5b4e8bc9854fbc048dbc5f';
const channelID = 'C7JECTX2T';

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  // response.sendFile(__dirname + '/views/index.html');
  const res = axios.get('https://slack.com/api/conversations.list?token=xoxp-8842510723-138344650327-740974107989-8d11b1059a5b4e8bc9854fbc048dbc5f')
    .then(r => r);
  // C7JECTX2T
  console.log(res);
  response.send(res);
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
