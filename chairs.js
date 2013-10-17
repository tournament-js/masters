var Base = require('tournament')
  , Masters = require('./masters');

// only difference between Chairs and Masters is we always knock out ONE per round
var makeKos = function (numPlayers) {
  var kos = [];
  for (var i = numPlayers; i > 2; i -= 1) {
    kos.push(1);
  }
  return kos;
};

function Chairs(numPlayers) {
  if (!(this instanceof Chairs)) {
    return new Chairs(numPlayers);
  }
  Masters.call(this, numPlayers, makeKos(numPlayers));
}
Chairs.prototype = Object.create(Masters.prototype);
Chairs.parse = Base.parse.bind(null, Chairs);
Chairs.idString = Masters.idString;
Chairs.invalid = function (numPlayers) {
  return Masters.invalid(numPlayers, makeKos(numPlayers));
};

module.exports = Chairs;
