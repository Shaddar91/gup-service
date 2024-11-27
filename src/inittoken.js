var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var puppeteer = require('puppeteer');

// Small web-app  to handle local redirection and store token if needed
var express = require("express");
const app = express()
const PORT=4242;

const REDIRECT_URI = 'http://localhost:'+PORT; // This is the URI you set in the Google Console - Local auth handler
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.upload'];

const TOKEN_DIR = process.env.CREDENTIAL_LOCATION;
var TOKEN_PATH = TOKEN_DIR + '/login_credentials.json';

// The oauth2Client used by for Google
// Make sure to initialize it by calling authorize
var oauth2Client;

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            // Check expiry
            if(oauth2Client.credentials.expiry_date < Date.now()) {
                getNewToken(oauth2Client, callback);
                return;
            }
            callback(oauth2Client);
        }
    });
}
  

// Load client secrets from a local file.
fs.readFile(TOKEN_DIR+'/client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials
    authorize(JSON.parse(content), confirmAuthorization);
});

function confirmAuthorization() {
    console.log("The client is authorized. Feel free to use other functions.")
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES
    });
    console.log('Authorize this app by visiting this url:\n\n');
    console.log(authUrl);
  
    (async () => {
      // Launch the browser and open a new blank page - 
      // 2024 UPDATE: Puppeteer doesn't work. Copy and paste URL to another browser to authenticate.
      const browser = await puppeteer.launch({headless: false});
      const page = await browser.newPage();
      await page.setBypassCSP(true);
    
      // Navigate the page to a URL
      await page.goto(authUrl);
    
      // Set screen size
      await page.setViewport({width: 1080, height: 1024});
  
      
    
    })();
}

function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    console.log("Writing storing token to "+TOKEN_PATH)
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) throw err;
        console.log('Token stored to ' + TOKEN_PATH);
});
}

// Store credentials locally - this folder is gitignored
app.get("/", function(req,res) {
    var code = req.query.code;
    if(code === undefined) {
        res.send("Error receiving code.");
        return;
    }
    //console.log("Request received: ",code);

    oauth2Client.getToken(code, function(err, token) {
        if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
    });

    res.send("Token stored.");
    listener.close();
})

var listener = app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
    
})

