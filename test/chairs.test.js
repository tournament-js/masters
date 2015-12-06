var Base = require('tournament')
  , Masters = require('../')
  , test = require('bandage');

var gid = (r) => new Masters.Id(r);

test('invalid', function *(t) {
  for (var i = 0; i < 10; i += 1) {
    var reason = Masters.invalid(i);
    if (i >= 3) {
      t.eq(reason, null, 'valid to create Masters with ' + i + ' players');
      var trn = new Masters(i);
      t.eq(trn.matches.length, i-1, 'n-1 matches in n=' + i + ' player Masters');
    }
    else {
      t.ok(reason, 'illegal to create Masters with ' + i + ' players');
    }
  }
});

test('chairs', function *(t) {
  var trn = new Masters(5);
  t.ok(!trn.isDone(), '!isDone r0');

  t.ok(trn.score(trn.matches[0].id, [5,4,3,2,1]), 'score match 0');
  t.eq(trn.matches[0].id.toString(), 'R1', 'match 0 id');
  t.ok(!trn.isDone(), '!isDone r1');

  t.ok(trn.score(trn.matches[1].id, [4,3,2,1]), 'score match 1');
  t.eq(trn.matches[1].id.toString(), 'R2', 'match 1 id');
  t.ok(!trn.isDone(), '!isDone r2');

  t.ok(trn.score(trn.matches[2].id, [3,2,1]), 'score match 2');
  t.eq(trn.matches[2].id.toString(), 'R3', 'match 2 id');
  t.ok(!trn.isDone(), '!isDone r3');

  for (var i = 1; i < 5; i += 1) {
    if (i <= 2) {
      t.eq(trn.upcoming(i)[0].id, gid(4), 'players still left play');
    }
    else {
      t.eq(trn.upcoming(i).length, 0, 'knocked out ones do not');
    }
  }

  t.ok(trn.score(trn.matches[3].id, [2,1]), 'score match 3');
  t.eq(trn.matches[3].id.toString(), 'R4', 'match 3 id');
  t.ok(trn.isDone(), 'isDone r4');

  var res = [
    { seed: 1, wins: 4, pos: 1, against: 0,       for: 5+4+3+2 },
    { seed: 2, wins: 3, pos: 2, against: 1+1+1+1, for: 4+3+2+1 },
    { seed: 3, wins: 2, pos: 3, against: 2+2+2,   for: 3+2+1 },
    { seed: 4, wins: 1, pos: 4, against: 3+3,     for: 2+1 },
    { seed: 5, wins: 0, pos: 5, against: 4,       for: 1 }
  ];

  t.eq(trn.results(), res, 'results expected');
});
