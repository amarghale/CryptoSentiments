//'use strict';
const Twitter = require('twitter');
const config = require('./config.json');
const client = new Twitter({
    consumer_key: config.consumer_key,
    consumer_secret: config.consumer_secret,
    access_token_key: config.access_token_key,
    access_token_secret: config.access_token_secret
});

var language = require('@google-cloud/language');

var languageClient = new language.LanguageServiceClient({
    keyFilename: 'keyfile.json',
    projectId: config.project_id
  });


  const bitcoinsSearch = 'bitcoin, BTC, XBT, satoshi, bitcoin price, bitcoin trend';
  const ethriumSearch = 'Ethrium, ETH';
  const litecoinSearch = 'litecoin';
  const zcash = 'zcash';
  const ripple = 'ripple';
  
  const seacrhTerms = 'bitcoin, BTC, XBT, satoshi, bitcoin price, bitcoin trend';
  const popularUsers = '58487473, 3367334171,  928759224599040001, 3022775424, 2207129125, 1007975429091807232, 216304017, 1971497084';
  
  client.stream('statuses/filter', {follow: popularUsers, track: seacrhTerms, language: 'en'}, function(stream){
      stream.on('data', function(event){
         //console.log(event.text);
          if ((event.text != undefined) && (event.in_reply_to_status_id_str == null) && (event.in_reply_to_user_id_str == null) && (event.text.substring(0,2) != 'RT')){
              if (event.hasOwnProperty('truncated') && event.truncated == true)
              {
                  filterTweets(event.extended_tweet.full_text, event);
              }
              else
              {
                  filterTweets(event.text, event);
               }
          }
      });
      stream.on('error', function(error){
          console.log('twitter api error: ', error);
      });
  });

  function filterTweets(tweets, event){
    var regexp = /\s([@#][\w_-]+)/g;
    var refinedTweets = tweets.replace(regexp, '')
    var linkRegexp = /^(http:\/\/t\.|https:\/\/t\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/g;
    if (!refinedTweets.match(linkRegexp)){
        callNaturalLanguageApi(refinedTweets, event);
    }
}
var admin = require("firebase-admin");
var serviceAccount = require("./keyfile.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://" + config.project_id + ".firebaseio.com"
});

const db = admin.database();
const coinRef = db.ref('coinSentiment');

function callNaturalLanguageApi(tweet, event){
            const document = {
            content: tweet,
            type: "PLAIN_TEXT"
        };
        languageClient.analyzeSentiment({document: document}).then
        (results => {
            const sentiment = results[0].documentSentiment;
            let tweetForDb = {
                coin: 'Bitcoin',
                tweet: tweet,
                created_at: event.created_at,
                score: sentiment.score,
              };
              //console.log(tweetForDb);
              coinRef.push(tweetForDb);
        })
        .catch(err => {
            console.error('Error:', err);
        });   
}



    