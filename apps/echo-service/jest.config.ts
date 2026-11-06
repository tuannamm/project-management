import type { Config } from 'jest';

// Lưu ý: NestJS 12 là ESM-only, Jest chỉ load được trên Node ≥ 24.9.
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
};

export default config;
