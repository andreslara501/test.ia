# Vitest Configuration Guide

Vitest is a fast unit test framework powered by Vite. It provides native ESM support, TypeScript integration, and excellent developer experience with features like watch mode and coverage reporting.

## Basic Vitest Configuration

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:ci": "vitest run --coverage --reporter=verbose"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "jsdom": "^22.0.0",
    "happy-dom": "^10.0.0"
  }
}
```

### Basic Configuration (vitest.config.js)
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom', // or 'happy-dom', 'node'
    
    // Global test setup
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    
    // Test file patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Watch mode configuration
    watch: true,
    watchExclude: ['**/node_modules/**', '**/dist/**'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // or 'c8', 'istanbul'
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}'
      ]
    },
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter configuration
    reporter: ['verbose'],
    
    // Threads
    threads: true,
    minThreads: 1,
    maxThreads: 4,
    
    // Silent console logs
    silent: false,
    
    // Update snapshots
    update: false
  }
});
```

## TypeScript Configuration

### Vitest with TypeScript
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    
    // TypeScript configuration
    typecheck: {
      checker: 'tsc',
      include: ['**/*.{test,spec}-d.ts']
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks')
    }
  }
});
```

### TypeScript Setup File
```typescript
// src/setupTests.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Mock console methods
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn()
};

// Mock DOM APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
vi.stubGlobal('localStorage', localStorageMock);
vi.stubGlobal('sessionStorage', localStorageMock);

// Mock fetch
global.fetch = vi.fn();

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
  
  // Reset storage mocks
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset fetch mock
  fetch.mockClear();
});
```

## React Configuration

### React with Vite and Vitest
```typescript
// vitest.config.ts for React projects
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    
    // CSS handling
    css: true,
    
    // Mock handling
    deps: {
      external: [/node_modules/]
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### React Testing Library Setup
```typescript
// src/setupTests.ts for React
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect
expect.extend(matchers);

// React Testing Library configuration
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid'
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global test utilities
declare global {
  const flushPromises: () => Promise<void>;
}

globalThis.flushPromises = () => new Promise(setImmediate);
```

## Vue Configuration

### Vue 3 with Vitest
```typescript
// vitest.config.ts for Vue 3
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts']
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Vue Testing Setup
```typescript
// src/setupTests.ts for Vue
import { expect, afterEach, vi } from 'vitest';
import { config } from '@vue/test-utils';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect
expect.extend(matchers);

// Vue Test Utils global configuration
config.global.plugins = [];
config.global.components = {};
config.global.directives = {};

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn()
  }),
  useRoute: () => ({
    params: {},
    query: {},
    path: '/',
    name: 'test-route'
  })
}));

// Mock Pinia
vi.mock('pinia', () => ({
  createPinia: vi.fn(),
  defineStore: vi.fn(),
  setActivePinia: vi.fn(),
  getActivePinia: vi.fn()
}));

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
```

## Node.js Configuration

### Node.js API Testing
```typescript
// vitest.config.ts for Node.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    
    // Test patterns for Node.js
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'tests/**/*.{test,spec}.{js,ts}'
    ],
    
    // Coverage for Node.js
    coverage: {
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.test.{js,ts}', 'src/index.{js,ts}']
    },
    
    // Longer timeout for integration tests
    testTimeout: 30000
  }
});
```

### Database Testing Setup
```typescript
// tests/setup.ts for database testing
import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  await mongoose.connect(uri);
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

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret');
vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test');

// Global test utilities
declare global {
  const testUtils: {
    createUser: (userData?: any) => Promise<any>;
    createAuthHeaders: (token: string) => { Authorization: string };
  };
}

