var Base = require('tournament')
  , $ = require('interlude');

// assumes valid parameters
var makeMatches = function (np, kos) {
  var ms = [];
  ms.push({id: {s:1, r:1, m:1}, p: $.range(np)});
  for (var i = 0; i < kos.length; i += 1) {
    // create the next round from current ko parameter
    np -= kos[i];
    ms.push({id: {s:1, r:i+2, m:1}, p: $.replicate(np, Base.NONE)});
  }
  return ms;
};

var Masters = Base.sub('Masters', ['numPlayers', 'kos'], {
  init: function (initParent) {
    initParent(makeMatches(this.numPlayers, this.kos));
  },
  score: function (id /*,score*/) {
    var ko = this.kos[id.r - 1] || 0;
    if (ko) {
      // if more matches to play -> progress the top not knocked out
      var m = this.findMatch(id);
      var adv = m.p.length - ko;
      var top = Base.sorted(m).slice(0, adv);
      var nextM = this.findMatch({s:1, r: m.id.r+1, m:1});

      if (!nextM || top.length !== adv) { // sanity
        var str =  !nextM ?
          "next match not found in tournament":
          "less players than expected in round " + m.id.r+1;
        throw new Error("corrupt " + Masters.idString(id) + ": " + str);
      }
      // progress
      nextM.p = top;
    }
  },
  unscorable: function (id, score) {
    var ko = this.kos[id.r - 1] || 0;
    var m = this.findMatch(id);
    var adv = m.p.length - ko;
    if (ko > 0 && score[adv-1] === score[adv]) {
      return "scores must unambiguous decide who is in the top " + adv;
    }
    return null;
  }
});

Masters.invalid = function (np, kos) {
  if (!Number.isFinite(np) || Math.ceil(np) !== np || np < 3) {
    return "need at least 3 players";
  }
  if (!Array.isArray(kos)) {
    return "kos must be an array of integers";
  }
  for (var i = 0; i < kos.length; i += 1) {
    var ko = kos[i];
    if (!Number.isFinite(ko) || Math.ceil(ko) !== ko) {
      return "kos must be an array of integers";
    }
    if (ko < 1) {
      return "must knock out players each round";
    }
    if (np - ko <= 1) {
      return "cannot leave one or less players in a match";
    }
    np -= ko;
  }
  return null;
};
Masters.idString = function (id) {
  return "R" + id.r; // always only one match per round
};

// helper for results
var positionTies = function (res, sortedPairSlice, startPos) {
  // when we only score a subset start positioning at the beginning of slice
  var pos = startPos
    , ties = 0
    , scr = -Infinity;

  // loop over players in order of their score
  for (var k = 0; k < sortedPairSlice.length; k += 1) {
    var pair = sortedPairSlice[k]
      , p = pair[0] - 1
      , s = pair[1];

    // if this is a tie, pos is previous one, and next real pos must be incremented
    if (scr === s) {
      ties += 1;
    }
    else {
      pos += 1 + ties; // if we tied, must also + that
      ties = 0;
    }
    res[p].pos = pos;
    scr = s;

    // grand final winner have to be computed outside normal progression check
    // so do it in here if we just moved the guy to position 1
    // this function is only called once on each set - and tested heavily anyway
    if (res[p].pos === 1) {
      res[p].wins += 1;
    }
  }
};


Masters.prototype.results = function () {
  var res = Base.prototype.results.call(this, { sum: 0 });
  var kos = this.kos;
  var ms = this.matches;

  // iterative ko results involve: assume previous match have filled in results:
  // then scan new match m:
  // if not played, all tie at m.p.length, else:
  // - losers should have pos === their last round scores, so current pos
  // - winners will get their scores calculated in the next round (unless final)
  // - winners get complete final calculation if final
  // - can leave all other player alone as they were covered in earlier iterations

  for (var i = 0; i < ms.length; i += 1) {
    var m = ms[i];
    if (!m.m) {
      // no score, tie all players in this match at m.p.length
      for (var j = 0; j < m.p.length; j += 1) {
        var idx = m.p[j] - 1;
        res[idx].pos = m.p.length;
      }
      break; // last scored match, no more to do
    }
    var adv = m.p.length - (kos[i] || 0);
    var top = $.zip(m.p, m.m).sort(Base.compareZip);

    // update score sum and wins (won if proceeded)
    for (var k = 0; k < top.length; k += 1) {
      var p = top[k][0] - 1;
      var sc = top[k][1];
      res[p].sum += sc;
      if (i < ms.length - 1 && k < adv) {
        res[p].wins += 1;
      }
    }

    if (kos[i]) { // set positions (allow ties) for losers
      positionTies(res, top.slice(-kos[i]), top.length - kos[i]);
      // next match will set the remaining players if unscored
      // if scored one more round of updating losers
    }

    if (!kos[i]) {
      // update all players in final (allow ties)
      positionTies(res, top, 0);
      break; // no more matches after final
    }
  }
  return res.sort(Base.compareRes);
};

module.exports = Masters;
