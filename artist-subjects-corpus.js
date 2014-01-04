// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require('csv');
var MongoClient = require('mongodb').MongoClient;

var columns = ['artist.id', 'artist.name', 'artist.gender', 'artist.date',
               'categories', 'subcategories', 'subjects'];

var artists = {};
var artist_categories = {};
var artist_subcategories = {};
var artist_subjects = {};

var add_artwork_subjects_to_artist = function (artwork) {
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
  // For each artist, add the information for the artwork
  artwork.contributors.forEach(function(contributor) {
    if(contributor.role == "artist") {
      // If this is the first time we've encountered this artist, do some setup
      if(! artists[contributor.id]) {
        artists[contributor.id] = contributor;
        artist_categories[contributor.id] = [];
        artist_subcategories[contributor.id] = [];
        artist_subjects[contributor.id] = [];
      }
      artist_categories[contributor.id] =
        artist_categories[contributor.id].concat(child_subjects);
      artist_subcategories[contributor.id] =
        artist_subcategories[contributor.id].concat(childchild_subjects);
      artist_subjects[contributor.id] =
        artist_subjects[contributor.id].concat(childchildchild_subjects);
    }
  });
};

var dump_artist_subjects = function () {
  var rows = [];
  Object.keys(artists).forEach(function(artistId) {
    var artist = artists[artistId];
    rows.push([artist.id, artist.fc, artist.gender, artist.date,
               artist_categories[artistId].join('\t'),
               artist_subcategories[artistId].join('\t'),
               artist_subjects[artistId].join('\t')]);
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
      dump_artist_subjects();
      return;
    }
    if(artwork.subjectCount > 0 && artwork.contributorCount > 0) {
      add_artwork_subjects_to_artist(artwork);
    }
  });
});
