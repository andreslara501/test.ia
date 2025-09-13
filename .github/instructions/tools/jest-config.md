# Jest Configuration Guide

Jest is a comprehensive JavaScript testing framework that provides everything needed for testing modern applications. This guide covers Jest configuration patterns for different project types and testing scenarios.

## Basic Jest Configuration

### Package.json Configuration
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --watchAll=false --passWithNoTests"
  },
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"],
    "moduleNameMapping": {
      "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/src/__mocks__/fileMock.js"
    }
  }
}
```

### Standalone Jest Configuration (jest.config.js)
```javascript
module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  setupFiles: ['<rootDir>/src/polyfills.js'],
  
  // Module name mapping for static assets
  moduleNameMapping: {
    // CSS modules
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Static assets
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
    
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/setupTests.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/test-utils/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'jest-junit.xml'
    }]
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/src/test-utils/globalSetup.js',
  globalTeardown: '<rootDir>/src/test-utils/globalTeardown.js',
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: false,
  
  // Verbose output
  verbose: true,
  
  // Notify mode
  notify: true,
  notifyMode: 'failure-change'
};
```

## TypeScript Configuration

### Jest with TypeScript
```javascript
// jest.config.js for TypeScript projects
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // TypeScript setup
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Module name mapping
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.ts',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform configuration for TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // TypeScript files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ],
  
  // Coverage for TypeScript
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}'
  ],
  
  // ts-jest configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};
```

### TypeScript + ESM Configuration
```javascript
// jest.config.js for TypeScript + ESM
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx'
      }
    }]
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(some-esm-package|another-esm-package)/)'
  ]
};
```

## React Configuration

### React Testing Library Setup
```javascript
// src/setupTests.js
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    error.stack = null;
    return error;
  }
});

// Mock console methods in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Global test utilities
global.flushPromises = () => new Promise(setImmediate);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset fetch mock
  fetch.mockClear();
});
```

### React with Next.js Configuration
```javascript
// jest.config.js for Next.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './'
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1'
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!jest.config.js'
  ]
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
```

## Node.js Configuration

### Node.js API Testing
```javascript
// jest.config.js for Node.js projects
module.exports = {
  testEnvironment: 'node',
  
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/src/**/__tests__/**/*.js'
  ],
  
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // For testing with databases
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  
  // Environment variables for testing
  setupFiles: ['<rootDir>/tests/env.js'],
  
  // Transform ES modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Handle ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(es-module-package|another-es-module)/)'
  ]
};
```

### Database Testing Setup
```javascript
// tests/setup.js for database testing
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Cleanup between tests
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

// Test utilities
global.testUtils = {
  createUser: async (userData = {}) => {
    const User = require('../src/models/User');
    return User.create({
      email: 'test@example.com',
      name: 'Test User',
      ...userData
    });
  },
  
  createAuthHeaders: (token) => ({
    Authorization: `Bearer ${token}`
  })
};
```

## Mock Configuration

### File Mocks
```javascript
// src/__mocks__/fileMock.js
module.exports = 'test-file-stub';
```

### Style Mocks
```javascript
// src/__mocks__/styleMock.js
module.exports = {};
```

### Module Mocks
```javascript
// src/__mocks__/axios.js
export default {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  }))
};
```

## Advanced Configuration

### Multi-Environment Configuration
```javascript
// jest.config.js with multiple configurations
const baseConfig = {
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$'
  ]
};

