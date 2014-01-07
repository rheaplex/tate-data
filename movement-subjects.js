// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require("csv");
var MongoClient = require('mongodb').MongoClient;

var columns = ["movement.id", "movement.name", "era.id", "era.name",
               "artwork.id", "artwork.title",
               "category.id", "category.name",
               "subcategory.id", "subcategory.name",
               "subject.id", "subject.name"];

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
    if(artwork.movementCount && artwork.subjectCount) {
      artwork.movements.forEach(function(movement) {
        artwork.subjects.children.forEach(function(subject) {
          subject.children.forEach(function(child) {
            child.children.forEach(function(childchild) {
              rows.push([movement.id, movement.name,
                         movement.era.id, movement.era.name,
                         artwork.id, artwork.title,
                         subject.id, subject.name,
                         child.id, child.name,
                         childchild.id, childchild.name]);
            });
          });
        });
      });
    }
  });
});
