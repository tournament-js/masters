var $ = require('interlude')
  , Masters = require('../')
  , nullLog = require('smell')()
  , test = require('bandage');

var gid = (r) => new Masters.Id(r);

// these tests all cover a simple 10 [2,4,2] setup
test('score', function *(t) {
  var kos = [2,4,2];
  var opts = { knockouts: kos };
  var ko = new Masters(10, opts)
    , ms = ko.matches;

  t.eq(ms.length, kos.length + 1, 'games required');
  ms.forEach(function (m, i) {
    t.eq(m.id.r, i+1, 'round is one indexed, and one match per round');
  });
  t.eq(ms[0].p, $.range(10), 'all 10 players in r1');

  var leftover = 10;
  kos.forEach(function (k, i) {
    var r = i+1;
    // matches in round > r have no players yet
    ko.findMatchesRanged({ r: r + 1 }).forEach(function (m) {
      t.eq($.nub(m.p).length, 1, 'all NA in ' + m.id);
    });

    // score current round r (so that highest seed wins)
    var couldScore = ko.score(ms[i].id, $.range(leftover).reverse());
    t.ok(couldScore, 'could score ' + ms[i].id);
    // check progression
    t.eq(ms[i+1].p, $.range(leftover - k), k + ' knocked out of ' + leftover);

    // matches in round < r cannot be rescored (because r was scored)
    ko.findMatchesRanged({}, {r: r-1}).forEach(function (m) {
      var reason = ko.unscorable(m.id, $.range(m.p.length));
      t.eq(reason, m.id + ' cannot be re-scored', 'cannot rescore past ' + m.id);
    });

    leftover -= k; // only this many left for next round
  });

  // now all matches should have players
  leftover = 10;
  ms.forEach(function (m, i) {
    t.eq(m.p, $.range(leftover), leftover + ' players in' + m.id);
    leftover -= kos[i];
  });
});