module.exports = {
  projects: [
    {
      ...baseConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom'
    },
    {
      ...baseConfig,
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.{test,spec}.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/src/setupTests.js',
        '<rootDir>/src/setupIntegrationTests.js'
      ]
    },
    {
      ...baseConfig,
      displayName: 'api',
      testMatch: ['<rootDir>/tests/api/**/*.{test,spec}.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/api/setup.js']
    }
  ]
};
```

### Performance Testing Configuration
```javascript
// jest.config.performance.js
module.exports = {
  displayName: 'Performance Tests',
  testMatch: ['<rootDir>/tests/performance/**/*.test.js'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/performance/setup.js'],
  testTimeout: 60000, // 1 minute for performance tests
  maxWorkers: 1, // Run performance tests sequentially
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Performance Test Report',
      outputPath: 'reports/performance-tests.html'
    }]
  ]
};
```

### Coverage Configuration
```javascript
// jest.config.coverage.js
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,tsx}',
    '!src/setupTests.{js,ts}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/test-utils/**'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'json-summary',
    'cobertura'
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Per-directory thresholds
    './src/components/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/utils/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Coverage providers
  coverageProvider: 'v8', // or 'babel'
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/',
    '/.next/',
    '/public/'
  ]
};
```

## Custom Transformers

### CSS Transform
```javascript
// config/jest/cssTransform.js
module.exports = {
  process() {
    return 'module.exports = {};';
  },
  getCacheKey() {
    return 'cssTransform';
  }
};
```

### File Transform
```javascript
// config/jest/fileTransform.js
const path = require('path');

module.exports = {
  process(src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));
    
    if (filename.match(/\.svg$/)) {
      // For SVG files, return a React component
      const pascalCaseFilename = path
        .basename(filename, '.svg')
        .replace(/(\w)(\w*)/g, (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
      
      return `
        const React = require('react');
        module.exports = {
          __esModule: true,
          default: ${assetFilename},
          ReactComponent: React.forwardRef(function ${pascalCaseFilename}(props, ref) {
            return React.createElement('svg', Object.assign({}, props, {ref}));
          })
        };
      `;
    }
    
    return `module.exports = ${assetFilename};`;
  }
};
```

### Custom Babel Transform
```javascript
// config/jest/babelTransform.js
const babelJest = require('babel-jest').default;

module.exports = babelJest.createTransformer({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime'
  ],
  babelrc: false,
  configFile: false
});
```

## Watch Mode Configuration

### Custom Watch Plugins
```javascript
// scripts/jest-watch-plugin-run-coverage.js
class RunCoveragePlugin {
  constructor({ stdin, stdout, config, globalConfig }) {
    this.stdin = stdin;
    this.stdout = stdout;
    this.config = config;
    this.globalConfig = globalConfig;
  }

  apply(jestHooks) {
    jestHooks.shouldRunTestSuite(() => true);
  }

  getUsageInfo() {
    return {
      key: 'c',
      prompt: 'run coverage'
    };
  }

  run() {
    return new Promise((resolve) => {
      const spawn = require('child_process').spawn;
      const coverage = spawn('npm', ['run', 'test:coverage'], {
        stdio: 'inherit'
      });
      
      coverage.on('close', (code) => {
        resolve();
      });
    });
  }
}

module.exports = RunCoveragePlugin;
```

### Watch Configuration
```javascript
// jest.config.js with watch configuration
module.exports = {
  // ... other config
  
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    '<rootDir>/scripts/jest-watch-plugin-run-coverage.js'
  ],
  
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ],
  
  // Watch mode options
  watchman: true,
  notify: true,
  notifyMode: 'failure-change'
};
```

## CI/CD Configuration

### GitHub Actions Jest Configuration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
        env:
          CI: true
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true
```

### Jest CI Configuration
```javascript
// jest.config.ci.js
module.exports = {
  ...require('./jest.config.js'),
  
  // CI-specific overrides
  watchAll: false,
  coverage: true,
  verbose: true,
  ci: true,
  
  // Reduce memory usage in CI
  maxWorkers: 2,
  
  // Fail fast in CI
  bail: 1,
  
  // CI reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'jest-junit.xml',
      ancestorSeparator: ' › ',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }],
    ['jest-html-reporter', {
      pageTitle: 'Test Report',
      outputPath: './test-results/test-report.html',
      includeFailureMsg: true
    }]
  ]
};
```

## Related Resources
- [Vitest Configuration Guide](./vitest-config.md)
- [Playwright Configuration Guide](./playwright-config.md)
- [Cypress Configuration Guide](./cypress-config.md)
- [React Testing Documentation](../frameworks/react/)
- [Node.js Testing Patterns](../patterns/unit-testing.md)