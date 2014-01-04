// Copyright 2013 Rob Myers
// License: GNU General Public License Version 3 or later

// There are not currently (end 2013) enough active locations to be useful
// So use birth and death locations

var sleep = require('sleep');
var csv = require('csv');
var MongoClient = require('mongodb').MongoClient;

var geocoderProvider = 'openstreetmap';
var httpAdapter = 'http';
var geocoder = require('node-geocoder').getGeocoder(geocoderProvider,
                                                    httpAdapter);

var columns = ['artist.id', 'artist.fc',
               'birth_lat', 'birth_lon', 'birth_country', 'birth_city',
               'death_lat', 'death_lon', 'death_country', 'death_city'];

var query_count = 0;

// Cache the queries so we don't waste bandwidth (or get blocked for dupes)

var query_cache = {};

var fetch_geolocation = function (location, callback) {
  var geolocation = query_cache[location];
  if(geolocation) {
    callback(null, geolocation);
  } else {
    // Don't hammer web APIs
    sleep.sleep(1);
    geocoder.geocode(location, function(err, fetched_location) {
      if (! err) query_cache[location] = fetched_location;
      callback(err, fetched_location);
    });
  }
};

var write_csv = function (db) {
  var rows = [];
  db.collection('artist_locations').find().each(function(err, locations) {
    if(err) throw err;
    if(locations === null) {
      db.close();
      csv().from.array(rows).to.stream(process.stdout,
                                       {end: false,
                                        columns: columns});
      return;
    }

    var birth_lat = undefined;
    var birth_lon = undefined;
    var birth_country = undefined;
    var birth_state = undefined;
    var birth_city = undefined;
    var death_lat = undefined;
    var death_lon = undefined;
    var death_country = undefined;
    var death_state = undefined;
    var death_city = undefined;

    if(locations.birth != null && locations.birth.length > 0) {
      birth_lat = locations.birth[0].latitude;
      birth_lon = locations.birth[0].longitude;
      birth_country = locations.birth[0].country;
      birth_city = locations.birth[0].city;
    }

    if(locations.death != null && locations.death.length > 0) {
      death_lat = locations.death[0].latitude;
      death_lon = locations.death[0].longitude;
      death_country = locations.death[0].country;
      death_city = locations.death[0].city;
    }

    rows.push([locations.artist_id, locations.artist_fc,
               birth_lat, birth_lon, birth_country, birth_city,
               death_lat, death_lon, death_country, death_city]);
  });
};

// Delay trying to read all the data until it's all been inserted.

var finished_artist = function (db) {
  query_count--;
  if(query_count == 0) {
    write_csv(db);
  }
};

var store_artist_locations = function (db, artist, birth_location,
                                       death_location) {
  db.collection('artist_locations').insert({artist_id: artist.id,
                                            artist_fc: artist.fc,
                                            birth:birth_location,
                                            death:death_location},
                                           function(err, doc) {
                                             finished_artist(db);
                                           });
};

var fetch_death_location = function (db, artist, birth_location) {
  fetch_geolocation(artist.death.place.name, function(err, death_location) {
    if (err) throw err;
    store_artist_locations(db, artist, birth_location, death_location);
  });
};

var fetch_birth_location = function (db, artist) {
  fetch_geolocation(artist.birth.place.name, function(err, birth_location) {
    if (err) throw err;
    if (artist.death && artist.death.place) {
      fetch_death_location(db, artist, birth_location);
    } else {
      store_artist_locations(db, artist, birth_location, null);
    }
  });
};

var fetch_artist_locations = function (db, artist) {
  // Not actually an error, but we want this to go to stderr
  console.error(artist.fc);
  // If the artist has a birth place, try to get both
  // Otherwise if they have a death location only try to get that
  if(artist.birth && artist.birth.place) {
    fetch_birth_location(db, artist);
  } else if (artist.death && artist.death.place) {
    fetch_death_location(db, artist, null);
  } else {
    throw "that shouldn't happen";
  }
};

var check_for_artists_locations = function (db, artists) {
  artists.each(function(err, artist) {
    if (err) throw err;
    if(artist === null) return;
    db.collection('artist_locations').
      findOne({artist_id: artist.id}, function(err, location) {
      if (err) throw err;
      if (location === null) {
        fetch_artist_locations(db, artist);
      } else {
        finished_artist(db);
      }
    });
  });
};

var count_artists_locations = function (db) {
  var artists = db.collection('artists').find({
    $or:[
      {'birth.place': {$exists: true}},
      {'death.place': {$exists: true}}
    ]});
  artists.count(function(err, count) {
    if(err) throw err;
    // Keep track of the number of queries made so we know when they're all done
    query_count = count;
    check_for_artists_locations(db, artists);
  });
};

MongoClient.connect('mongodb://127.0.0.1:27017/tate', function(err, db) {
  if(err) throw err;
  count_artists_locations(db);
});
