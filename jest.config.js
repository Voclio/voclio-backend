/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},                    // No transform — Node handles ESM natively via --experimental-vm-modules
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: { branches: 60, functions: 60, lines: 60, statements: 60 }
  },
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 30000
};
