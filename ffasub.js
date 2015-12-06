var Base = require('tournament')
  , FFA = require('ffa')
  , $ = require('interlude');

/**
 * This is an implementation of Masters that inherits from FFA.
 * Because this illustrates well how to inherit from a tournament,
 * it has intentionally been left in this repository.
 *
 * Because Masters is the simplest tournament type, we have intentionally
 * left the dependency free version, as the actual entry point.
 *
 * Having said that, changing the entry point will cause all tests to pass.
 */
// ------------------------------------------------------------------
// Interface
// ------------------------------------------------------------------

function Id(r) {
  this.s = 1;
  this.r = r;
  this.m = 1;
}
Id.prototype.toString = function () {
  return 'R' + this.r;
};

var idReplace = function (match) {
  match.id = new Id(match.id.r); // throw away the old id
};

var Masters = FFA.sub('Masters', function (opts, initParent) {
  this.knockouts = opts.knockouts;
  var leftover = this.numPlayers;
  var advs = [];
  var sizes = [];
  for (var i = 0; i < opts.knockouts.length; i += 1) {
    sizes.push(leftover); // one match containing everyone
    var ko = opts.knockouts[i];
    advs.push(leftover - ko);
    leftover -= ko;
  }
  sizes.push(leftover);

  initParent({ advancers: advs, sizes: sizes });
  this.matches.forEach(idReplace); // override toString from ffa's ids
});

var makeDefaultKos = (np) => Array.from({length: np - 2}, () => 1);

Masters.configure({
  defaults: function (np, opts) {
    // no knockouts specified => musical chairs style (1 out per round)
    opts.knockouts = opts.knockouts || makeDefaultKos(np);
    return opts;
  },

  invalid: function (np, opts) {
    if (np < 3) {
      return 'need at least 3 players';
    }
    var kos = opts.knockouts;
    if (!Array.isArray(kos) || !kos.every(Base.isInteger)) {
      return 'knockouts must be an array of positive integers';
    }
    var ps = np;
    for (var i = 0; i < kos.length; i += 1) {
      var ko = kos[i];
      if (ko < 1) {
        return 'must knock out a positive number of players each round';
      }
      if (ps - ko <= 1) {
        return 'must leave at least two players in every match';
      }
      ps -= ko;
    }
    return null;
  }
});

Masters.prototype._sort = function (res) {
  var ffaRes = FFA.prototype._sort.call(this, res);
  ffaRes.forEach(function (r) {
    delete r.gpos; // unnecessary here - gpos === pos
  });
  return ffaRes;
};

Masters.Id = Id;
module.exports = Masters;
