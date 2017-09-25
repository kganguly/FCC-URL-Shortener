var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://kganguly:H0l1st1c1@ds141454.mlab.com:41454/us';

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  db.collection("urls").drop(function(err, res) {
    if (err) throw err;
    console.log("Collection dropped!");
    db.close();
  });
})