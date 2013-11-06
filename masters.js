var Base = require('tournament')
  , $ = require('interlude');

//------------------------------------------------------------------
// init helpers
//------------------------------------------------------------------

var makeMatches = function (np, kos) {
  var ms = [];
  ms.push({ id: { s: 1, r: 1, m: 1 }, p: $.range(np) });
  for (var i = 0; i < kos.length; i += 1) {
    // create the next round from current ko parameter
    np -= kos[i];
    ms.push({ id: { s: 1, r: i+2, m: 1 }, p: $.replicate(np, Base.NONE) });
  }
  return ms;
};

//------------------------------------------------------------------
// positioning helper
//------------------------------------------------------------------

var positionTies = function (res, sortedPairSlice, startPos) {
  // when we only score a subset start positioning at the beginning of slice
  var pos = startPos
    , ties = 0
    , scr = -Infinity;

  // loop over players in order of their score
  for (var k = 0; k < sortedPairSlice.length; k += 1) {
    var pair = sortedPairSlice[k]
      , p = pair[0]
      , s = pair[1];

    // if this is a tie, pos is previous one, and next real pos must be incremented
    if (scr === s) {
      ties += 1;
    }
    else {
      pos += 1 + ties; // if we tied, must also + that
      ties = 0;
    }
    var resEl = Base.resultEntry(res, p);
    resEl.pos = pos;
    scr = s;
  }
};

//------------------------------------------------------------------
// Interface
//------------------------------------------------------------------

var Masters = Base.sub('Masters', function (opts, initParent) {
  this.knockouts = opts.knockouts;
  initParent(makeMatches(this.numPlayers, this.knockouts));
});

var makeDefaultKos = function (np) {
  var kos = [];
  for (var i = np; i > 2; i -= 1) {
    kos.push(1);
  }
  return kos;
};

Masters.configure({
  defaults: function (np, opts) {
    // no knockouts specified => musical chairs style (1 out per round)
    opts.knockouts = opts.knockouts || makeDefaultKos(np);
    return opts;
  },

  invalid: function (np, opts) {
    if (np < 3) {
      return "need at least 3 players";
    }
    var kos = opts.knockouts;
    if (!Array.isArray(kos) || !kos.every(Base.isInteger)) {
      return "knockouts must be an array of positive integers";
    }
    for (var i = 0; i < kos.length; i += 1) {
      var ko = kos[i];
      if (ko < 1) {
        return "must knock out a positive number of players each round";
      }
      if (np - ko <= 1) {
        return "must leave at least two players in every match";
      }
      np -= ko;
    }
    return null;
  }
});

Masters.idString = function (id) {
  return "R" + id.r; // always only one match per round
};

Masters.prototype._progress = function (match) {
  var ko = this.knockouts[match.id.r - 1] || 0;
  if (ko) {
    // if more matches to play -> progress the top not knocked out
    var adv = match.p.length - ko;
    var top = Base.sorted(match).slice(0, adv);
    var nextM = this.findMatch({s:1, r: match.id.r+1, m:1});

    if (!nextM || top.length !== adv) { // sanity
      var str =  !nextM ?
        "next match not found in tournament":
        "less players than expected in round " + match.id.r+1;
      throw new Error("corruption at " + this.rep(match.id) + ": " + str);
    }
    // progress
    nextM.p = top;
  }
};

Masters.prototype._verify = function (match, score) {
  var ko = this.knockouts[match.id.r - 1] || 0;
  var adv = match.p.length - ko;
  if (ko > 0 && score[adv-1] === score[adv]) {
    return "scores must unambiguous decide who is in the top " + adv;
  }
  return null;
};

Masters.prototype._stats = function (res, m) {
  // handle players that have reached the match
  m.p.filter($.gt(0)).forEach(function (s) {
    Base.resultEntry(res, s).pos = m.p.length; // tie them all
  });
  if (m.m) {
    var ko = this.knockouts[m.id.r-1];
    var adv = m.p.length - (ko || 0);
    var isFinal = (ko == null);
    var top = $.zip(m.p, m.m).sort(Base.compareZip);

    // update positions
    if (!isFinal) {
      // tie compute the non-advancers
      positionTies(res, top.slice(-ko), adv);
    }
    else if (isFinal) {
      // tie compute the entire final
      positionTies(res, top, 0);
    }

    // update score sum and wins (won if proceeded)
    for (var k = 0; k < top.length; k += 1) {
      var p = top[k][0];
      var sc = top[k][1];
      var resEl = Base.resultEntry(res, p);
      resEl.for += sc;
      // TODO: against?
      if ((!isFinal && k < adv) || (isFinal && resEl.pos === 1)) {
        resEl.wins += 1;
      }
    }
  }
  return res;
};

module.exports = Masters;
