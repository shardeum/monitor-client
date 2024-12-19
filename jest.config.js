module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  }
}; 