// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require('csv');
var MongoClient = require('mongodb').MongoClient;

var columns = ['movement.id', 'movement.name',
               'movement.era.id', 'movement.era.name',
               'categories', 'subcategories', 'subjects'];

var movements = {};
var movement_categories = {};
var movement_subcategories = {};
var movement_subjects = {};

var add_artwork_subjects_to_movement = function (artwork) {
  var child_subjects = [];
  var childchild_subjects = [];
  var childchildchild_subjects = [];
  // Get each level of information for the artwork
  artwork.subjects.children.forEach(function(child) {
    child_subjects.push(child.name);
    child.children.forEach(function(childchild) {
      childchild_subjects.push(childchild.name);
      childchild.children.forEach(function(childchildchild) {
        childchildchild_subjects.push(childchildchild.name);
      });
    });
  });
  // For each movement, add the information for the artwork
  artwork.movements.forEach(function(movement) {
    // If this is the first time we've encountered this movement, do some setup
    if(!movement_categories[movement.id]) {
      movements[movement.id] = movement;
      movement_categories[movement.id] = [];
      movement_subcategories[movement.id] = [];
      movement_subjects[movement.id] = [];
    }
    movement_categories[movement.id] =
      movement_categories[movement.id].concat(child_subjects);
    movement_subcategories[movement.id] =
      movement_subcategories[movement.id].concat(childchild_subjects);
    movement_subjects[movement.id] =
      movement_subjects[movement.id].concat(childchildchild_subjects);
  });
};

var dump_movement_subjects = function () {
  var rows = [];
  Object.keys(movements).forEach(function(movementId) {
    var movement = movements[movementId];
    rows.push([movement.id, movement.name,
               movement.era.id, movement.era.name,
               movement_categories[movementId].join('\t'),
               movement_subcategories[movementId].join('\t'),
               movement_subjects[movementId].join('\t')]);
  });
  csv().from.array(rows).to.stream(process.stdout,
                                   {end: false,
                                    columns: columns,
                                    header: true});
};

MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) { throw err; }
  var rows = [];
  db.collection('artworks').find().each(function(err, artwork) {
    if(err) { throw err; }
    if(artwork === null) {
      db.close();
      dump_movement_subjects();
      return;
    }
    if(artwork.subjectCount > 0 && artwork.movementCount > 0) {
      add_artwork_subjects_to_movement(artwork);
    }
  });
});
