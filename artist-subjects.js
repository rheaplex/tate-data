// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require("csv");
var MongoClient = require('mongodb').MongoClient;

var columns = ["artist.id", "artist.name", "artist.gender",
               "artist.birthDate", "artist.deathDate",
               "artwork.id", "artwork.title",
               "subject.id", "subject.name", "child.id", "child.name",
               "childchild.id", "chilchild.name"];

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
    // Births and deaths can have locations but not dates
    var birthDate = ("birth" in artist && "time" in artist.birth) ?
        artist.birth.time.startYear : undefined;
    var deathDate = ("death" in artist && "time" in artist.death) ?
        artist.death.time.startYear : undefined;
    db.collection('artworks').find({
      "contributors.id":artist.id}).toArray(function(err, artworks) {
        if(err) { throw err; }
        artworks.forEach(function(artwork) {
          if(artwork.subjectCount) {
            artwork.subjects.children.forEach(function(subject) {
              subject.children.forEach(function(child) {
                child.children.forEach(function(childchild) {
                  rows.push([artist.id, artist.fc, artist.gender,
                             birthDate, deathDate,
                             artwork.id, artwork.title,
                             subject.id, subject.name,
                             child.id, child.name,
                             childchild.id, childchild.name]);
                });
              });
            });
          }
        });
      });
  });
});
