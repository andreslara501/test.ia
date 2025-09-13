# Performance Testing Patterns

This guide covers comprehensive performance testing patterns for web applications. Performance testing ensures your application meets speed, stability, and scalability requirements under various load conditions.

## Performance Testing Types

### Load Testing
Testing application behavior under expected normal load conditions.

```javascript
// tests/performance/load.test.js
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    // Ramp up to 50 users over 2 minutes
    { duration: '2m', target: 50 },
    // Stay at 50 users for 5 minutes
    { duration: '5m', target: 50 },
    // Ramp down to 0 users over 1 minute
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    // 95% of requests should complete within 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate should be below 1%
    errors: ['rate<0.01'],
    // 99% of requests should complete within 1 second
    http_req_duration: ['p(99)<1000']
  }
};

export default function() {
  // Test homepage load
  const homeResponse = http.get('https://example.com');
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads within 500ms': (r) => r.timings.duration < 500
  }) || errorRate.add(1);

  sleep(1);

  // Test login flow
  const loginPayload = {
    email: 'testuser@example.com',
    password: 'TestPassword123!'
  };

  const loginResponse = http.post(
    'https://example.com/api/auth/login',
    JSON.stringify(loginPayload),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );

  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => JSON.parse(r.body).token !== undefined,
    'login completes within 200ms': (r) => r.timings.duration < 200
  });

  if (!loginSuccess) {
    errorRate.add(1);
    return;
  }

  const authToken = JSON.parse(loginResponse.body).token;

  // Test authenticated API calls
  const tasksResponse = http.get(
    'https://example.com/api/tasks',
    {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }
  );

  check(tasksResponse, {
    'tasks status is 200': (r) => r.status === 200,
    'tasks response is array': (r) => Array.isArray(JSON.parse(r.body)),
    'tasks load within 300ms': (r) => r.timings.duration < 300
  }) || errorRate.add(1);

  // Test task creation
  const newTask = {
    title: `Load test task ${__VU}-${__ITER}`,
    description: 'Created during load test',
    priority: 'medium'
  };

  const createResponse = http.post(
    'https://example.com/api/tasks',
    JSON.stringify(newTask),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  check(createResponse, {
    'task creation status is 201': (r) => r.status === 201,
    'task creation completes within 400ms': (r) => r.timings.duration < 400
  }) || errorRate.add(1);

  sleep(2);
}

export function teardown(data) {
  // Cleanup after test
  console.log('Load test completed');
  console.log(`Error rate: ${errorRate.rate * 100}%`);
}
```

### Stress Testing
Testing application behavior under extreme load conditions beyond normal capacity.

```javascript
// tests/performance/stress.test.js
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const successfulRequests = new Counter('successful_requests');

export const options = {
  stages: [
    // Gradually ramp up to extreme load
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '10m', target: 500 },
    { duration: '5m', target: 1000 }, // Stress point
    { duration: '5m', target: 500 },  // Recovery
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    // Allow higher response times during stress test
    http_req_duration: ['p(95)<2000'],
    // Monitor error rate (may be higher during stress)
    errors: ['rate<0.1'], // 10% error rate acceptable during stress
    // System should recover gracefully
    http_req_duration: ['p(50)<1000'] // Median should still be reasonable
  }
};

export default function() {
  const baseUrl = 'https://example.com';
  
  // Simulate various user behaviors under stress
  const userActions = [
    () => testHomepage(baseUrl),
    () => testLogin(baseUrl),
    () => testTaskOperations(baseUrl),
    () => testSearch(baseUrl),
    () => testReports(baseUrl)
  ];

  // Randomly select user action
  const action = userActions[Math.floor(Math.random() * userActions.length)];
  action();

  // Variable sleep to simulate real user behavior
  sleep(Math.random() * 3 + 1);
}

function testHomepage(baseUrl) {
  const response = http.get(baseUrl);
  const success = check(response, {
    'homepage accessible': (r) => r.status === 200
  });
  
  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

function testLogin(baseUrl) {
  const loginPayload = {
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    password: 'TestPassword123!'
  };

  const response = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify(loginPayload),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const success = check(response, {
    'login responds': (r) => r.status >= 200 && r.status < 500
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

function testTaskOperations(baseUrl) {
  // Simulate authenticated user operations
  const mockToken = 'mock-token-for-stress-test';
  
  const response = http.get(
    `${baseUrl}/api/tasks`,
    { headers: { 'Authorization': `Bearer ${mockToken}` } }
  );

  const success = check(response, {
    'tasks endpoint responds': (r) => r.status >= 200 && r.status < 500
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

function testSearch(baseUrl) {
  const searchTerms = ['important', 'urgent', 'project', 'bug', 'feature'];
  const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

  const response = http.get(`${baseUrl}/api/search?q=${term}`);
  
  const success = check(response, {
    'search responds': (r) => r.status >= 200 && r.status < 500
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}

function testReports(baseUrl) {
  const response = http.get(`${baseUrl}/api/reports/dashboard`);
  
  const success = check(response, {
    'reports respond': (r) => r.status >= 200 && r.status < 500
  });

  if (success) {
    successfulRequests.add(1);
  } else {
    errorRate.add(1);
  }
}
```

