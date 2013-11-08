// npm install glob
// node extract-artist-movements.js > artist-movements.txt

var fs = require("fs");
var glob = require("glob");
var path = require("path");

console.log("artist.id\tartist.fc\tmovement.era.id\tmovement.era.name\tmovement.id\tmovement.name");

glob("collection/artists/**/*.json", function (err, files) {
  if(! err) {
    files.forEach(function(file) {
      var json = fs.readFileSync(file).toString()
      var artist = JSON.parse(json);
      for (var i = 0; i < artist.movements.length; i++) {
        var movement = artist.movements[i];
        console.log([artist.id, artist.fc,
                    movement.era.id, movement.era.name,
                    movement.id, movement.name].join("\t"));
      }
    });
  }
});
