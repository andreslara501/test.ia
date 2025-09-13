# Playwright Configuration Guide

Playwright is a framework for end-to-end testing across all modern web browsers. It provides reliable testing capabilities with auto-wait features, powerful selectors, and cross-browser support.

## Basic Playwright Configuration

### Installation and Setup
```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Install specific browsers
npx playwright install chromium firefox webkit
```

### Basic Configuration (playwright.config.js)
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: 'html',
  
  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshots on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Timeout for each action
    actionTimeout: 10000,
    
    // Timeout for navigation
    navigationTimeout: 30000
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

## TypeScript Configuration

### TypeScript Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Global authentication
    storageState: 'auth.json'
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },
    
    // Authenticated tests
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json'
      },
      dependencies: ['setup']
    },
    
    // Mobile tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    
    // Tablet tests
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],

  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe'
  }
});
```

### TypeScript Global Setup
```typescript
// playwright.config.ts with global setup
import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup'),
  globalTeardown: require.resolve('./tests/global-teardown'),
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000'
  },
  
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup'
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    }
  ]
});
```

## Advanced Configuration

### Multi-Environment Configuration
```typescript
// playwright.config.ts for multiple environments
import { defineConfig, devices } from '@playwright/test';

const environments = {
  local: 'http://localhost:3000',
  staging: 'https://staging.example.com',
  production: 'https://production.example.com'
};

const currentEnv = process.env.TEST_ENV || 'local';
const baseURL = environments[currentEnv];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: currentEnv === 'production' ? 3 : 1,
  workers: currentEnv === 'local' ? 4 : 1,
  
  // Environment-specific reporter
  reporter: currentEnv === 'local' 
    ? [['html'], ['list']]
    : [['junit', { outputFile: 'results.xml' }], ['json', { outputFile: 'results.json' }]],
  
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: currentEnv === 'production' ? 'off' : 'retain-on-failure',
    
    // Environment-specific timeouts
    actionTimeout: currentEnv === 'production' ? 30000 : 10000,
    navigationTimeout: currentEnv === 'production' ? 60000 : 30000
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] }
    },
    
    // Only run mobile tests in staging/production
    ...(currentEnv !== 'local' ? [
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] }
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] }
      }
    ] : []),
    
    // Only run cross-browser tests in production
    ...(currentEnv === 'production' ? [
      {
        name: 'Desktop Firefox',
        use: { ...devices['Desktop Firefox'] }
      },
      {
        name: 'Desktop Safari',
        use: { ...devices['Desktop Safari'] }
      }
    ] : [])
  ],

  // Environment-specific web server
  webServer: currentEnv === 'local' ? {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true
  } : undefined
});
```

### Performance Testing Configuration
```typescript
// playwright.config.performance.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  timeout: 120000, // 2 minutes for performance tests
  
  use: {
    // Disable visual features for performance testing
    screenshot: 'off',
    video: 'off',
    trace: 'off',
    
    // Performance-specific settings
    actionTimeout: 30000,
    navigationTimeout: 60000
  },
  
  projects: [
    {
      name: 'performance-chrome',
      use: {
        ...devices['Desktop Chrome'],
        // Enable performance metrics
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-memory-info',
            '--no-sandbox',
            '--disable-web-security'
          ]
        }
      }
    }
  ],
  
  reporter: [
    ['json', { outputFile: 'performance-results.json' }],
    ['html', { outputFolder: 'performance-report' }]
  ]
});
```

## Test Configuration Patterns

### Page Object Model Setup
```typescript
// tests/setup/page-objects.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TasksPage } from '../pages/TasksPage';

type Pages = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  tasksPage: TasksPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  
  tasksPage: async ({ page }, use) => {
    await use(new TasksPage(page));
  }
});

export { expect } from '@playwright/test';
```

### Authentication Setup
```typescript
// tests/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

