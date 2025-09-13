# Cypress Configuration Guide

Cypress is a powerful end-to-end testing framework that provides excellent developer experience with time-travel debugging, real-time reloads, and automatic waiting. This guide covers comprehensive Cypress configuration for modern web applications.

## Basic Cypress Configuration

### Installation and Setup
```bash
# Install Cypress
npm install -D cypress

# Open Cypress for the first time
npx cypress open

# Run Cypress in headless mode
npx cypress run
```

### Basic Configuration (cypress.config.js)
```javascript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL for tests
    baseUrl: 'http://localhost:3000',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Test files
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    
    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    
    // Screenshots and videos
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    video: true,
    videosFolder: 'cypress/videos',
    videoCompression: 32,
    
    // Test isolation
    testIsolation: true,
    
    // Setup node events
    setupNodeEvents(on, config) {
      // implement node event listeners here
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  },
  
  // Global configuration
  env: {
    apiUrl: 'http://localhost:3001/api',
    coverage: false
  },
  
  // Browser configuration
  chromeWebSecurity: false,
  blockHosts: ['www.google-analytics.com'],
  
  // File downloads
  downloadsFolder: 'cypress/downloads',
  
  // Retry configuration
  retries: {
    runMode: 2,
    openMode: 0
  }
});
```

## TypeScript Configuration

### TypeScript Setup
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    
    setupNodeEvents(on, config) {
      // TypeScript preprocessing
      on('file:preprocessor', require('@cypress/webpack-preprocessor')({
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.js']
          },
          module: {
            rules: [
              {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: [
                  {
                    loader: 'ts-loader'
                  }
                ]
              }
            ]
          }
        }
      }));
      
      // Code coverage
      require('@cypress/code-coverage/task')(on, config);
      
      return config;
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: {
        module: {
          rules: [
            {
              test: /\.tsx?$/,
              loader: 'ts-loader',
              options: {
                transpileOnly: true
              }
            }
          ]
        },
        resolve: {
          extensions: ['.ts', '.tsx', '.js', '.jsx']
        }
      }
    },
    supportFile: 'cypress/support/component.ts'
  },
  
  env: {
    coverage: true,
    codeCoverage: {
      exclude: 'cypress/**/*.*'
    }
  }
});
```

### TypeScript Support Files
```typescript
// cypress/support/e2e.ts
import './commands';
import '@cypress/code-coverage/support';

// Declare global namespace for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginByAPI(username: string, password: string): Chainable<void>;
      createTask(task: {
        title: string;
        description?: string;
        priority?: 'low' | 'medium' | 'high';
      }): Chainable<void>;
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      waitForSpinner(): Chainable<void>;
    }
  }
}
```

```typescript
// cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('loginByAPI', (username: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      username,
      password
    }
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token);
  });
});

Cypress.Commands.add('createTask', (task) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/tasks`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('authToken')}`
    },
    body: task
  });
});

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('waitForSpinner', () => {
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});
```

## Framework-Specific Configuration

### React Configuration
```typescript
// cypress.config.ts for React
import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html'
  },
  
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // React-specific plugins
      on('task', {
        resetDb: () => {
          // Reset database for React app
          return null;
        },
        seedDb: (data) => {
          // Seed database with test data
          return null;
        }
      });
    }
  }
});
```

### Vue Configuration
```javascript
// cypress.config.js for Vue
import { defineConfig } from 'cypress';

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite'
    },
    specPattern: 'src/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/component.js'
  },
  
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Vue-specific setup
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        return launchOptions;
      });
    }
  }
});
```

### Angular Configuration
```typescript
// cypress.config.ts for Angular
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    
    setupNodeEvents(on, config) {
      // Angular-specific setup
      on('task', {
        'db:seed': () => {
          // Seed Angular backend
          return null;
        },
        'ng:serve': () => {
          // Start Angular dev server
          return null;
        }
      });
    }
  },
  
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack'
    },
    specPattern: 'src/**/*.cy.ts'
  }
});
```

## Advanced Configuration

### Multi-Environment Configuration
```typescript
// cypress.config.ts with multiple environments
import { defineConfig } from 'cypress';

const environments = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:3001/api',
    dbUrl: 'mongodb://localhost:27017/test'
  },
  staging: {
    baseUrl: 'https://staging.example.com',
    apiUrl: 'https://api-staging.example.com',
    dbUrl: 'mongodb://staging-db:27017/app'
  },
  production: {
    baseUrl: 'https://app.example.com',
    apiUrl: 'https://api.example.com',
    dbUrl: 'mongodb://prod-db:27017/app'
  }
};

const currentEnv = process.env.CYPRESS_ENV || 'local';
const envConfig = environments[currentEnv];

