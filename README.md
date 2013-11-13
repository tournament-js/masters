# Masters tournaments
[![Build Status](https://secure.travis-ci.org/clux/masters.png)](http://travis-ci.org/clux/masters)
[![Dependency Status](https://david-dm.org/clux/masters.png)](https://david-dm.org/clux/masters)

    Stability: 2 - Stable

## Overview
Masters tournaments consist of a pool of players, repeatedly fighting against each other and gradually reducing the number of players each round. We specify the number of players to knock out each round as an array of integers.

## Construction
Simply specify the number of players and an array of numbers to knock out per rounds. The resulting tournament will have the same number of matches as that array's length + 1.

```js
// 5p match -> 4p match -> 3p match -> 2p final
var trn = new Masters(5);

// see below
var trn = new Masters(10, { knockouts: [3, 2, 2] });
```

This example will create:

- 10 player match in round 1
- 7 player match in round 2
- 5 player match in round 3
- 3 player (final) match

## Limits
Limits adds a way to ensure we get the top `n` players from the final without having to do re-matches. Set the `limit`: `n` on the third options argument to the constructor to activate this.

This will simly engage a disambiguation clause for the final match.

## Match Ids
Like all tournament types, matches have an `id` object that contains three values all in `{1, 2, ...}`:

```js
{
  s: Number, // the bracket - always 1 - only WB supported
  r: Number, // the round number in the current bracket
  m: Number  // the match number - always 1 - only single match rounds supported
}
```

## Finding matches
All the normal [Base class helper methods](https://github.com/clux/tournament/blob/master/doc/base.md#common-methods) exist on a `Duel` instance. That said, masters are so simple you can do this very simply anyway:

```js
var r1 = trn.findMatches({ r: 1 });
// NB: equivalent to: [trn.matches[0]]

var firstThreeRounds = trn.findMatchesRanged({}, { r: 3 });
// NB: equivalent to: trn.matches.slice(0, 3)

var upcomingForSeed1 = trn.upcoming(1);
var matchesForSeed1 = trn.matchesFor(1);
```

## Scoring Matches
Call `trn.hscore(id, [player0Score, player1Score, ...])` as for every match played.
The `trn.unscorable(id, scoreArray)` will tell you whether the score is valid. Read the entry in the [tournament commonalities doc](https://github.com/clux/tournament/blob/master/doc/base.md#ensuring-scorability--consistency).

### NB: Ambiguity restriction
Masters allow for ties everywhere except between the first knocked out player and the last advancing player. In the final, ties are fully allowed, so multiple players can share the first place. Check for this if it's unsuited to your game/application.

## Special Methods
None.

## Caveats
None. Maybe a note that this is technically a special case of FFA eliminations.

## License
MIT-Licensed. See LICENSE file for details.