### Global Setup and Teardown
```typescript
// tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Start test database
  console.log('Starting test database...');
  
  // Seed test data
  console.log('Seeding test data...');
  
  // Warm up the application
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(config.projects[0].use.baseURL!);
  await page.close();
  await browser.close();
  
  console.log('Global setup completed');
}

export default globalSetup;
```

```typescript
// tests/global-teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  // Clean up test data
  console.log('Cleaning up test data...');
  
  // Stop test database
  console.log('Stopping test database...');
  
  console.log('Global teardown completed');
}

export default globalTeardown;
```

## Browser Configuration

### Custom Browser Launch Options
```typescript
// playwright.config.ts with custom browser options
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--no-sandbox',
            '--disable-dev-shm-usage'
          ],
          ignoreDefaultArgs: ['--disable-extensions']
        },
        contextOptions: {
          viewport: { width: 1920, height: 1080 },
          ignoreHTTPSErrors: true,
          permissions: ['notifications', 'geolocation'],
          geolocation: { latitude: 37.7749, longitude: -122.4194 },
          locale: 'en-US',
          timezoneId: 'America/New_York'
        }
      }
    },
    
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true
          }
        }
      }
    },
    
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          // WebKit-specific options
        }
      }
    }
  ]
});
```

### Mobile Device Configuration
```typescript
// playwright.config.ts for mobile testing
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Mobile devices
    {
      name: 'iphone-13',
      use: {
        ...devices['iPhone 13'],
        contextOptions: {
          hasTouch: true,
          isMobile: true,
          viewport: { width: 390, height: 844 }
        }
      }
    },
    
    {
      name: 'pixel-5',
      use: {
        ...devices['Pixel 5'],
        contextOptions: {
          hasTouch: true,
          isMobile: true,
          viewport: { width: 393, height: 851 }
        }
      }
    },
    
    // Tablets
    {
      name: 'ipad-pro',
      use: {
        ...devices['iPad Pro'],
        contextOptions: {
          hasTouch: true,
          viewport: { width: 1024, height: 1366 }
        }
      }
    },
    
    // Custom device
    {
      name: 'custom-mobile',
      use: {
        browserName: 'chromium',
        contextOptions: {
          viewport: { width: 414, height: 896 },
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
        }
      }
    }
  ]
});
```

## Test Organization Configuration

### Test Filtering and Tagging
```typescript
// playwright.config.ts with test filtering
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Test filtering by grep
  grep: process.env.TEST_GREP ? new RegExp(process.env.TEST_GREP) : undefined,
  grepInvert: process.env.TEST_GREP_INVERT ? new RegExp(process.env.TEST_GREP_INVERT) : undefined,
  
  projects: [
    // Smoke tests
    {
      name: 'smoke',
      testMatch: /.*\.smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] }
    },
    
    // Integration tests
    {
      name: 'integration',
      testMatch: /.*\.integration\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      timeout: 60000
    },
    
    // E2E tests
    {
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      timeout: 120000,
      retries: 2
    },
    
    // Visual regression tests
    {
      name: 'visual',
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        screenshot: 'only-on-failure'
      }
    }
  ]
});
```

### Parallel Test Configuration
```typescript
// playwright.config.ts for parallel execution
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Test parallelization
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  
  // Test sharding for CI
  shard: process.env.CI ? {
    current: parseInt(process.env.SHARD_INDEX || '1'),
    total: parseInt(process.env.SHARD_TOTAL || '1')
  } : undefined,
  
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/
    },
    {
      name: 'parallel-suite-1',
      testMatch: /.*suite-1.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'parallel-suite-2',
      testMatch: /.*suite-2.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
```

## Reporting Configuration

