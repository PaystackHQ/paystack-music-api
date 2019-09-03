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
  // response.sendFile(__slack + '/vChannelindex.html');
  try {
    const history = await slack.fetchChannelHistory();
    // const spotifyMessages = slack.filterSpotifyMessages(history.messages);
    const tracks = slack.filterSpotifyTracks(spotifyMessages);
    console.log(history);
    response.send(history.messages);
  } catch (error) {
    response.send("An error occurred\n\n" + error); 
  }
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
