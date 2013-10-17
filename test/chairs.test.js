var tap = require('tap')
  , test = tap.test
  , $ = require('interlude')
  , Base = require('tournament')
  , Masters = require('../')
  , Chairs = require('../chairs')
  , rep = Chairs.idString;

test("invalid", function (t) {
  for (var i = 0; i < 10; i += 1) {
    var reason = Chairs.invalid(i);
    if (i >= 3) {
      t.equal(reason, null, "valid to create Chairs with " + i + " players");
      var trn = Chairs(i);
      t.equal(trn.matches.length, i-1, "n-1 matches in n=" + i + " player Chairs");
    }
    else {
      t.ok(reason, "illegal to create Chairs with " + i + " players");
    }
  }
  t.end();
});

test("chairs 5", function (t) {
  var trn = new Chairs(5);
  t.ok(!trn.isDone(), "!isDone r0");

  t.ok(trn.score(trn.matches[0].id, [5,4,3,2,1]), "score match 0");
  t.equal(Chairs.idString(trn.matches[0].id), "R1", "match 0 id");
  t.ok(!trn.isDone(), "!isDone r1");

  t.ok(trn.score(trn.matches[1].id, [4,3,2,1]), "score match 1");
  t.equal(Chairs.idString(trn.matches[1].id), "R2", "match 1 id");
  t.ok(!trn.isDone(), "!isDone r2");

  t.ok(trn.score(trn.matches[2].id, [3,2,1]), "score match 2");
  t.equal(Chairs.idString(trn.matches[2].id), "R3", "match 2 id");
  t.ok(!trn.isDone(), "!isDone r3");

  for (var i = 1; i < 5; i += 1) {
    if (i <= 2) {
      t.deepEqual(trn.upcoming(i), {s:1,r:4,m:1}, "players still left play");
    }
    else {
      t.equal(trn.upcoming(i), undefined, "knocked out ones do not")
    }
  };

  t.ok(trn.score(trn.matches[3].id, [2,1]), "score match 3");
  t.equal(Chairs.idString(trn.matches[3].id), "R4", "match 3 id");
  t.ok(trn.isDone(), "isDone r4");

  var ser = trn + '';
  var trn2 = Chairs.parse(ser);
  t.ok(trn2 instanceof Chairs, "trn2 is Chairs");
  t.ok(trn2 instanceof Masters, "trn2 is Masters");
  t.ok(trn2 instanceof Base, "trn2 is Base");
  t.deepEqual(trn2.matches, trn.matches, "matches same");

  var res = [
    {"seed" : 1, "wins" : 4, "pos" : 1, "sum" : 5+4+3+2},
    {"seed" : 2, "wins" : 3, "pos" : 2, "sum" : 4+3+2+1},
    {"seed" : 3, "wins" : 2, "pos" : 3, "sum" : 3+2+1},
    {"seed" : 4, "wins" : 1, "pos" : 4, "sum" : 2+1},
    {"seed" : 5, "wins" : 0, "pos" : 5, "sum" : 1}
  ];

  t.deepEqual(trn.results(), res, "results expected");
  t.deepEqual(trn2.results(), res, "same as if serialized first");

  t.end();
});
