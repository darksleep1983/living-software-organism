'use strict';
module.exports = {
  ...require('./context'),
  ...require('./corpus-adapter'),
  homeostasis: require('./homeostasis'),
  repair: require('./repair'),
  capabilities: require('./capabilities'),
  immune: require('./immune'),
  metabolism: require('./metabolism'),
  history: require('./history'),
  recovery: require('./recovery'),
  experimental: require('./experimental'),
};
