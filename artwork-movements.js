// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require("csv");
var MongoClient = require('mongodb').MongoClient;

var columns = ["artwork.id", "artwork.title", "artwork.dateText",
               "movement.era.id", "movement.era.name", "movement.id",
               "movement.name"];


MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) { throw err; }
  var rows = [];
  db.collection('artworks').find().each(function(err, artwork) {
    if(err) { throw err; }
    if(artwork === null) {
      db.close();
      csv().from.array(rows).to.stream(process.stdout,
                                       {end: false,
                                        columns: columns,
                                        header: true});
      return;
    }
    if(artwork.movementCount) {
      artwork.movements.forEach(function(movement) {
        rows.push([artwork.id, artwork.title, artwork.dateText,
                   movement.era.id, movement.era.name,
                   movement.id, movement.name]);
      });
    }
  });
});