export default defineConfig({
  e2e: {
    baseUrl: envConfig.baseUrl,
    
    env: {
      ...envConfig,
      environment: currentEnv
    },
    
    // Environment-specific settings
    video: currentEnv === 'local',
    screenshotOnRunFailure: true,
    
    retries: {
      runMode: currentEnv === 'production' ? 3 : 1,
      openMode: 0
    },
    
    setupNodeEvents(on, config) {
      // Environment-specific plugins
      if (currentEnv === 'local') {
        // Local development plugins
        on('task', {
          resetLocalDb: () => {
            // Reset local database
            return null;
          }
        });
      }
      
      // Code coverage for all environments except production
      if (currentEnv !== 'production') {
        require('@cypress/code-coverage/task')(on, config);
      }
      
      return config;
    }
  }
});
```

### Performance Testing Configuration
```typescript
// cypress.config.performance.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/performance/**/*.cy.ts',
    
    // Performance-specific settings
    video: false,
    screenshotOnRunFailure: false,
    
    setupNodeEvents(on, config) {
      // Performance monitoring
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push(
            '--enable-precise-memory-info',
            '--enable-memory-info',
            '--no-sandbox',
            '--disable-web-security'
          );
        }
        return launchOptions;
      });
      
      // Performance tasks
      on('task', {
        'performance:start': () => {
          console.log('Starting performance monitoring');
          return null;
        },
        'performance:end': (results) => {
          console.log('Performance results:', results);
          return null;
        }
      });
    }
  }
});
```

## Plugin Configuration

### Code Coverage Plugin
```typescript
// cypress.config.ts with code coverage
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      
      // Code coverage configuration
      on('task', {
        'coverage:report': () => {
          // Generate coverage report
          return null;
        }
      });
      
      return config;
    }
  },
  
  env: {
    codeCoverage: {
      url: '/api/__coverage__',
      exclude: [
        'cypress/**/*.*',
        'src/**/*.cy.{js,ts,jsx,tsx}',
        'src/**/*.test.{js,ts,jsx,tsx}',
        'src/**/*.stories.{js,ts,jsx,tsx}'
      ]
    }
  }
});
```

### Database Plugin
```typescript
// cypress.config.ts with database plugin
import { defineConfig } from 'cypress';
import { Pool } from 'pg';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Database connection
      const pool = new Pool({
        connectionString: config.env.dbUrl
      });
      
      // Database tasks
      on('task', {
        'db:seed': async (fixture) => {
          const client = await pool.connect();
          try {
            // Seed database with fixture data
            await client.query('DELETE FROM users');
            await client.query('DELETE FROM tasks');
            
            if (fixture.users) {
              for (const user of fixture.users) {
                await client.query(
                  'INSERT INTO users (email, name, password) VALUES ($1, $2, $3)',
                  [user.email, user.name, user.password]
                );
              }
            }
            
            if (fixture.tasks) {
              for (const task of fixture.tasks) {
                await client.query(
                  'INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3)',
                  [task.title, task.description, task.userId]
                );
              }
            }
            
            return null;
          } finally {
            client.release();
          }
        },
        
        'db:reset': async () => {
          const client = await pool.connect();
          try {
            await client.query('TRUNCATE TABLE users, tasks RESTART IDENTITY CASCADE');
            return null;
          } finally {
            client.release();
          }
        },
        
        'db:query': async (query) => {
          const client = await pool.connect();
          try {
            const result = await client.query(query);
            return result.rows;
          } finally {
            client.release();
          }
        }
      });
    }
  }
});
```

### Custom Plugin Development
```typescript
// cypress/plugins/custom-plugin.ts
export function customPlugin(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  // File operations
  on('task', {
    'file:read': (filePath: string) => {
      const fs = require('fs');
      return fs.readFileSync(filePath, 'utf8');
    },
    
    'file:write': ({ filePath, content }: { filePath: string; content: string }) => {
      const fs = require('fs');
      fs.writeFileSync(filePath, content);
      return null;
    },
    
    'file:delete': (filePath: string) => {
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return null;
    }
  });
  
  // API mocking
  on('task', {
    'mock:setup': (config: any) => {
      // Setup API mocks
      return null;
    },
    
    'mock:teardown': () => {
      // Cleanup API mocks
      return null;
    }
  });
  
  // Custom assertions
  on('task', {
    'assert:accessibility': (options: any) => {
      // Run accessibility checks
      return { violations: [], passes: [] };
    }
  });
  
  return config;
}
```

## Browser Configuration

### Multi-Browser Support
```typescript
// cypress.config.ts for multiple browsers
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Browser-specific configurations
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push(
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-web-security',
            '--allow-running-insecure-content'
          );
          
          // Memory optimization for Chrome
          launchOptions.args.push('--max_old_space_size=4096');
        }
        
        if (browser.name === 'firefox') {
          launchOptions.preferences['media.navigator.streams.fake'] = true;
          launchOptions.preferences['media.navigator.permission.disabled'] = true;
        }
        
        if (browser.name === 'edge') {
          launchOptions.args.push('--disable-web-security');
        }
        
        return launchOptions;
      });
    }
  }
});
```

### Responsive Testing Configuration
```typescript
// cypress.config.ts for responsive testing
import { defineConfig } from 'cypress';

const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 }
};

