// npm install glob
// node extract-artwork-movements.js > artwork-movements.txt

var fs = require("fs");
var glob = require("glob");
var path = require("path");

console.log("artwork.id\tartwork.title\tmovement.era.id\tmovement.era.name\tmovement.id\tmovement.name");

glob("collection/artworks/**/*.json", function (err, files) {
  if(! err) {
    files.forEach(function(file) {
      var json = fs.readFileSync(file).toString();
      var artwork = JSON.parse(json);
      for (var i = 0; i < artwork.movementCount; i++) {
        var movement = artwork.movements[i];
        console.log([artwork.id, artwork.title,
                     movement.era.id, movement.era.name,
                     movement.id, movement.name].join("\t"));
      }
    });
  }
});
