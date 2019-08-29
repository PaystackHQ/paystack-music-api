// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const axios = require('axios');
const moment = require('moment');
const helpers = require('./helpers');


// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  // response.sendFile(__dirname + '/views/index.html');
  
  const messages = helpers.fetchMessages();
  const musicMessages = helpers.filterSpotifyAndYoutubeMessages(messages);
  
      response.send(songs);
    })
    .catch(error => {
      response.send(JSON.stringify(error));
      console.log(error);
    });
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
