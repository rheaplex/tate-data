// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

var csv = require('csv');
var MongoClient = require('mongodb').MongoClient;

var columns = ['artist.id', 'artist.name', 'artist.gender', 'artist.date',
               'titles'];

var artists = {};
var artist_titles = {};

var add_artwork_title_to_artist = function (artwork) {
  // For each artist, add the information for the artwork
  artwork.contributors.forEach(function(contributor) {
    if(contributor.role == "artist") {
      // If this is the first time we've encountered this artist, do some setup
      if(! artists[contributor.id]) {
        artists[contributor.id] = contributor;
        artist_titles[contributor.id] = [];
      }
      artist_titles[contributor.id].push(artwork.title);
    }
  });
};

var dump_artist_titles = function () {
  var rows = [];
  Object.keys(artists).forEach(function(artistId) {
    var artist = artists[artistId];
    rows.push([artist.id, artist.fc, artist.gender, artist.date,
               artist_titles[artistId].join('\t')]);
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
      dump_artist_titles();
      return;
    }
    if(artwork.subjectCount > 0 && artwork.contributorCount > 0) {
      add_artwork_title_to_artist(artwork);
    }
  });
});