### Spike Testing
Testing application behavior during sudden traffic spikes.

```javascript
// tests/performance/spike.test.js
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    // Normal load
    { duration: '2m', target: 50 },
    // Sudden spike
    { duration: '30s', target: 500 },
    // Back to normal
    { duration: '2m', target: 50 },
    // Another spike
    { duration: '30s', target: 800 },
    // Recovery
    { duration: '2m', target: 50 },
    // Ramp down
    { duration: '1m', target: 0 }
  ],
  thresholds: {
    // During spikes, allow degraded performance
    http_req_duration: ['p(95)<3000'],
    // System should handle spikes without total failure
    errors: ['rate<0.2'], // 20% error rate during spikes
    // Recovery should be quick
    http_req_duration: ['p(90)<1000']
  }
};

export default function() {
  const baseUrl = 'https://example.com';
  
  // Focus on critical user paths during spike
  const criticalPaths = [
    () => testCriticalEndpoint(baseUrl),
    () => testHealthCheck(baseUrl),
    () => testUserAuthentication(baseUrl)
  ];

  const action = criticalPaths[Math.floor(Math.random() * criticalPaths.length)];
  action();

  sleep(0.5); // Shorter sleep during spike test
}

function testCriticalEndpoint(baseUrl) {
  const response = http.get(`${baseUrl}/api/health`);
  
  check(response, {
    'critical endpoint available': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 2000
  }) || errorRate.add(1);
}

function testHealthCheck(baseUrl) {
  const response = http.get(`${baseUrl}/health`);
  
  check(response, {
    'health check passes': (r) => r.status === 200
  }) || errorRate.add(1);
}

function testUserAuthentication(baseUrl) {
  const response = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({
      email: 'spike@example.com',
      password: 'SpikePassword123!'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'auth system responsive': (r) => r.status >= 200 && r.status < 500
  }) || errorRate.add(1);
}
```

## Browser Performance Testing

### Lighthouse Performance Testing
```javascript
// tests/performance/lighthouse.test.js
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('GIVEN Lighthouse performance audits', () => {
  test('THEN homepage should meet performance standards', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Run Lighthouse audit
    await playAudit({
      page,
      thresholds: {
        performance: 90,
        accessibility: 95,
        'best-practices': 90,
        seo: 90,
        pwa: 80
      },
      port: 9222
    });
  });

  test('THEN dashboard should load efficiently', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'perf@example.com');
    await page.fill('[data-testid="password-input"]', 'PerfPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('**/dashboard');
    
    // Audit dashboard performance
    await playAudit({
      page,
      thresholds: {
        performance: 85, // Slightly lower for dynamic content
        accessibility: 95,
        'best-practices': 90
      },
      port: 9222
    });
  });

  test('THEN task list should handle large datasets', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'bigdata@example.com');
    await page.fill('[data-testid="password-input"]', 'BigDataPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to tasks with large dataset
    await page.goto('/tasks?limit=1000');
    await page.waitForLoadState('networkidle');
    
    await playAudit({
      page,
      thresholds: {
        performance: 75, // Lower threshold for large datasets
        accessibility: 95
      },
      port: 9222
    });
  });
});
```

