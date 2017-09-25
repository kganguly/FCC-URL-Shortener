// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');
//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;
var dbUri = process.env.SECRET;
var db; //Global DB connection
var seq; //Unique URL ID counter

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

//Microservice Information
// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

//URL ID Redirect
app.get("/:urlId(\\d+)", function (request, response) {
  console.log("URL ID: " + request.params.urlId);
  redirectUrlId(request.params.urlId, response);
});

//Short URL Creation
app.get("/new/:url(https?\\://\\w+.\\w+*)", function (request, response) {
  
  returnShortUrl(request.params.url, response);
});

//Incorrect URL Creation Format
app.get("/new/*", function (request, response) {
  response.end('{"error":"Please use proper http(s)://*.* format when requesting a shortened URL."}');
});

//All else gets standard info page
app.get("/*", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

async function redirectUrlId(urlId, response) {
  try {
    var doc = await db.collection("urls").findOne({urlId: parseInt(urlId)});
    if (doc) {
      console.log("URL ID " + urlId + " found: " + doc.url);
      response.redirect(308, doc.url);
    } else {
      response.end('{"error":"This shortened URL was not found."}');
    }
  } catch (err) {
    console.error(err);
  }
}

async function returnShortUrl(original, response) {
  try {
    var shortUrl = "https://kganguly-us.glitch.me/"
    var doc = await db.collection("urls").findOne({url: original});
    if (doc) {
      console.log(doc.url + " already in DB.")
      shortUrl += doc.urlId;
    } else {
      shortUrl += seq;
      var myobj = {
        urlId: seq,
        url: original
      };
      updateSequence();
      await db.collection("urls").insertOne(myobj);
      console.log("1 document inserted");
    }
    var result = {
      original_url: original,
      short_url: shortUrl
    };
    response.writeHead(200, {'content-type': 'text/json'});
    response.end(JSON.stringify(result));
  } catch (err) {
    console.error(err);
  }
}
  
async function updateSequence() {
  var nextSeq = ++seq;
  var result = await db.collection("counters").findOne({ _id: "urlid"});
  console.log("NextSeq: " + nextSeq)
  console.log("Pre-update: " + result.seq);
  if (nextSeq > result.seq)
    await db.collection("counters").updateOne({ _id: "urlid"}, {seq: nextSeq});
}
  
MongoClient.connect(dbUri, function (err, connection) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', dbUri);
      db = connection;
      // listen for requests :)
      var listener = app.listen(process.env.PORT, function () {
        console.log('Your app is listening on port ' + listener.address().port);
        //Re-initialize global URL ID counter from DB
        db.collection("counters").findOne({ _id: "urlid"}, function(err, result) {
          if (err) throw err;
          console.log(result);
          seq = result.seq;
        });
      });
    }
});
