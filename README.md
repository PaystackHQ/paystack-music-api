# Paystack Music Slack Bot

![Paystack Music](paystack-music.gif)

The Paystack Music Slack Bot is an integration built by our team at Paystack. It's responsible for all the wonderful playlists we're now sharing with the world every month at [Paystack Music](<[https://paystack.com/music/](https://paystack.com/music/)>)

## How it works

At Paystack, when we find music we like, we share to a #fun-music channel on Slack for others to enjoy.

At the end of each month, our music bot automatically fetches all the Spotify tracks, creates a mixtape with custom cover art, and publishes it online.

We've cobbled together a couple of APIs to make this work.

1. First, we use the Slack API to fetch all the messages shared in the designated channel for the month. The bot keeps a tally of how many different people shared songs that month.
2. The bot then filters the messages for all the ones that contain links to Spotify tracks, and creates a Spotify playlist with all of them.
3. For the album art, we fetch the cover of the newly created playlist from Spotify (it's usually a combination of the first 4 songs added to the playlist). We then grab the dominant color from the fetched album art, and use it as the background of a new image that follows the playlist template. This gets set as the new playlist cover.
4. Next up, the bot fetches the track info and audio features for all the tracks on the playlist, and saves the new playlist to the DB

## Setup

1. Clone the repo.
2. Duplicate the `.env.example` file and rename it `.env`.

You'll need to set up apps on both Slack and Spotify for the next steps.

### Slack

- You'll first need to create a new Slack app and give it the links:read OAuth scope. This allows our bot to view URLs in Slack messages.
- Install the app to your workspace. Once it's installed, Slack will generate a Bot User OAuth Access Token. When you get it, paste it in the `SLACK_TOKEN` variable in your `.env` file.
- Next, we'll need the `CHANNEL_ID` for the Slack channel you want the bot to get song links from. If you open your Slack workspace in the browser, you can copy it from the URL. The format is `https://app.slack.com/client/{WORKSPACE_ID}/{CHANNEL_ID}`
- Set the `SLACK_TARGET_CHANNEL_ID` in your `.env` file to the channel ID you've copied.

### Spotify

- Open the [Spotify web player](https://open.spotify.com/). Visit the profile link on the top right of the page
- Copy the part of the url corresponding to your user ID. The url should be formatted like this: `open.spotify.com/user/{USER_ID}` and paste it in your local `.env` as `SPOTIFY_USER_ID`
- Go to the [Spotify developer dashboard](https://developer.spotify.com/dashboard) (sign in when you're prompted to)
- Create a new app (this will be the app you use for testing the bot locally on your Spotify account)
- Copy the `client secret` and `client ID` and past them in the corresponding `.env` file variables: `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
- Edit the app settings on the [Spotify developer dashboard](https://www.notion.so/paystack/Paystack-Music-API-11632e35bbb54e308d60333bd9835016#2fbf29c427d140ba88666510d853e30e) to add your redirect URI as `localhost:{PORT}/callback` ({PORT} needs to corresponds to the port your app loads on. The default is set to 3000.
- Set the corresponding callback URL on your local `.env` file: `SPOTIFY_REDIRECT_URI`.
- Set your `APP_TRIGGER_URI` to `localhost:{PORT}/trigger`. ({PORT} needs to corresponds to the port your app loads on. Default is set to 3000
- When you set up all this, visit `localhost:{PORT}/authorize` and sign in with your Spotify account.
