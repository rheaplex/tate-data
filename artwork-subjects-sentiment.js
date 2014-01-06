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
//var _ = require('underscore');
var sentiment = require('sentiment');
//var SentiWN = require("node-sentiwordnet");

var columns = ['artwork.id', 'artwork.title',
              'afinn_111_score', 'afinn_111_comparative'
              //'sentiwordnet_score', 'sentiwordnet_comparative'
              ];

var artwork_count;

/*var Senti = new SentiWN;
Senti.setDB(0);

var sentiwordnet_score_aux = function (words, wordcount, score, callback) {
  if(words.length == 0) {
    callback({score: score, comparative: score / wordcount});
    return;
  }
  Senti.get(words[0] + '#1', function(result){
    sentiwordnet_score_aux(words.slice(1), wordcount,
                           score + result.PosScore - result.NegScore,
                           callback);
  });
};

var sentiwordnet_score = function (artwork, subjects, callback) {
  var words = subjects.replace(/\[^A-Za-z]+/g, '')
              .replace('/\s+/',' ')
              .toLowerCase()
              .split(' ');
  sentiwordnet_score_aux(words, words.length, 0, callback);
};


var store_scores = function (artwork, afinn_result, sentiwordnet_result, rows) {
  rows.push([artwork.id, artwork.title,
             afinn_result.score, afinn_result.comparative,
             sentiwordnet_result.score, sentiwordnet_result.comparative]);
  artwork_count--;
  console.log(artwork_count);
  if(artwork_count == 0) {
    csv().from.array(rows).to.stream(process.stdout,
                                     {end: false,
                                      columns: columns});
  }
};*/

var artwork_subjects = function (artwork) {
  var subjects = [];
  artwork.subjects.children.forEach(function(child) {
    child.children.forEach(function(childchild) {
      childchild.children.forEach(function(childchildchild) {
        subjects.push(childchildchild.name);
      });
    });
  });
  return subjects.join(' ');
};

var score_artwork = function (artwork, rows) {
  // FIXME: swap terms separated by commas, e.g boat, sailing
  // Tokenizer doesn't like \t, use ' '
  var subjects = artwork_subjects(artwork);
  sentiment(subjects, function (err, result) {
    if (err) throw err;
    //sentiwordnet_score(artwork, subjects, function(sentiwordnet_result) {
    //  store_scores(artwork, result, sentiwordnet_result, rows);
    //});
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
