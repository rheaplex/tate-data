// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require("csv");
var MongoClient = require('mongodb').MongoClient;

var columns = ["artist.id", "artist.fc", "artist.birthDate", "artist.deathDate",
               "movement.era.id", "movement.era.name",
               "movement.id", "movement.name"];

MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) { throw err; }
  var rows = [];
  db.collection('artists').find().each(function(err, artist) {
    if(err) { throw err; }
    if(artist === null) {
      db.close();
      csv().from.array(rows).to.stream(process.stdout,
                                       {end: false,
                                        columns: columns});
      return;
    }
    if(artist.movements.length > 1) {
      // Births and deaths can have locations but not dates
      var birthDate = ("birth" in artist && "time" in artist.birth) ?
        artist.birth.time.startYear : undefined;
      var deathDate = ("death" in artist && "time" in artist.death) ?
        artist.death.time.startYear : undefined;
      var fromMovement = artist.movements[0];
      for (var i = 1; i < artist.movements.length; i++) {
        var toMovement = artist.movements[i];
        rows.push([artist.id, artist.fc, birthDate, deathDate,
                   fromMovement.era.id, fromMovement.era.name,
                   fromMovement.id, fromMovement.name,
                   toMovement.era.id, toMovement.era.name,
                   toMovement.id, toMovement.name]);
        fromMovement = toMovement;
      }
    }
  });
});
