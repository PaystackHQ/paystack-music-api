// server.js
// where your node app starts

// init project
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const slack = require('./helpers/slack');
const spotify = require('./helpers/spotify');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());


// http://expressjs.com/en/starter/basic-routing.html
app.get('/', async function (request, response) {
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

app.get('/authorize', async function (request, response) {
  const authURL = spotify.createAuthURL();
  const html = `
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <h1>Hello World!</h1>
        <a target="_blank" href="${authURL}">Click here to authorize</a>
      </body>
    </html>
  `;
  response.send(html);
});

app.get('/callback', async function (request, response) {
  try {
    // const tokens = spotify.getTokensFromDB();
    const code = request.query.code;
    const response = await spotify.getTokensFromAPI(code);
    console.log('response', response);
    spotify.setTokensInDB(response);
    spotify.setTokensOnAPIObject(response);

    const html = `
      <!DOCTYPE html>
      <html>
        <head></head>s
        <body>
          <h1>All done!</h1>
          <p>code: <code>${JSON.stringify(response)}</code></p>
        </body>
      </html>
    `;
    response.send(html);
  } catch(error) {
    response.send(JSON.stringify(error));
  }
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});