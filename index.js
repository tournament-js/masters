module.exports = process.env.MASTERS_COV
  ? require('./lib-cov/masters.js')
  : require('./lib/masters.js');