### Advanced Reporter Configuration
```typescript
// playwright.config.ts with advanced reporting
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    // Default reporter for local development
    ['list'],
    
    // HTML reporter with custom options
    ['html', {
      outputFolder: 'playwright-report',
      open: process.env.CI ? 'never' : 'on-failure'
    }],
    
    // JSON reporter
    ['json', {
      outputFile: 'test-results/results.json'
    }],
    
    // JUnit reporter for CI
    ['junit', {
      outputFile: 'test-results/junit.xml',
      includeProjectInTestName: true
    }],
    
    // GitHub Actions reporter
    process.env.GITHUB_ACTIONS ? ['github'] : null,
    
    // Custom reporter
    ['./custom-reporter.js']
  ].filter(Boolean),
  
  use: {
    // Attach screenshots to test results
    screenshot: 'only-on-failure',
    
    // Attach videos to test results
    video: 'retain-on-failure',
    
    // Attach traces to test results
    trace: 'retain-on-failure'
  }
});
```

### Custom Reporter
```typescript
// custom-reporter.ts
import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

class CustomReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    console.log(`Starting test ${test.title}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`Finished test ${test.title}: ${result.status}`);
    
    if (result.status === 'failed') {
      console.log(`Test failed: ${result.error?.message}`);
    }
  }

  onEnd(result: FullResult) {
    console.log(`Finished the run: ${result.status}`);
    
    // Custom reporting logic
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
    
    // Generate custom report
    this.generateCustomReport(summary);
  }

  private generateCustomReport(summary: any) {
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      environment: process.env.NODE_ENV || 'test'
    };
    
    fs.writeFileSync('custom-report.json', JSON.stringify(report, null, 2));
  }
}

export default CustomReporter;
```

## CI/CD Configuration

### GitHub Actions Configuration
```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    
    steps:
    - uses: actions/checkout@v4
    
    - uses: actions/setup-node@v4
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Run Playwright tests
      run: npx playwright test --shard=${{ matrix.shard }}/4
      env:
        SHARD_INDEX: ${{ matrix.shard }}
        SHARD_TOTAL: 4
    
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report-${{ matrix.shard }}
        path: playwright-report/
        retention-days: 30
    
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results-${{ matrix.shard }}
        path: test-results/
        retention-days: 30
```

### Docker Configuration
```dockerfile
# Dockerfile for Playwright tests
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests
CMD ["npx", "playwright", "test"]
```

### Docker Compose for Testing
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
    
  playwright:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    depends_on:
      - app
    environment:
      - BASE_URL=http://app:3000
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
    command: npx playwright test
```

## Environment-Specific Configuration

### Configuration Factory
```typescript
// playwright.config.factory.ts
import { defineConfig, devices } from '@playwright/test';

export function createConfig(env: 'local' | 'staging' | 'production') {
  const baseURL = {
    local: 'http://localhost:3000',
    staging: 'https://staging.example.com',
    production: 'https://prod.example.com'
  }[env];

  return defineConfig({
    testDir: './tests',
    
    use: {
      baseURL,
      screenshot: env === 'local' ? 'only-on-failure' : 'off',
      video: env === 'local' ? 'retain-on-failure' : 'off',
      trace: env === 'production' ? 'off' : 'on-first-retry'
    },
    
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] }
      },
      
      // Only run mobile tests in staging/production
      ...(env !== 'local' ? [
        {
          name: 'mobile',
          use: { ...devices['Pixel 5'] }
        }
      ] : [])
    ],
    
    retries: env === 'production' ? 3 : 1,
    workers: env === 'local' ? 4 : 1
  });
}
```

### Environment-Specific Usage
```typescript
// playwright.config.ts
import { createConfig } from './playwright.config.factory';

const env = (process.env.TEST_ENV as 'local' | 'staging' | 'production') || 'local';

export default createConfig(env);
```

## Related Resources
- [Jest Configuration Guide](./jest-config.md)
- [Vitest Configuration Guide](./vitest-config.md)
- [Cypress Configuration Guide](./cypress-config.md)
- [E2E Testing Patterns](../patterns/e2e-testing.md)
- [Performance Testing Patterns](../patterns/performance-testing.md)