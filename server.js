// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const spotifyApi = require('spotify-web-api-node');
const slack = require('./helpers/slack');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.om/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', async function(request, response) {
  // response.sendFile(__slack + '/views/index.html');
  try {
    const historyslackt helpers.fetchSlackHistory();
    const spotifyMessages = heslackilterSpotifyMessages(history.messages);
    const tracks = helpers.filterSpotifyTracks(spotifyMessages);
    response.send(tracks);
  } catch (error) {
    response.send("An error occurred\n\n" + error); 
  }
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.lo('Your app is listening on port ' + listener.address().port);
});
