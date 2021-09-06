const { eslintBaseConfig } = require('@level-up/utilities');

eslintBaseConfig.rules = {
  ...eslintBaseConfig.rules,
  camelcase: 'warn',
  'consistent-return': 'off',
  eqeqeq: 'warn',
  'import/newline-after-import': 'warn',
  'import/no-useless-path-segments': 'warn',
  'import/order': 'warn',
  'new-cap': 'warn',
  'no-async-promise-executor': 'warn',
  'no-else-return': 'warn',
  'no-lonely-if': 'warn',
  'no-new-wrappers': 'warn',
  'no-restricted-syntax': 'warn',
  'no-return-assign': 'warn',
  'no-throw-literal': 'warn',
  'no-undef': 'warn',
  'no-underscore-dangle': 'off',
  'no-unneeded-ternary': 'warn',
  'no-unused-expressions': 'warn',
  'prefer-promise-reject-errors': 'warn',
  'prettier/prettier': 'warn',
  quotes: 'warn',
  'require-await': 'warn',
  'spaced-comment': 'warn',
};

module.exports = eslintBaseConfig;