test('results', function *(t) {
  var kos = [2,4,2];
  var opts = { knockouts: kos , log: nullLog };
  var ko = new Masters(10, opts);

  // pre-scoring:
  var res = ko.results();
  t.ok(res, 'we got results for r' + 0);
  t.eq(res.length, 10, 'all players in result after round ' + 1);
  res.forEach(function (p) {
    t.ok(p.seed <= 10, p.seed + ' is in top 10');
    t.eq(p.wins, 0, p.seed + ' has not won anything yet');
    t.eq(p.for, 0, p.seed + ' score sums to zero');
    t.eq(p.pos, 10, p.seed + ' ties at match 1 length');
  });
  $.range(10).forEach(function (n) {
    var up = ko.upcoming(n);
    t.ok(up.length, n + ' has an upcoming match');
    t.eq(up[0].id, gid(1), 'match is in r' + 1);
  });

  // round 1
  var failScores = [10,9,8,7,6,5,4,3,3,1]; // ties at border
  t.eq(ko.unscorable(gid(1), $.range(10)), null, 'can score r' + 1);
  t.ok(ko.unscorable(gid(1), failScores), 'must cleanup losers in r' + 1);
  // NB: this prints to console without nullLog
  t.ok(!ko.score(gid(1), failScores), 'must cleanup losers in r' + 1);

  // score so last 2 tie
  t.ok(ko.score(gid(1), [10,9,8,7,6,5,4,3,2,2]), 'scored r' + 1);
  t.ok(ko.unscorable(gid(1), failScores), 'should no longer score r' + 1);
  res = ko.results();
  t.ok(res, 'we got results for r' + 1);
  t.eq(res.length, 10, 'all players in result after round ' + 1);
  res.slice(0, -kos[0]).forEach(function (p, i) {
    t.ok(p.seed <= 8, p.seed + ' is in first 8 as scored that way');
    t.eq(p.wins, 1, p.seed + ' won 1 match');
    t.eq(p.for, 10 - i, p.seed + ' score sums to what we gave him in match 1');
    t.eq(p.pos, 8, p.seed + ' ties at match 2 length');
  });
  res.slice(-kos[0]).forEach(function (p) {
    t.eq(p.wins, 0, p.seed + ' did not advance');
    t.eq(p.for, 2, p.seed + ' got 2 pts');
    t.eq(p.pos, 9, p.seed + ' tied at 9th');
  });
  $.range(10).forEach(function (n) {
    var up = ko.upcoming(n);
    if (n <= 8) {
      t.ok(up.length, n + ' has an upcoming match');
      t.eq(up[0].id, gid(2), 'match is in r' + 2);
    }
    else {
      t.ok(!up.length, 'no upcoming match for ' + n);
    }
  });

  // round 2
  failScores = [8,7,6,5,5,3,2,1]; // wont work cant distinguish losers/winners
  // NB: this prints to console without nullLog
  t.ok(!ko.score(gid(2), failScores), 'must cleanup losers in r' + 2);

  // score so 6th 7th tie
  t.ok(ko.score(gid(2), [8,7,7,5,4,3,3,2]), 'scored r' + 2);
  t.eq(kos[1], 4, 'should eliminate 4 in r' + 2);
  res = ko.results();
  t.ok(res, 'we got results for r' + 2);
  t.eq(res.length, 10, 'all players in result after round ' + 2);

  // winners of both matches:
  res.slice(0, -(kos[0] + kos[1])).forEach(function (p) {
    // the ones that won both matches!
    t.ok(p.seed <= 4, p.seed + ' is in first 4 as scored that way');
    t.eq(p.wins, 2, p.seed + ' won 2 matches');
    t.eq(p.pos, 4, p.seed + ' ties at match 3 length');
  });
  // winners of 1st match, losers of 2nd
  res.slice(kos[1], -kos[0]).forEach(function (p, i) {
    t.ok(p.seed <= 8, p.seed + ' is in first 8 as scored that way');
    t.eq(p.wins, 1, p.seed + ' won 1 match');
    t.ok(p.for > 10 - (i+kos[1]), p.seed + ' score sums to what more than m1 pts');
    t.ok(p.pos <= 10-kos[0] && p.pos > kos[1], p.seed + ' pos resides in between');

    // verify ties for 6 and 7 and verify slice size
    if (p.seed === 8)      { t.eq(p.pos, 8, p.seed + ' came 8th'); }
    else if (p.seed === 7) { t.eq(p.pos, 6, p.seed + ' tied 6th'); }
    else if (p.seed === 6) { t.eq(p.pos, 6, p.seed + ' tied 6th'); }
    else if (p.seed === 5) { t.eq(p.pos, 5, p.seed + ' came 5th'); }
    else                   { t.ok(false, 'didnt counted any other in here'); }
  });

  // losers of 1st match stay the same
  res.slice(-kos[0]).forEach(function (p) {
    t.eq(p.wins, 0, p.seed + ' did not advance');
    t.eq(p.for, 2, p.seed + ' got 2 pts');
    t.eq(p.pos, 9, p.seed + ' tied at 9th');
  });
  $.range(10).forEach(function (n) {
    var up = ko.upcoming(n);
    if (n <= 4) {
      t.ok(up.length, n + ' has an upcoming match');
      t.eq(up[0].id, gid(3), 'match is in r' + 3);
    }
    else {
      t.ok(!up.length, 'no upcoming match for ' + n);
    }
  });

  // round 3
  t.eq(kos[2], 2, 'should only be 2 left after scoring r' + 3);
  t.eq(ko.unscorable(gid(3), [4,3,2,1]), null, 'can score r' + 3);
  t.ok(ko.score(gid(3), [4,3,2,1]), 'scored r' + 3);
  res = ko.results();
  t.ok(res, 'we got results for r' + 3);

  res.slice(0, -(kos[2] + kos[1] + kos[0])).forEach(function (p, i) {
    t.ok(i < 2, 'should only be 2 players left in here');

    t.ok(p.seed <= 2, p.seed + ' is 1 or 2');
    t.eq(p.wins, 3, p.seed + ' won 3 matches');
  });

  $.range(10).forEach(function (n) {
    var up = ko.upcoming(n);
    if (n <= 2) {
      t.ok(up.length, n + ' has an upcoming match');
      t.eq(up[0].id, gid(4), 'match is in r' + 4);
    }
    else {
      t.ok(!up.length, 'no upcoming match for ' + n);
    }
  });

  // round 4
  t.ok(ko.score(gid(4), [2,2]), 'scored r' + 4);
  res = ko.results();
  t.ok(res, 'we got results for r' + 4);
  t.eq(res.length, 10, 'all players in result after round ' + 4);

  res.slice(0, -(kos[2] + kos[1] + kos[0])).forEach(function (p, i) {
    t.ok(i < 2, 'should only be 2 players left in here');

    t.ok(p.seed <= 2, p.seed + ' is 1 or 2');
    t.eq(p.wins, 4, p.seed + ' tie won final as well!');
  });

  ko.matches.forEach(function (m, i) {
    t.ok(m.m, 'match ' + i + ' scored');
  });

  $.range(10).forEach(function (n) {
    var up = ko.upcoming(n);
    t.ok(!up.length, 'no upcoming match for ' + n);
  });
});
