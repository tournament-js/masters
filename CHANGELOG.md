0.5.1 / 2014-07-22?
==================
  * Documentation and coverage release

0.5.0 / 2013-12-24
==================
  * Updated `tournament` to 0.21.0 so that `Masters` is an `EventEmitter`

0.4.3 / 2013-11-13
==================
  * `results[i].against` added - measures sum(difference from winner)
  * Interface with tournament@0.20.2 for common tieComputers
  * Added an implementation that inherits from FFA for implementors help

0.4.2 / 2013-11-06
==================
  * Interface with tournament@0.20.0 for cleaner results implementation

0.4.1 / 2013-11-02
==================
  * Interface with tournament@0.19.0 for multi stage support

0.4.0 / 2013-10-31
==================
  * Using tournament@0.18.0 for unified constructor interface
  * Everything but numPlayers optional to constructor
  * Not specifying `knockouts` for the specifics of what to knock out will give you what Chairs used to do (knock out one per round until 2 left)
  * Chairs have been removed

0.3.0 / 2013-10-25
==================
  * Using tournament@0.17.0 for better stats interface
  * Rename `sum` to `for` for tournament consistency (maybe add against in future)
  * Huge code readability improvements

0.2.0 / 2013-10-22
==================
  * Use tournament@0.16.0 interface

0.1.2 / 2013-10-17
==================
  * Include a separate `require('masters/chairs')` entry point for pure musical chairs style (knock out one EVERY round)

0.1.1 / 2013-10-16
==================
  * refactor `score` to use Base implementation

0.1.0 / 2013-10-15
==================
  * first release - factored out of tournament 0.14.0
