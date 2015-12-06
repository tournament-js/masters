#!/bin/sh
$(npm bin)/bndg test/*.test.js
sed -i 's/masters.js/ffasub.js/' package.json
$(npm bin)/bndg test/*.test.js
sed -i 's/ffasub.js/masters.js/' package.json
