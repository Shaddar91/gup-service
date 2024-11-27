var fs = require('fs');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
const path = require('path');

const TOKEN_DIR = process.env.CREDENTIAL_LOCATION;
var TOKEN_PATH = TOKEN_DIR + '/login_credentials.json';






function loadOAuth2Client() {
    try {
        // Authorize a client with the loaded credentials
        var content = fs.readFileSync(TOKEN_DIR+'/client_secret.json');
        let clientData = JSON.parse(content);

        const CLIENT_SECRET = clientData.installed.client_secret;
        const CLIENT_ID = clientData.installed.client_id;
        const REDIRECT_URI = clientData.installed.redirect_uris[0];

        const oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
          );

        content = fs.readFileSync(TOKEN_PATH);
        let loginData = JSON.parse(content);
        const ACCESS_TOKEN = loginData.access_token;
        const REFRESH_TOKEN = loginData.refresh_token;
        const EXPIRY = loginData.expiry_date;

        const NOW = Date.now();
        if(EXPIRY < NOW) {
            console.log("Login credentials expired. Please run inittoken.js again.");
            return null;
        }

        oauth2Client.setCredentials({
            refresh_token: REFRESH_TOKEN,
            access_token: ACCESS_TOKEN
        });

        return oauth2Client;

    }
    catch(err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
}

let oauth2Client = loadOAuth2Client();

if(!oauth2Client) {
    console.log("Could not set up oauth2client.");
    return;
}

// Create an instance of the YouTube service
const youtube = google.youtube({
    version: 'v3',
    auth: loadOAuth2Client()
});


async function uploadVideo(videoPath) {
    try {
      const response = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: 'Your Video Title',
            description: 'Your video description',
            tags: ['your', 'tags'],
            categoryId: '22' // This is an example category, adjust as needed
          },
          status: {
            privacyStatus: 'public', // or 'private' or 'unlisted'
          },
        },
        media: {
          body: fs.createReadStream(path.join(videoPath))
        }
      });
  
      console.log('Video uploaded. ID:', response.data.id);
    } catch (error) {
      console.log('Error uploading video:', error.message);
      console.log("Error", error)
    }
  }
  
  //uploadVideo();

  // Currently the lib expects the video as the first argument
  // argv[0] - script
  // argv[1] - script full path
  let videoPath = process.argv[2];

if(videoPath === undefined) {
    console.log("No path provided.");
    return;
}

// try 'example_videos/Big_Buck_Bunny_1080_10s_30MB.mp4'
uploadVideo(videoPath);