export default defineConfig({
  e2e: {
    viewportWidth: viewports.desktop.width,
    viewportHeight: viewports.desktop.height,
    
    env: {
      viewports
    },
    
    setupNodeEvents(on, config) {
      // Responsive testing tasks
      on('task', {
        'responsive:test': (viewport: keyof typeof viewports) => {
          console.log(`Testing ${viewport} viewport`);
          return { viewport: viewports[viewport] };
        }
      });
    }
  }
});
```

## API Testing Configuration

### API Interceptor Configuration
```typescript
// cypress.config.ts for API testing
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // API testing setup
      on('task', {
        'api:mock': (routes: any[]) => {
          // Setup API mocks
          routes.forEach(route => {
            console.log(`Mocking ${route.method} ${route.url}`);
          });
          return null;
        },
        
        'api:record': (config: any) => {
          // Record API interactions
          return null;
        },
        
        'api:replay': (recording: any) => {
          // Replay recorded interactions
          return null;
        }
      });
    }
  },
  
  env: {
    apiMocking: true,
    apiRecording: false
  }
});
```

### Network Testing Configuration
```typescript
// cypress.config.ts for network testing
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Network simulation
      on('task', {
        'network:slow': () => {
          // Simulate slow network
          return null;
        },
        
        'network:offline': () => {
          // Simulate offline
          return null;
        },
        
        'network:restore': () => {
          // Restore normal network
          return null;
        }
      });
    }
  }
});
```

## CI/CD Configuration

### GitHub Actions Configuration
```yaml
# .github/workflows/cypress.yml
name: Cypress Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v6
        with:
          browser: ${{ matrix.browser }}
          record: true
          parallel: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-screenshots-${{ matrix.browser }}
          path: cypress/screenshots
      
      - name: Upload videos
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: cypress-videos-${{ matrix.browser }}
          path: cypress/videos
```

### Docker Configuration
```dockerfile
# Dockerfile for Cypress
FROM cypress/browsers:node18.12.0-chrome107-ff107

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Run Cypress tests
CMD ["npm", "run", "cypress:run"]
```

### Parallel Testing Configuration
```typescript
// cypress.config.ts for parallel testing
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Parallel execution settings
    projectId: 'your-project-id',
    
    setupNodeEvents(on, config) {
      // Parallel testing setup
      if (config.isTextTerminal) {
        // CI environment
        config.numTestsKeptInMemory = 0;
        config.video = true;
      } else {
        // Local environment
        config.video = false;
      }
      
      // Test distribution
      on('task', {
        'parallel:distribute': (specs: string[]) => {
          const workers = parseInt(process.env.CYPRESS_WORKERS || '1');
          const currentWorker = parseInt(process.env.CYPRESS_WORKER_ID || '0');
          
          // Distribute specs across workers
          const workerSpecs = specs.filter((_, index) => index % workers === currentWorker);
          
          return workerSpecs;
        }
      });
    }
  }
});
```

## Test Data Management

### Fixture Configuration
```typescript
// cypress.config.ts with fixture management
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    fixturesFolder: 'cypress/fixtures',
    
    setupNodeEvents(on, config) {
      // Fixture management
      on('task', {
        'fixture:generate': (type: string) => {
          const fixtures = {
            user: {
              email: 'test@example.com',
              name: 'Test User',
              password: 'password123'
            },
            task: {
              title: 'Test Task',
              description: 'Test Description',
              priority: 'medium'
            }
          };
          
          return fixtures[type] || null;
        },
        
        'fixture:load': (name: string) => {
          const fs = require('fs');
          const path = require('path');
          
          try {
            const fixturePath = path.join(config.fixturesFolder, `${name}.json`);
            const content = fs.readFileSync(fixturePath, 'utf8');
            return JSON.parse(content);
          } catch (error) {
            return null;
          }
        }
      });
    }
  }
});
```

### Dynamic Test Data
```typescript
// cypress/support/data-factory.ts
export class DataFactory {
  static generateUser(overrides: Partial<User> = {}): User {
    return {
      id: Math.random().toString(36).substring(7),
      email: `test.${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }
  
  static generateTask(overrides: Partial<Task> = {}): Task {
    return {
      id: Math.random().toString(36).substring(7),
      title: `Task ${Date.now()}`,
      description: 'Generated test task',
      priority: 'medium',
      completed: false,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }
  
  static generateUsers(count: number): User[] {
    return Array.from({ length: count }, () => this.generateUser());
  }
  
  static generateTasks(count: number, userId?: string): Task[] {
    return Array.from({ length: count }, () => 
      this.generateTask(userId ? { userId } : {})
    );
  }
}
```

## Related Resources
- [Jest Configuration Guide](./jest-config.md)
- [Vitest Configuration Guide](./vitest-config.md)
- [Playwright Configuration Guide](./playwright-config.md)
- [E2E Testing Patterns](../patterns/e2e-testing.md)
- [React Testing Documentation](../frameworks/react/)
- [Vue Testing Documentation](../frameworks/vue/)