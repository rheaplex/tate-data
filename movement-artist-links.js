// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require("csv");
var MongoClient = require('mongodb').MongoClient;

var columns = ["artist.id", "artist.fc",
               "first.movement.era.id", "first.movement.era.name",
               "first.movement.id", "first.movement.name",
               "second.movement.era.id", "second.movement.era.name",
               "second.movement.id", "second.movement.name"];

MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) { throw err; }
  var rows = [];
  db.collection('artists').find().each(function(err, artist) {
    if(err) { throw err; }
    if(artist === null) {
      db.close();
      csv().from.array(rows).to.stream(process.stdout,
                                       {end: false,
                                        columns: columns,
                                        header: true});
      return;
    }
    if (artist.movements.length > 0) {
      var movement = artist.movements[0];
      for (var i = 1; i < artist.movements.length; i++) {
        var next_movement = artist.movements[i];
        rows.push([artist.id, artist.fc,
                   movement.era.id, movement.era.name,
                   movement.id, movement.name,
                   next_movement.era.id, next_movement.era.name,
                   next_movement.id, next_movement.name]);
        movement = next_movement;
      }
    }
  });
});
