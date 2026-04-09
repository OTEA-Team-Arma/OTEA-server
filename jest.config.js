module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/server.js',
    '!backend/__tests__/**'
  ],
  testTimeout: 10000
};
