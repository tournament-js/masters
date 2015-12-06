var $ = require('interlude')
  , KO = require('../')
  , test = require('bandage');

test('from', function *(t) {
  var k1 = new KO(16, { knockouts: [] });
  var m1 = k1.matches[0];
  t.eq(m1.p, $.range(16), 'ascending order on m.p');
  k1.score(m1.id, $.range(16));
  var top8 = $.pluck('seed', k1.results().slice(0, 8));
  t.eq(top8, [16,15,14,13,12,11,10,9], 'winners are bottom 8 seeds');

  var k2 = KO.from(k1, 8, { knockouts: [] });
  t.equal(k2.matches.length, 1, '1 matches k2');
  t.eq(k2.players(), [9,10,11,12,13,14,15,16], 'advancers from k1');
  var k2m1 = k2.matches[0];
  t.eq(k2m1.p, [16,15,14,13,12,11,10,9], 'all in k2 m0');
  k2.score(k2m1.id, $.range(8).reverse()); // maintain current order
  var top4 = $.pluck('seed', k2.results().slice(0, 4));
  t.eq(top4, [16,15,14,13], 'winners top 4 in k2');

  var k3 = KO.from(k2, 4);
  t.eq(k3.players(), [13,14,15,16], 'top 4 progressed to k3');
});
