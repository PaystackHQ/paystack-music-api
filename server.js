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
app.get('/', async function (req, res) {
  try {
    const history = await slack.fetchChannelHistory();
    const spotifyMessages = slack.filterSpotifyMessages(history.messages);
    const tracks = slack.filterSpotifyTracks(spotifyMessages);
    res.send(tracks);
  } catch (error) {
    res.send("An error occurred\n\n" + error);
  }
});

app.get('/authorize', async function (req, res) {
  const authURL = spotify.createAuthURL();
  const html = `
    <!DOCTYPE html>
    <html>
      <head></head>
      <body>
        <h1>Hello!</h1>
        <p>Please make sure you're logged into Paystack's Community Spotify</p>
        <a target="_blank" href="${authURL}">Click here to authorize</a>
      </body>
    </html>
  `;
  res.send(html);
});

app.get('/callback', async function (req, res) {
  try {
    const code = req.query.code;
    const response = await spotify.getTokensFromAPI(code);

    spotify.setTokensInDB(response);
    spotify.setTokensOnAPIObject(response);

    const html = `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <h1>All done!</h1>
          <a target="_blank" href="${process.env.APP_TRIGGER_URI}">Click here to trigger everything</a>
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.log('error', error);
    res.send(JSON.stringify(error));
  }
});

app.get('/trigger', async function (req, res) {
  try {
    let tokens = spotify.getTokensFromDB();
    spotify.setTokensOnAPIObject(tokens);

    // check if there are valid tokens in our DB
    if (tokens) {
      // const oneHour = 1000 * 60 * 60; 
      const oneHour = 60;
      const isTokenValid = (Date.now() - tokens.timestamp) < oneHour;

       // refresh access token if old one has expired
      if (!isTokenValid) {
        tokens = await spotify.refreshTokensFromAPI();
        spotify.setTokensInDB(tokens);
        spotify.setTokensOnAPIObject(tokens);
      }
     
      // create new playlist
      const playlist = await spotify.createPlaylist('Testing one none 555', tokens);
      console.log('playlist - ', playlist);

      res.send(`Made a playlist bro 5555 ${JSON.stringify(playlist)}`);
      // and songs to said playlist
      // generate album art
      // attach album art to playlist
      // end
    } else {
      res.send('Omo, there were no tokens there o');
    } 
  } catch (error) {
    res.send(error);
  }
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});