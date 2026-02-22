/** @type {import('jest').Config} */
const config = {
  projects: [
    // ── Backend testovi (Node okruženje) ──
    {
      displayName: 'backend',
      testEnvironment: 'node',
      roots: ['<rootDir>/__tests__/api', '<rootDir>/__tests__/lib'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testMatch: ['**/*.test.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
      },
    },
    // ── Frontend testovi (jsdom okruženje) ──
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/__tests__/components'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.ts',
        '^next/navigation$': '<rootDir>/__mocks__/nextNavigation.ts',
        '^next-auth/react$': '<rootDir>/__mocks__/nextAuthReact.ts',
        '^next/link$': '<rootDir>/__mocks__/nextLink.tsx',
      },
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
      testMatch: ['**/*.test.tsx'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            module: 'CommonJS',
            moduleResolution: 'node',
            isolatedModules: true,
            jsx: 'react-jsx',
            esModuleInterop: true,
            allowJs: true,
            skipLibCheck: true,
          },
        }],
      },
    },
  ],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    'components/**/*.tsx',
    '!lib/firebase/**',
    '!components/providers/**',
  ],
};

module.exports = config;
