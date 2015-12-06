var Base = require('tournament')
  , $ = require('interlude');

function Id(r) {
  this.s = 1;
  this.r = r;
  this.m = 1;
}

Id.prototype.toString = function () {
  return "R" + this.r; // always only one match per round
};

var mId = function (r) {
  return new Id(r);
};

//------------------------------------------------------------------
// init helpers
//------------------------------------------------------------------

var makeMatches = function (np, kos) {
  var ms = [];
  ms.push({ id: mId(1), p: $.range(np) });
  for (var i = 0; i < kos.length; i += 1) {
    // create the next round from current ko parameter
    np -= kos[i];
    ms.push({ id: mId(i+2), p: $.replicate(np, Base.NONE) });
  }
  return ms;
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

Masters.prototype._progress = function (match) {
  var ko = this.knockouts[match.id.r - 1];
  if (ko) {
    // if more matches to play -> progress the top not knocked out
    var adv = match.p.length - ko;
    var top = Base.sorted(match).slice(0, adv);
    var next = this.findMatch(mId(match.id.r + 1));
    next.p = top;
  }
};

Masters.prototype._verify = function (match, score) {
  var ko = this.knockouts[match.id.r - 1] | 0;
  var adv = match.p.length - ko;
  if (ko > 0 && score[adv-1] === score[adv]) {
    return "scores must unambiguous decide who is in the top " + adv;
  }
  return null;
};

Masters.prototype._safe = function (match) {
  var next = this.findMatch({ s: 1, r: match.id.r + 1, m: 1 });
  return next && !Array.isArray(next.m);
};

Masters.prototype._stats = function (res, m) {
  // handle players that have reached the match
  m.p.filter($.gt(0)).forEach(function (s) {
    Base.resultEntry(res, s).pos = m.p.length; // tie them all
  });
  if (m.m) {
    var ko = this.knockouts[m.id.r-1] | 0;
    var adv = m.p.length - ko;
    var isFinal = (!ko);

    // update positions
    var top = $.zip(m.p, m.m).sort(Base.compareZip);
    var startIdx = isFinal ? 0 : adv;
    Base.matchTieCompute(top.slice(startIdx), startIdx, function (p, pos) {
      Base.resultEntry(res, p).pos = pos;
    });

    // update score sum and wins (won if proceeded)
    for (var k = 0; k < top.length; k += 1) {
      var p = top[k][0];
      var sc = top[k][1];
      var resEl = Base.resultEntry(res, p);
      resEl.for += sc;
      resEl.against += (top[0][1] - sc); // difference with winner
      if ((!isFinal && k < adv) || (isFinal && resEl.pos === 1)) {
        resEl.wins += 1;
      }
    }
  }
  return res;
};

Masters.Id = Id;
module.exports = Masters;
