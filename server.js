// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const axios = require('axios');
const moment = require('moment');


// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  // response.sendFile(__dirname + '/views/index.html');
  
  const startTime = moment('2019-08').startOf('month').format('X.SSSSSS');
  const endTime = moment('2019-08').endOf('month').format('X.SSSSSS');
  
  const url = `https://slack.com/api/conversations.history?token=${process.env.SLACK_TOKEN}&channel=${process.env.SLACK_CHANNEL}&oldest=${startTime}&latest=${endTime}inclusive=true`;
  axios.get(url)
    .then(r => {
      console.log(r.data.messages);
      let songs = [];
      r.data.messages.forEach(msg => {
        if (msg.attachments && msg.attachments.length) {
          msg.attachments.forEach(attachment => {
            if (attachment.service_name === "Spotify" || attachment.service_name === "YouTube") {
              songs.push({ service: attachment.service_name, title: attachment.title, link: attachment.title_link });
            }
          });
        }
      });
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