### Real User Monitoring (RUM) Simulation
```javascript
// tests/performance/rum.test.js
import { test, expect } from '@playwright/test';

test.describe('GIVEN real user monitoring scenarios', () => {
  test('THEN should track Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    // LCP should be under 2.5 seconds for good user experience
    expect(lcp).toBeLessThan(2500);
    
    // Measure First Input Delay (FID) simulation
    await page.click('[data-testid="main-navigation"]');
    
    const fidSimulation = await page.evaluate(() => {
      const start = performance.now();
      // Simulate user interaction
      document.querySelector('[data-testid="main-navigation"]')?.click();
      return performance.now() - start;
    });
    
    // FID should be under 100ms
    expect(fidSimulation).toBeLessThan(100);
    
    // Measure Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Trigger potential layout shift
        setTimeout(() => resolve(clsValue), 3000);
      });
    });
    
    // CLS should be under 0.1
    expect(cls).toBeLessThan(0.1);
  });

  test('THEN should measure navigation timing', async ({ page }) => {
    await page.goto('/login');
    
    const navigationTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0];
      return {
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcpConnect: timing.connectEnd - timing.connectStart,
        serverResponse: timing.responseEnd - timing.requestStart,
        domParsing: timing.domContentLoadedEventEnd - timing.responseEnd,
        resourceLoading: timing.loadEventEnd - timing.domContentLoadedEventEnd,
        totalLoad: timing.loadEventEnd - timing.navigationStart
      };
    });
    
    // DNS lookup should be fast
    expect(navigationTiming.dnsLookup).toBeLessThan(100);
    
    // Server response should be quick
    expect(navigationTiming.serverResponse).toBeLessThan(500);
    
    // Total page load should be reasonable
    expect(navigationTiming.totalLoad).toBeLessThan(3000);
    
    console.log('Navigation Timing:', navigationTiming);
  });

  test('THEN should monitor resource loading', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for all resources to load
    await page.waitForLoadState('networkidle');
    
    const resourceTiming = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      
      const analysis = {
        totalResources: resources.length,
        slowResources: [],
        largeResources: [],
        avgLoadTime: 0,
        totalSize: 0
      };
      
      let totalTime = 0;
      
      resources.forEach(resource => {
        const loadTime = resource.responseEnd - resource.startTime;
        totalTime += loadTime;
        
        // Flag slow resources (> 1 second)
        if (loadTime > 1000) {
          analysis.slowResources.push({
            name: resource.name,
            loadTime: loadTime
          });
        }
        
        // Flag large resources (> 1MB if transfer size available)
        if (resource.transferSize && resource.transferSize > 1024 * 1024) {
          analysis.largeResources.push({
            name: resource.name,
            size: resource.transferSize
          });
        }
        
        analysis.totalSize += resource.transferSize || 0;
      });
      
      analysis.avgLoadTime = totalTime / resources.length;
      
      return analysis;
    });
    
    // Average resource load time should be reasonable
    expect(resourceTiming.avgLoadTime).toBeLessThan(500);
    
    // Should not have too many slow resources
    expect(resourceTiming.slowResources.length).toBeLessThan(5);
    
    // Total page size should be reasonable (< 5MB)
    expect(resourceTiming.totalSize).toBeLessThan(5 * 1024 * 1024);
    
    console.log('Resource Analysis:', resourceTiming);
  });
});
```

## Memory Performance Testing

