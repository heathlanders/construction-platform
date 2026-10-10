// Jest config — Mobile Enterprise Plan §C1.
// Plain node env: unit tests for pure logic (i18n integrity, sync/conflict helpers).
// RN/native-component rendering is out of scope here (that's Maestro E2E, §C3).
module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  // i18next / react-i18next ship CJS — no node_modules transform needed.
};
