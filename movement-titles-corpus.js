// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require('csv');
var MongoClient = require('mongodb').MongoClient;

var columns = ['movement.id', 'movement.name',
               'movement.era.id', 'movement.era.name',
               'titles'];

var movements = {};
var movement_titles = {};

var add_artwork_title_to_movement = function (artwork) {
  // For each movement, add the information for the artwork
  artwork.movements.forEach(function(movement) {
    // If this is the first time we've encountered this movement, do some setup
    if(!movements[movement.id]) {
      movements[movement.id] = movement;
      movement_titles[movement.id] = [];
    }
    movement_titles[movement.id].push(artwork.title);
  });
};

var dump_movement_titles = function () {
  var rows = [];
  Object.keys(movements).forEach(function(movementId) {
    var movement = movements[movementId];
    rows.push([movement.id, movement.name,
               movement.era.id, movement.era.name,
               movement_titles[movementId].join('\t')]);
  });
  csv().from.array(rows).to.stream(process.stdout,
                                   {end: false,
                                    columns: columns});
};

MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) { throw err; }
  var rows = [];
  db.collection('artworks').find().each(function(err, artwork) {
    if(err) { throw err; }
    if(artwork === null) {
      db.close();
      dump_movement_titles();
      return;
    }
    if(artwork.subjectCount > 0 && artwork.movementCount > 0) {
      add_artwork_title_to_movement(artwork);
    }
  });
});