### Memory Leak Detection
```javascript
// tests/performance/memory.test.js
import { test, expect } from '@playwright/test';

test.describe('GIVEN memory performance requirements', () => {
  test('THEN should not have memory leaks during navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (!initialMemory) {
      test.skip('Performance.memory API not available');
      return;
    }
    
    // Login
    await page.fill('[data-testid="email-input"]', 'memory@example.com');
    await page.fill('[data-testid="password-input"]', 'MemoryPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate through different pages multiple times
    const routes = ['/tasks', '/profile', '/settings', '/reports', '/dashboard'];
    
    for (let iteration = 0; iteration < 3; iteration++) {
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Force garbage collection if available
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
        
        await page.waitForTimeout(1000);
      }
    }
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    });
    
    const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
    const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
    
    console.log(`Memory increase: ${memoryIncrease} bytes (${memoryIncreasePercent.toFixed(2)}%)`);
    
    // Memory increase should be reasonable (< 50%)
    expect(memoryIncreasePercent).toBeLessThan(50);
    
    // Total memory usage should not exceed reasonable limits (100MB)
    expect(finalMemory.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
  });

  test('THEN should handle large dataset operations efficiently', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'bigdata@example.com');
    await page.fill('[data-testid="password-input"]', 'BigDataPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/tasks');
    
    // Get memory before large operation
    const beforeMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Load large dataset
    await page.selectOption('[data-testid="page-size-select"]', '1000');
    await page.waitForLoadState('networkidle');
    
    // Perform operations that might cause memory issues
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="search-input"]', `search ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="search-results"]');
      await page.fill('[data-testid="search-input"]', '');
      await page.keyboard.press('Enter');
    }
    
    // Get memory after operations
    const afterMemory = await page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    const memoryDiff = afterMemory - beforeMemory;
    
    console.log(`Memory difference after large dataset operations: ${memoryDiff} bytes`);
    
    // Memory increase should be reasonable for the operations performed
    expect(memoryDiff).toBeLessThan(50 * 1024 * 1024); // 50MB limit
  });
});
```

## Database Performance Testing

### Database Load Testing
```javascript
// tests/performance/database.test.js
import { test, expect } from '@playwright/test';

test.describe('GIVEN database performance requirements', () => {
  test('THEN should handle concurrent database operations', async ({ browser }) => {
    const contexts = [];
    const pages = [];
    
    try {
      // Create multiple browser contexts (simulate multiple users)
      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // Login all users concurrently
      const loginPromises = pages.map(async (page, index) => {
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', `user${index}@example.com`);
        await page.fill('[data-testid="password-input"]', 'ConcurrentPassword123!');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('**/dashboard');
      });
      
      const loginStart = Date.now();
      await Promise.all(loginPromises);
      const loginDuration = Date.now() - loginStart;
      
      console.log(`Concurrent login duration: ${loginDuration}ms`);
      
      // Concurrent logins should complete within reasonable time
      expect(loginDuration).toBeLessThan(10000); // 10 seconds
      
      // Perform concurrent database operations
      const operationPromises = pages.map(async (page, index) => {
        await page.goto('/tasks');
        
        // Create tasks concurrently
        for (let j = 0; j < 5; j++) {
          await page.click('[data-testid="create-task-button"]');
          await page.fill('[data-testid="task-title-input"]', `Concurrent Task ${index}-${j}`);
          await page.fill('[data-testid="task-description-input"]', 'Testing concurrent operations');
          await page.click('[data-testid="save-task-button"]');
          await page.waitForSelector(`[data-testid="task-item-Concurrent Task ${index}-${j}"]`);
        }
      });
      
      const operationStart = Date.now();
      await Promise.all(operationPromises);
      const operationDuration = Date.now() - operationStart;
      
      console.log(`Concurrent operations duration: ${operationDuration}ms`);
      
      // Concurrent operations should complete within reasonable time
      expect(operationDuration).toBeLessThan(30000); // 30 seconds
      
    } finally {
      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('THEN should handle database connection pooling efficiently', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'pooltest@example.com');
    await page.fill('[data-testid="password-input"]', 'PoolTestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/tasks');
    
    // Perform rapid sequential operations to test connection pooling
    const operationTimes = [];
    
    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      
      // Trigger database query
      await page.fill('[data-testid="search-input"]', `search${i}`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="search-results"]');
      
      const duration = Date.now() - start;
      operationTimes.push(duration);
      
      // Clear search
      await page.fill('[data-testid="search-input"]', '');
      await page.keyboard.press('Enter');
    }
    
    const avgOperationTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
    const maxOperationTime = Math.max(...operationTimes);
    
    console.log(`Average operation time: ${avgOperationTime}ms`);
    console.log(`Max operation time: ${maxOperationTime}ms`);
    
    // Average operation time should be reasonable
    expect(avgOperationTime).toBeLessThan(1000);
    
    // No single operation should take too long (indicating connection issues)
    expect(maxOperationTime).toBeLessThan(5000);
    
    // Operations should be relatively consistent (no outliers indicating pool exhaustion)
    const operationTimeVariance = operationTimes.reduce((variance, time) => {
      return variance + Math.pow(time - avgOperationTime, 2);
    }, 0) / operationTimes.length;
    
    const operationTimeStdDev = Math.sqrt(operationTimeVariance);
    
    console.log(`Operation time standard deviation: ${operationTimeStdDev}ms`);
    
    // Standard deviation should be reasonable (consistent performance)
    expect(operationTimeStdDev).toBeLessThan(avgOperationTime); // StdDev < average
  });
});
```

## API Performance Testing

### API Latency Testing
```javascript
// tests/performance/api.test.js
import { test, expect } from '@playwright/test';

