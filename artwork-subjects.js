// npm install glob
// node extract-artwork-subjects.js > artwork-movements.txt

var fs = require("fs");
var glob = require("glob");
var path = require("path");

console.log("artwork.id\tartwork.title\tsubject.id\tsubject.name\tchild.id\tchild.name\tchildchild.id\tchilchild.name");

glob("collection/artworks/**/*.json", function (err, files) {
  if(! err) {
    files.forEach(function(file) {
      var json = fs.readFileSync(file).toString();
      var artwork = JSON.parse(json);
      if(artwork.subjectCount) {
        artwork.subjects.children.forEach(function(subject) {
          subject.children.forEach(function(child) {
            child.children.forEach(function(childchild) {
              console.log([artwork.id, artwork.title,
                           subject.id, subject.name,
                           child.id, child.name,
                           childchild.id, childchild.name].join("\t"));
            });
          });
        });
      }
    });
  }
});
