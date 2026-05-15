export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'chore', 'refactor',
    ]],
    'scope-empty': [2, 'never'],
    'scope-enum': [1, 'always', [
      'member', 'payment', 'medical-certificate',
      'locker', 'sport', 'discipline', 'github', 'deps',
      'release'
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
  },
};