test.describe('GIVEN API performance requirements', () => {
  test('THEN should meet API response time SLAs', async ({ request }) => {
    const apiTests = [
      {
        name: 'Health Check',
        endpoint: '/api/health',
        method: 'GET',
        expectedTime: 100, // 100ms
        payload: null
      },
      {
        name: 'User Authentication',
        endpoint: '/api/auth/login',
        method: 'POST',
        expectedTime: 500, // 500ms
        payload: {
          email: 'api@example.com',
          password: 'ApiPassword123!'
        }
      },
      {
        name: 'Tasks List',
        endpoint: '/api/tasks',
        method: 'GET',
        expectedTime: 300, // 300ms
        payload: null,
        auth: true
      },
      {
        name: 'Task Creation',
        endpoint: '/api/tasks',
        method: 'POST',
        expectedTime: 400, // 400ms
        payload: {
          title: 'Performance Test Task',
          description: 'Testing API performance'
        },
        auth: true
      },
      {
        name: 'Search',
        endpoint: '/api/search?q=test',
        method: 'GET',
        expectedTime: 600, // 600ms
        payload: null,
        auth: true
      }
    ];
    
    let authToken = null;
    
    for (const apiTest of apiTests) {
      // Get auth token if needed
      if (apiTest.auth && !authToken) {
        const loginResponse = await request.post('/api/auth/login', {
          data: {
            email: 'api@example.com',
            password: 'ApiPassword123!'
          }
        });
        const loginData = await loginResponse.json();
        authToken = loginData.token;
      }
      
      // Prepare request options
      const options = {
        data: apiTest.payload
      };
      
      if (apiTest.auth && authToken) {
        options.headers = {
          'Authorization': `Bearer ${authToken}`
        };
      }
      
      // Measure API response time
      const start = Date.now();
      
      let response;
      switch (apiTest.method) {
        case 'GET':
          response = await request.get(apiTest.endpoint, options);
          break;
        case 'POST':
          response = await request.post(apiTest.endpoint, options);
          break;
        case 'PUT':
          response = await request.put(apiTest.endpoint, options);
          break;
        case 'DELETE':
          response = await request.delete(apiTest.endpoint, options);
          break;
      }
      
      const duration = Date.now() - start;
      
      console.log(`${apiTest.name}: ${duration}ms (expected: ${apiTest.expectedTime}ms)`);
      
      // Check response is successful
      expect(response.status()).toBeLessThan(400);
      
      // Check response time meets SLA
      expect(duration).toBeLessThan(apiTest.expectedTime);
    }
  });

  test('THEN should handle API rate limiting gracefully', async ({ request }) => {
    // Get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'ratetest@example.com',
        password: 'RateTestPassword123!'
      }
    });
    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    
    const headers = {
      'Authorization': `Bearer ${authToken}`
    };
    
    // Make rapid requests to trigger rate limiting
    const requests = [];
    const requestCount = 100;
    
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        request.get('/api/tasks', { headers })
          .then(response => ({
            status: response.status(),
            timestamp: Date.now()
          }))
          .catch(error => ({
            status: 0,
            error: error.message,
            timestamp: Date.now()
          }))
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Analyze response patterns
    const successfulRequests = responses.filter(r => r.status === 200);
    const rateLimitedRequests = responses.filter(r => r.status === 429);
    const errorRequests = responses.filter(r => r.status !== 200 && r.status !== 429);
    
    console.log(`Successful: ${successfulRequests.length}`);
    console.log(`Rate limited: ${rateLimitedRequests.length}`);
    console.log(`Errors: ${errorRequests.length}`);
    
    // Should have some rate limiting (API should protect itself)
    expect(rateLimitedRequests.length).toBeGreaterThan(0);
    
    // Should not have server errors due to overload
    expect(errorRequests.length).toBe(0);
    
    // Rate limiting should kick in quickly
    const firstRateLimit = rateLimitedRequests[0];
    const firstRequest = responses[0];
    
    if (firstRateLimit) {
      const rateLimitDelay = firstRateLimit.timestamp - firstRequest.timestamp;
      expect(rateLimitDelay).toBeLessThan(5000); // Rate limiting within 5 seconds
    }
  });

  test('THEN should maintain performance under concurrent API load', async ({ browser }) => {
    const contexts = [];
    const results = [];
    
    try {
      // Create multiple browser contexts for concurrent testing
      for (let i = 0; i < 5; i++) {
        const context = await browser.newContext();
        contexts.push(context);
      }
      
      // Run concurrent API tests
      const concurrentTests = contexts.map(async (context, index) => {
        const request = context.request;
        
        // Login
        const loginResponse = await request.post('/api/auth/login', {
          data: {
            email: `concurrent${index}@example.com`,
            password: 'ConcurrentPassword123!'
          }
        });
        
        const loginData = await loginResponse.json();
        const authToken = loginData.token;
        
        const headers = { 'Authorization': `Bearer ${authToken}` };
        
        // Perform series of API calls
        const apiCalls = [
          () => request.get('/api/tasks', { headers }),
          () => request.post('/api/tasks', {
            data: {
              title: `Concurrent Task ${index}`,
              description: 'Concurrent API test'
            },
            headers
          }),
          () => request.get('/api/search?q=concurrent', { headers }),
          () => request.get('/api/profile', { headers })
        ];
        
        const callResults = [];
        
        for (const apiCall of apiCalls) {
          const start = Date.now();
          const response = await apiCall();
          const duration = Date.now() - start;
          
          callResults.push({
            status: response.status(),
            duration: duration,
            context: index
          });
        }
        
        return callResults;
      });
      
      const allResults = await Promise.all(concurrentTests);
      const flatResults = allResults.flat();
      
      // Analyze concurrent performance
      const avgDuration = flatResults.reduce((sum, result) => sum + result.duration, 0) / flatResults.length;
      const maxDuration = Math.max(...flatResults.map(r => r.duration));
      const successRate = flatResults.filter(r => r.status < 400).length / flatResults.length;
      
      console.log(`Concurrent API average duration: ${avgDuration}ms`);
      console.log(`Concurrent API max duration: ${maxDuration}ms`);
      console.log(`Concurrent API success rate: ${(successRate * 100).toFixed(2)}%`);
      
      // Performance should remain reasonable under concurrent load
      expect(avgDuration).toBeLessThan(2000); // 2 seconds average
      expect(maxDuration).toBeLessThan(10000); // 10 seconds max
      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      
    } finally {
      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    }
  });
});
```

## Performance Test Configuration

### Jest Performance Configuration
```javascript
// jest.performance.config.js
module.exports = {
  displayName: 'Performance Tests',
  testMatch: ['**/tests/performance/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/performance/setup.js'],
  testTimeout: 120000, // 2 minutes for performance tests
  maxWorkers: 1, // Run performance tests sequentially
  testEnvironment: 'node',
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Performance Test Report',
      outputPath: 'reports/performance-tests.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/test-utils/**/*'
  ],
  coverageDirectory: 'coverage/performance',
  coverageReporters: ['text', 'lcov', 'html']
};
```

### Playwright Performance Configuration
```javascript
// playwright.performance.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  timeout: 120000, // 2 minutes
  expect: {
    timeout: 30000 // 30 seconds
  },
  fullyParallel: false, // Run performance tests sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker for consistent performance measurements
  reporter: [
    ['html', { outputFolder: 'reports/playwright-performance' }],
    ['json', { outputFile: 'reports/performance-results.json' }],
    ['junit', { outputFile: 'reports/performance-junit.xml' }]
  ],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Disable animations for consistent performance measurements
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Reduce timeout for performance tests
    navigationTimeout: 30000,
    actionTimeout: 15000
  },
  projects: [
    {
      name: 'chromium-performance',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox-performance',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit-performance',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run start:test',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

## Related Resources
- [Unit Testing Patterns](./unit-testing.md)
- [Integration Testing Patterns](./integration-testing.md)
- [E2E Testing Patterns](./e2e-testing.md)
- [Best Practices](../common/best-practices.md)
- [Testing Principles](../common/testing-principles.md)