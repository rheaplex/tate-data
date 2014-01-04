// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

/*
 * sentiment doesn't give interesting results (other than to show that artwork
 * subject descriptions aren't very emotive),
 * and node-sentiwordnet ended up jamming,
 * so this isn't a particularly useful dataset to generate.
 */

var csv = require('csv');
var MongoClient = require('mongodb').MongoClient;
var sentiment = require('sentiment');

var columns = ['artwork.id', 'artwork.title',
              'afinn_111_score', 'afinn_111_comparative'
              ];

var artwork_count;

var score_artwork = function (artwork, rows) {
  sentiment(artwork.title, function (err, result) {
    if (err) throw err;
      rows.push([artwork.id, artwork.title,
             result.score, result.comparative]);
    artwork_count--;
    if(artwork_count == 0) {
      csv().from.array(rows).to.stream(process.stdout,
                                       {end: false,
                                        columns: columns});
    }
  });
};

MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) { throw err; }
  var artworks = db.collection('artworks');
  artworks.count({subjectCount:{$gt:0}}, function(err, count) {
    if(err) throw err;
    artwork_count = count;
    var rows = [];
    artworks.find({subjectCount:{$gt:0}}).each(function(err, artwork) {
      if(err) throw err;
      if(artwork === null) {
        db.close();
        return;
      }
      score_artwork(artwork, rows);
    });
  });
});
