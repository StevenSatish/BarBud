const jestPreset = require('jest-expo/jest-preset');

module.exports = {
  ...jestPreset,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/helpers/setupMocks.ts'],
};
