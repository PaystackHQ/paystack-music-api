// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const slack = require('./helpers/slack');
const spotify = require('./helpers/spotify');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.om/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', async function(request, response) {
  // response.sendFile(__slack + '/vChannelindex.html');
  try {
    const history = await slack.fetchChannelHistory();
    const spotifyMessages = slack.filterSpotifyMessages(history.messages);
    const tracks = slack.filterSpotifyTracks(spotifyMessages);
    response.send(tracks);
  } catch (error) {
    response.send("An error occurred\n\n" + error); 
  }
});

app.get('/authorize', async function(request, response) {
  // response.sendFile(__slack + '/vChannelindex.html');
  // const authURL = spotify.createAuthURL();
  const html = `
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <h1>Hello World!</h1>
      </body>
    </html>
  `;
  response.send(html); 
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
