var Masters = require('./masters');

// Chairs always knocks out ONE per round (only diff with Masters)
var makeKos = function (numPlayers) {
  var kos = [];
  for (var i = numPlayers; i > 2; i -= 1) {
    kos.push(1);
  }
  return kos;
};

var Chairs = Masters.sub('Chairs', ['numPlayers'], {
  init: function (initParent) {
    initParent(this.numPlayers, makeKos(this.numPlayers));
  }
});

Chairs.invalid = function (numPlayers) {
  return Masters.invalid(numPlayers, makeKos(numPlayers));
};

module.exports = Chairs;
