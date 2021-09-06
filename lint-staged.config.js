// lint-staged.config.js

// const { lintStagedBaseConfig } = require('@level-up/utilities');

module.exports = {
  'server/**/*.+(js|ts|json|css|html)': ['npm run prettify'],
};
