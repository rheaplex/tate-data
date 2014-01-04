// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require('csv');
var MongoClient = require('mongodb').MongoClient;

var columns = ['artwork.id', 'artwork.title', 'artwork.dateText',
               'categories', 'subcategories', 'subjects'];

var artwork_subjects = function (artwork) {
  var child_subjects = [];
  var childchild_subjects = [];
  var childchildchild_subjects = [];
  artwork.subjects.children.forEach(function(child) {
    child_subjects.push(child.name);
    child.children.forEach(function(childchild) {
      childchild_subjects.push(childchild.name);
      childchild.children.forEach(function(childchildchild) {
        childchildchild_subjects.push(childchildchild.name);
      });
    });
  });
  return {categories: child_subjects,
          subcategories: childchild_subjects,
          subjects: childchildchild_subjects};
};

MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) { throw err; }
  var rows = [];
  db.collection('artworks').find().each(function(err, artwork) {
    if(err) { throw err; }
    if(artwork === null) {
      db.close();
      csv().from.array(rows).to.stream(process.stdout,
                                       {end: false,
                                        columns: columns});
      return;
    }
    if(artwork.subjectCount > 0) {
      var subjects = artwork_subjects(artwork);
      rows.push([artwork.id, artwork.title, artwork.dateText,
                 subjects.categories.join('\t'),
                 subjects.subcategories.join('\t'),
                 subjects.subjects.join('\t')]);
    }
  });
});