globalThis.testUtils = {
  createUser: async (userData = {}) => {
    const { User } = await import('../src/models/User');
    return User.create({
      email: 'test@example.com',
      name: 'Test User',
      ...userData
    });
  },
  
  createAuthHeaders: (token: string) => ({
    Authorization: `Bearer ${token}`
  })
};
```

## Coverage Configuration

### Advanced Coverage Setup
```typescript
// vitest.config.ts with advanced coverage
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      
      // Reporters
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      
      // Coverage directory
      reportsDirectory: './coverage',
      
      // Include/exclude patterns
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'node_modules/',
        'src/setupTests.{js,ts}',
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'src/**/*.stories.{js,ts,jsx,tsx}',
        'src/**/*.d.ts',
        'src/main.{js,ts,jsx,tsx}',
        'src/index.{js,ts,jsx,tsx}',
        'dist/',
        'coverage/',
        '**/*.config.{js,ts}',
        '**/test-utils/**'
      ],
      
      // Thresholds
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80
        },
        'src/components/': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90
        },
        'src/utils/': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95
        }
      },
      
      // Coverage provider options
      providerOptions: {
        v8: {
          exclude: ['**/node_modules/**']
        }
      },
      
      // Clean coverage on rerun
      clean: true,
      
      // All files coverage
      all: true,
      
      // Skip coverage for files with no tests
      skipFull: false
    }
  }
});
```

### Coverage Reporters Configuration
```typescript
// vitest.config.ts with custom reporters
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Custom reporters
    reporter: [
      'verbose',
      'json',
      'html',
      ['junit', { outputFile: './test-results/junit.xml' }]
    ],
    
    // Coverage configuration
    coverage: {
      reporter: [
        ['text', { file: 'coverage.txt' }],
        ['json', { file: 'coverage.json' }],
        ['html', { subdir: 'html' }],
        ['lcov', { file: 'lcov.info' }],
        ['json-summary', { file: 'coverage-summary.json' }],
        ['cobertura', { file: 'cobertura-coverage.xml' }]
      ]
    }
  }
});
```

## Workspace Configuration

### Monorepo Vitest Configuration
```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Unit tests
  {
    test: {
      name: 'unit',
      include: ['packages/*/src/**/*.{test,spec}.{js,ts}'],
      environment: 'jsdom'
    }
  },
  
  // Integration tests
  {
    test: {
      name: 'integration',
      include: ['packages/*/tests/integration/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      testTimeout: 30000
    }
  },
  
  // E2E tests
  {
    test: {
      name: 'e2e',
      include: ['tests/e2e/**/*.{test,spec}.{js,ts}'],
      environment: 'node',
      testTimeout: 60000
    }
  }
]);
```

### Package-specific Configuration
```typescript
// packages/core/vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts']
  },
  
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src')
    }
  }
});
```

## Mock Configuration

### Vitest Mocks Setup
```typescript
// src/setupTests.ts with mocks
import { vi } from 'vitest';

// Mock modules
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      get: vi.fn(() => Promise.resolve({ data: {} })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      put: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
      patch: vi.fn(() => Promise.resolve({ data: {} })),
      create: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ data: {} })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() }
        }
      }))
    }
  };
});

// Auto-mock external modules
vi.mock('lodash', () => ({
  debounce: vi.fn((fn) => fn),
  throttle: vi.fn((fn) => fn),
  cloneDeep: vi.fn((obj) => JSON.parse(JSON.stringify(obj)))
}));

// Factory mocks
vi.mock('./api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Partial mocks
vi.mock('./utils/helpers', async () => {
  const actual = await vi.importActual<typeof import('./utils/helpers')>('./utils/helpers');
  return {
    ...actual,
    formatDate: vi.fn(() => '2023-01-01'),
    generateId: vi.fn(() => 'test-id-123')
  };
});
```

### File System Mocks
```typescript
// vitest.config.ts with file system mocks
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Define inline mock map
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Server configuration for mocking
    server: {
      deps: {
        inline: ['@testing-library/user-event']
      }
    }
  },
  
  define: {
    // Global constants for tests
    __TEST__: true,
    __VERSION__: JSON.stringify('test')
  }
});
```

## Watch Mode Configuration

### Advanced Watch Configuration
```typescript
// vitest.config.ts with watch configuration
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Watch configuration
    watch: true,
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.git/**',
      '**/build/**'
    ],
    
    // File change handling
    watchIgnore: [
      '**/coverage/**',
      '**/node_modules/**'
    ],
    
    // Pool options for watch mode
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: false
      }
    }
  }
});
```

## Performance Configuration

### Optimized Configuration
```typescript
// vitest.config.ts optimized for performance
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Thread configuration
    threads: true,
    minThreads: 1,
    maxThreads: Math.max(1, require('os').cpus().length - 1),
    
    // Pool configuration
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: false, // Faster but less isolated
        singleThread: false
      }
    },
    
    // Dependency optimization
    deps: {
      optimizer: {
        web: {
          enabled: true
        },
        ssr: {
          enabled: true
        }
      }
    },
    
    // Reporter optimization
    reporter: process.env.CI ? ['verbose'] : ['default'],
    
    // Snapshot configuration
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false
    }
  },
  
  // Vite optimization
  esbuild: {
    target: 'node14'
  }
});
```

## CI/CD Configuration

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### CI Specific Configuration
```typescript
// vitest.config.ci.ts
import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    
    // CI specific settings
    watch: false,
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml'
    },
    
    // Coverage for CI
    coverage: {
      ...baseConfig.test?.coverage,
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80
        }
      }
    },
    
    // Performance settings for CI
    maxThreads: 2,
    minThreads: 1,
    
    // Fail fast
    bail: 1
  }
});
```

### Docker Configuration
```dockerfile
# Dockerfile for testing
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Run tests
CMD ["npm", "run", "test:ci"]
```

## Related Resources
- [Jest Configuration Guide](./jest-config.md)
- [Playwright Configuration Guide](./playwright-config.md)
- [Cypress Configuration Guide](./cypress-config.md)
- [Vue Testing Documentation](../frameworks/vue/)
- [React Testing Documentation](../frameworks/react/)