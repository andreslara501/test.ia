# End-to-End Testing Patterns

This guide covers comprehensive end-to-end (E2E) testing patterns that apply across all web applications. E2E tests verify complete user workflows from the browser perspective, testing the entire application stack.

## E2E Testing Principles

### Page Object Model Pattern
```javascript
// pages/LoginPage.js
export class LoginPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.emailInput = '[data-testid="email-input"]';
    this.passwordInput = '[data-testid="password-input"]';
    this.loginButton = '[data-testid="login-button"]';
    this.errorMessage = '[data-testid="error-message"]';
    this.forgotPasswordLink = '[data-testid="forgot-password-link"]';
    this.rememberMeCheckbox = '[data-testid="remember-me-checkbox"]';
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForSelector(this.emailInput);
  }

  async login(email, password, options = {}) {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
    
    if (options.rememberMe) {
      await this.page.check(this.rememberMeCheckbox);
    }
    
    // Click login and wait for navigation or error
    const [response] = await Promise.all([
      this.page.waitForResponse('/api/auth/login'),
      this.page.click(this.loginButton)
    ]);
    
    return response;
  }

  async getErrorMessage() {
    await this.page.waitForSelector(this.errorMessage, { state: 'visible' });
    return this.page.textContent(this.errorMessage);
  }

  async clickForgotPassword() {
    await this.page.click(this.forgotPasswordLink);
    await this.page.waitForURL('**/forgot-password');
  }

  async isLoginFormVisible() {
    return this.page.isVisible(this.emailInput);
  }

  async waitForRedirect(expectedUrl) {
    await this.page.waitForURL(expectedUrl);
  }
}
```

```javascript
// pages/DashboardPage.js
export class DashboardPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.welcomeMessage = '[data-testid="welcome-message"]';
    this.userMenu = '[data-testid="user-menu"]';
    this.logoutButton = '[data-testid="logout-button"]';
    this.navigationMenu = '[data-testid="navigation-menu"]';
    this.tasksList = '[data-testid="tasks-list"]';
    this.createTaskButton = '[data-testid="create-task-button"]';
    this.searchInput = '[data-testid="search-input"]';
    this.notificationBell = '[data-testid="notification-bell"]';
  }

  async waitForLoad() {
    await this.page.waitForSelector(this.welcomeMessage);
    await this.page.waitForLoadState('networkidle');
  }

  async getWelcomeMessage() {
    return this.page.textContent(this.welcomeMessage);
  }

  async navigateToTasks() {
    await this.page.click('[data-testid="nav-tasks"]');
    await this.page.waitForURL('**/tasks');
  }

  async createTask(taskData) {
    await this.page.click(this.createTaskButton);
    
    // Fill task form
    await this.page.fill('[data-testid="task-title-input"]', taskData.title);
    await this.page.fill('[data-testid="task-description-input"]', taskData.description);
    
    if (taskData.dueDate) {
      await this.page.fill('[data-testid="task-due-date-input"]', taskData.dueDate);
    }
    
    if (taskData.priority) {
      await this.page.selectOption('[data-testid="task-priority-select"]', taskData.priority);
    }
    
    // Submit form
    await this.page.click('[data-testid="save-task-button"]');
    
    // Wait for task to appear in list
    await this.page.waitForSelector(`[data-testid="task-item-${taskData.title}"]`);
  }

  async searchTasks(query) {
    await this.page.fill(this.searchInput, query);
    await this.page.keyboard.press('Enter');
    
    // Wait for search results
    await this.page.waitForFunction(
      () => !document.querySelector('[data-testid="loading-spinner"]')
    );
  }

  async logout() {
    await this.page.click(this.userMenu);
    await this.page.click(this.logoutButton);
    await this.page.waitForURL('**/login');
  }

  async getTasksCount() {
    const tasks = await this.page.locator('[data-testid^="task-item-"]').count();
    return tasks;
  }

  async getNotificationCount() {
    const badge = this.page.locator('[data-testid="notification-badge"]');
    if (await badge.isVisible()) {
      return parseInt(await badge.textContent());
    }
    return 0;
  }
}
```

### User Workflow Testing
```javascript
// tests/userWorkflows.e2e.test.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { TasksPage } from '../pages/TasksPage.js';
import { ProfilePage } from '../pages/ProfilePage.js';

test.describe('GIVEN user workflows', () => {
  let loginPage;
  let dashboardPage;
  let tasksPage;
  let profilePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    tasksPage = new TasksPage(page);
    profilePage = new ProfilePage(page);
  });

  test.describe('WHEN new user completes onboarding', () => {
    test('THEN should complete full registration and setup workflow', async ({ page }) => {
      // Step 1: Register new account
      await page.goto('/register');
      
      await page.fill('[data-testid="register-name-input"]', 'John Doe');
      await page.fill('[data-testid="register-email-input"]', 'john.doe@example.com');
      await page.fill('[data-testid="register-password-input"]', 'SecurePassword123!');
      await page.fill('[data-testid="register-confirm-password-input"]', 'SecurePassword123!');
      
      await page.click('[data-testid="register-button"]');
      
      // Step 2: Verify email (simulate clicking email link)
      await page.waitForURL('**/verify-email');
      expect(await page.textContent('[data-testid="verification-message"]'))
        .toContain('check your email');
      
      // Simulate email verification
      await page.goto('/verify-email?token=mock-verification-token');
      await page.waitForURL('**/onboarding');
      
      // Step 3: Complete profile setup
      await page.fill('[data-testid="bio-input"]', 'Software Engineer');
      await page.selectOption('[data-testid="timezone-select"]', 'America/New_York');
      await page.check('[data-testid="notifications-email-checkbox"]');
      
      await page.click('[data-testid="save-profile-button"]');
      
      // Step 4: Tour/walkthrough
      await page.waitForSelector('[data-testid="welcome-tour"]');
      
      // Skip tour or go through steps
      await page.click('[data-testid="skip-tour-button"]');
      
      // Step 5: Verify user lands on dashboard
      await dashboardPage.waitForLoad();
      
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).toContain('Welcome, John Doe');
      
      // Step 6: Create first task
      await dashboardPage.createTask({
        title: 'My First Task',
        description: 'Getting started with the app',
        priority: 'medium'
      });
      
      const tasksCount = await dashboardPage.getTasksCount();
      expect(tasksCount).toBe(1);
    });
  });

  test.describe('WHEN user manages tasks workflow', () => {
    test.beforeEach(async ({ page }) => {
      // Login as existing user
      await loginPage.goto();
      await loginPage.login('testuser@example.com', 'TestPassword123!');
      await dashboardPage.waitForLoad();
    });

    test('THEN should complete task management workflow', async ({ page }) => {
      // Navigate to tasks
      await dashboardPage.navigateToTasks();
      await tasksPage.waitForLoad();
      
      // Create multiple tasks
      const tasks = [
        {
          title: 'Design Homepage',
          description: 'Create wireframes and mockups',
          priority: 'high',
          dueDate: '2023-12-31'
        },
        {
          title: 'Implement Authentication',
          description: 'Add login and registration',
          priority: 'medium',
          dueDate: '2024-01-15'
        },
        {
          title: 'Write Documentation',
          description: 'API and user documentation',
          priority: 'low',
          dueDate: '2024-01-30'
        }
      ];
      
      for (const task of tasks) {
        await tasksPage.createTask(task);
      }
      
      // Verify all tasks created
      const totalTasks = await tasksPage.getTasksCount();
      expect(totalTasks).toBe(3);
      
      // Filter by priority
      await tasksPage.filterByPriority('high');
      const highPriorityTasks = await tasksPage.getTasksCount();
      expect(highPriorityTasks).toBe(1);
      
      // Clear filter
      await tasksPage.clearFilters();
      
      // Sort by due date
      await tasksPage.sortBy('dueDate');
      const firstTask = await tasksPage.getFirstTaskTitle();
      expect(firstTask).toBe('Design Homepage');
      
      // Complete a task
      await tasksPage.completeTask('Design Homepage');
      const completedTasks = await tasksPage.getCompletedTasksCount();
      expect(completedTasks).toBe(1);
      
      // Edit a task
      await tasksPage.editTask('Implement Authentication', {
        title: 'Implement User Authentication',
        priority: 'high'
      });
      
      // Verify edit
      await tasksPage.filterByPriority('high');
      const updatedHighPriorityTasks = await tasksPage.getTasksCount();
      expect(updatedHighPriorityTasks).toBe(1); // Only the edited task should be high priority now
      
      // Delete a task
      await tasksPage.clearFilters();
      await tasksPage.deleteTask('Write Documentation');
      
      const finalTaskCount = await tasksPage.getTasksCount();
      expect(finalTaskCount).toBe(2);
    });
  });

  test.describe('WHEN user updates profile', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login('testuser@example.com', 'TestPassword123!');
      await dashboardPage.waitForLoad();
    });

    test('THEN should update profile information successfully', async ({ page }) => {
      // Navigate to profile
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="profile-link"]');
      await profilePage.waitForLoad();
      
      // Update profile information
      await profilePage.updateBasicInfo({
        name: 'Updated User Name',
        bio: 'Updated bio information',
        location: 'New York, NY'
      });
      
      // Update preferences
      await profilePage.updatePreferences({
        timezone: 'America/Los_Angeles',
        emailNotifications: false,
        pushNotifications: true,
        theme: 'dark'
      });
      
      // Update password
      await profilePage.changePassword({
        currentPassword: 'TestPassword123!',
        newPassword: 'NewSecurePassword456!',
        confirmPassword: 'NewSecurePassword456!'
      });
      
      // Verify changes saved
      expect(await profilePage.getSuccessMessage())
        .toContain('Profile updated successfully');
      
      // Logout and login with new password
      await dashboardPage.logout();
      await loginPage.login('testuser@example.com', 'NewSecurePassword456!');
      await dashboardPage.waitForLoad();
      
      // Verify updated name is displayed
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).toContain('Updated User Name');
    });
  });
});
```

## Cross-Browser Testing
```javascript
// tests/crossBrowser.e2e.test.js
import { test, expect, devices } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';

// Test on multiple browsers
const browsers = ['chromium', 'firefox', 'webkit'];

browsers.forEach(browserName => {
  test.describe(`GIVEN ${browserName} browser`, () => {
    test.use({ 
      ...devices['Desktop ' + browserName.charAt(0).toUpperCase() + browserName.slice(1)]
    });

    test('THEN should handle core user workflow', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login('testuser@example.com', 'TestPassword123!');
      await dashboardPage.waitForLoad();

      // Test core functionality across browsers
      await dashboardPage.createTask({
        title: `Cross-browser test ${browserName}`,
        description: 'Testing compatibility'
      });

      const tasksCount = await dashboardPage.getTasksCount();
      expect(tasksCount).toBeGreaterThan(0);
    });
  });
});

// Mobile device testing
test.describe('GIVEN mobile devices', () => {
  test.use({ ...devices['iPhone 12'] });

  test('THEN should work on mobile Safari', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    
    // Test mobile-specific interactions
    await page.tap('[data-testid="email-input"]');
    await page.fill('[data-testid="email-input"]', 'mobile@example.com');
    
    await page.tap('[data-testid="password-input"]');
    await page.fill('[data-testid="password-input"]', 'MobilePassword123!');
    
    await page.tap('[data-testid="login-button"]');
    await dashboardPage.waitForLoad();

    // Test mobile navigation
    await page.tap('[data-testid="mobile-menu-button"]');
    await page.tap('[data-testid="nav-tasks"]');
    
    expect(page.url()).toContain('/tasks');
  });
});
```

## API Integration Testing
```javascript
// tests/apiIntegration.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('GIVEN API integration', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocking or real API endpoints
    await page.route('/api/**', async route => {
      // Log all API calls for debugging
      console.log(`API Call: ${route.request().method()} ${route.request().url()}`);
      
      // Let real requests through or mock them
      await route.continue();
    });
  });

  test('WHEN user performs CRUD operations', async ({ page, request }) => {
    // Login to get auth token
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'api@example.com');
    await page.fill('[data-testid="password-input"]', 'ApiPassword123!');
    
    // Intercept login response to get token
    const [loginResponse] = await Promise.all([
      page.waitForResponse('/api/auth/login'),
      page.click('[data-testid="login-button"]')
    ]);
    
    const loginData = await loginResponse.json();
    const authToken = loginData.token;
    
    // Test direct API calls
    const apiContext = await request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Create task via API
    const createResponse = await apiContext.post('/api/tasks', {
      data: {
        title: 'API Created Task',
        description: 'Created via direct API call',
        priority: 'high'
      }
    });
    
    expect(createResponse.ok()).toBeTruthy();
    const createdTask = await createResponse.json();
    
    // Verify task appears in UI
    await page.goto('/tasks');
    await page.waitForSelector(`[data-testid="task-item-${createdTask.id}"]`);
    
    // Update task via API
    const updateResponse = await apiContext.patch(`/api/tasks/${createdTask.id}`, {
      data: {
        title: 'Updated API Task',
        completed: true
      }
    });
    
    expect(updateResponse.ok()).toBeTruthy();
    
    // Verify update in UI
    await page.reload();
    await page.waitForSelector(`[data-testid="task-item-${createdTask.id}"]`);
    
    const taskElement = page.locator(`[data-testid="task-item-${createdTask.id}"]`);
    expect(await taskElement.textContent()).toContain('Updated API Task');
    expect(await taskElement.locator('[data-testid="task-completed-checkbox"]').isChecked()).toBeTruthy();
    
    // Delete task via API
    const deleteResponse = await apiContext.delete(`/api/tasks/${createdTask.id}`);
    expect(deleteResponse.ok()).toBeTruthy();
    
    // Verify deletion in UI
    await page.reload();
    await expect(page.locator(`[data-testid="task-item-${createdTask.id}"]`)).not.toBeVisible();
  });

  test('WHEN API returns errors', async ({ page }) => {
    // Mock API error responses
    await page.route('/api/tasks', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'testuser@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.goto('/tasks');
    
    // Try to create task - should fail
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-title-input"]', 'Error Test Task');
    await page.click('[data-testid="save-task-button"]');
    
    // Verify error message is displayed
    await page.waitForSelector('[data-testid="error-notification"]');
    const errorMessage = await page.textContent('[data-testid="error-notification"]');
    expect(errorMessage).toContain('Failed to create task');
  });
});
```

## Performance E2E Testing
```javascript
// tests/performance.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('GIVEN performance requirements', () => {
  test('THEN should meet performance benchmarks', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/login');
    
    // Measure login performance
    const loginStart = Date.now();
    await page.fill('[data-testid="email-input"]', 'perf@example.com');
    await page.fill('[data-testid="password-input"]', 'PerfPassword123!');
    
    const [response] = await Promise.all([
      page.waitForResponse('/api/auth/login'),
      page.click('[data-testid="login-button"]')
    ]);
    
    await page.waitForURL('**/dashboard');
    const loginDuration = Date.now() - loginStart;
    
    // Login should complete within 3 seconds
    expect(loginDuration).toBeLessThan(3000);
    expect(response.status()).toBe(200);
    
    // Measure dashboard load performance
    const dashboardStart = Date.now();
    await page.waitForLoadState('networkidle');
    const dashboardDuration = Date.now() - dashboardStart;
    
    // Dashboard should load within 2 seconds
    expect(dashboardDuration).toBeLessThan(2000);
    
    // Measure task list performance with many items
    await page.goto('/tasks');
    
    // Wait for tasks to load
    const tasksStart = Date.now();
    await page.waitForSelector('[data-testid="tasks-list"]');
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="loading-spinner"]')
    );
    const tasksDuration = Date.now() - tasksStart;
    
    // Task list should load within 1.5 seconds
    expect(tasksDuration).toBeLessThan(1500);
    
    // Test search performance
    const searchStart = Date.now();
    await page.fill('[data-testid="search-input"]', 'important');
    await page.keyboard.press('Enter');
    
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="search-loading"]')
    );
    const searchDuration = Date.now() - searchStart;
    
    // Search should complete within 1 second
    expect(searchDuration).toBeLessThan(1000);
  });

  test('THEN should handle large datasets efficiently', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'bigdata@example.com');
    await page.fill('[data-testid="password-input"]', 'BigDataPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to tasks with large dataset
    await page.goto('/tasks?view=all&limit=1000');
    
    // Measure rendering time for large list
    const renderStart = Date.now();
    await page.waitForSelector('[data-testid="tasks-list"]');
    
    // Wait for all items to render
    await page.waitForFunction(() => {
      const list = document.querySelector('[data-testid="tasks-list"]');
      return list && list.children.length > 900; // Allow for some loading
    });
    
    const renderDuration = Date.now() - renderStart;
    
    // Large list should render within 5 seconds
    expect(renderDuration).toBeLessThan(5000);
    
    // Test scrolling performance
    const scrollStart = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for scroll to complete
    await page.waitForTimeout(100);
    const scrollDuration = Date.now() - scrollStart;
    
    // Scrolling should be smooth (under 200ms)
    expect(scrollDuration).toBeLessThan(200);
  });

  test('THEN should monitor resource usage', async ({ page }) => {
    // Start monitoring
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    
    // Navigate and perform actions
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'resource@example.com');
    await page.fill('[data-testid="password-input"]', 'ResourcePassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('**/dashboard');
    await page.goto('/tasks');
    
    // Create several tasks to generate activity
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-title-input"]', `Performance Task ${i}`);
      await page.click('[data-testid="save-task-button"]');
      await page.waitForSelector(`[data-testid="task-item-Performance Task ${i}"]`);
    }
    
    // Get performance metrics
    const metrics = await client.send('Performance.getMetrics');
    const metricsMap = {};
    metrics.metrics.forEach(metric => {
      metricsMap[metric.name] = metric.value;
    });
    
    // Check memory usage (should be reasonable)
    expect(metricsMap.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    expect(metricsMap.JSHeapTotalSize).toBeLessThan(100 * 1024 * 1024); // 100MB
    
    // Check DOM node count (should not be excessive)
    expect(metricsMap.Nodes).toBeLessThan(5000);
  });
});
```

## Accessibility E2E Testing
```javascript
// tests/accessibility.e2e.test.js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('GIVEN accessibility requirements', () => {
  test('THEN should meet WCAG guidelines', async ({ page }) => {
    await page.goto('/login');
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('THEN should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="login-button"]')).toBeFocused();
    
    // Test form submission with Enter
    await page.fill('[data-testid="email-input"]', 'keyboard@example.com');
    await page.fill('[data-testid="password-input"]', 'KeyboardPassword123!');
    await page.keyboard.press('Enter');
    
    await page.waitForURL('**/dashboard');
    
    // Test dashboard keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Should navigate to tasks
    
    await page.waitForURL('**/tasks');
    
    // Test task creation with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Create task button
    
    await page.keyboard.type('Keyboard Created Task');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Created using only keyboard');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Save task
    
    await page.waitForSelector('[data-testid="task-item-Keyboard Created Task"]');
  });

  test('THEN should work with screen readers', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper ARIA labels and roles
    const emailInput = page.locator('[data-testid="email-input"]');
    expect(await emailInput.getAttribute('aria-label')).toBeTruthy();
    expect(await emailInput.getAttribute('type')).toBe('email');
    
    const passwordInput = page.locator('[data-testid="password-input"]');
    expect(await passwordInput.getAttribute('aria-label')).toBeTruthy();
    expect(await passwordInput.getAttribute('type')).toBe('password');
    
    const loginButton = page.locator('[data-testid="login-button"]');
    expect(await loginButton.getAttribute('role')).toBe('button');
    
    // Check for proper heading structure
    await page.goto('/dashboard');
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    // Verify heading hierarchy (h1 should come before h2, etc.)
    let lastLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.substring(1));
      
      if (level > lastLevel + 1) {
        throw new Error(`Heading level ${level} follows ${lastLevel}, skipping levels`);
      }
      lastLevel = level;
    }
  });

  test('THEN should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    
    await page.goto('/login');
    
    // Verify contrast ratios are maintained
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Test that interactive elements are still visible
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});
```

## Error Handling E2E Testing
```javascript
// tests/errorHandling.e2e.test.js
import { test, expect } from '@playwright/test';

test.describe('GIVEN error scenarios', () => {
  test('THEN should handle network failures gracefully', async ({ page }) => {
    await page.goto('/login');
    
    // Simulate network failure
    await page.route('/api/**', route => route.abort('failed'));
    
    await page.fill('[data-testid="email-input"]', 'network@example.com');
    await page.fill('[data-testid="password-input"]', 'NetworkPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Should show network error message
    await page.waitForSelector('[data-testid="error-message"]');
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('network');
    
    // Test retry functionality
    await page.route('/api/**', route => route.continue());
    await page.click('[data-testid="retry-button"]');
    
    await page.waitForURL('**/dashboard');
  });

  test('THEN should handle validation errors', async ({ page }) => {
    await page.goto('/login');
    
    // Test empty form submission
    await page.click('[data-testid="login-button"]');
    
    await page.waitForSelector('[data-testid="email-error"]');
    expect(await page.textContent('[data-testid="email-error"]'))
      .toContain('required');
    
    // Test invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="login-button"]');
    
    expect(await page.textContent('[data-testid="email-error"]'))
      .toContain('valid email');
    
    // Test password requirements
    await page.fill('[data-testid="email-input"]', 'valid@example.com');
    await page.fill('[data-testid="password-input"]', '123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForSelector('[data-testid="password-error"]');
    expect(await page.textContent('[data-testid="password-error"]'))
      .toContain('length');
  });

  test('THEN should handle authentication errors', async ({ page }) => {
    await page.goto('/login');
    
    // Mock authentication failure
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForSelector('[data-testid="error-message"]');
    expect(await page.textContent('[data-testid="error-message"]'))
      .toContain('Invalid credentials');
    
    // Test password reset flow
    await page.click('[data-testid="forgot-password-link"]');
    await page.waitForURL('**/forgot-password');
    
    await page.fill('[data-testid="reset-email-input"]', 'wrong@example.com');
    await page.click('[data-testid="send-reset-button"]');
    
    await page.waitForSelector('[data-testid="reset-success-message"]');
    expect(await page.textContent('[data-testid="reset-success-message"]'))
      .toContain('reset link sent');
  });

  test('THEN should handle session expiration', async ({ page }) => {
    // Login normally
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'session@example.com');
    await page.fill('[data-testid="password-input"]', 'SessionPassword123!');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL('**/dashboard');
    
    // Simulate session expiration
    await page.route('/api/**', route => {
      if (route.request().headers()['authorization']) {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        });
      } else {
        route.continue();
      }
    });
    
    // Try to perform an action that requires authentication
    await page.click('[data-testid="create-task-button"]');
    
    // Should be redirected to login
    await page.waitForURL('**/login');
    
    // Should show session expired message
    await page.waitForSelector('[data-testid="session-expired-message"]');
    expect(await page.textContent('[data-testid="session-expired-message"]'))
      .toContain('session expired');
  });
});
```

## Data-Driven E2E Testing
```javascript
// tests/dataDriven.e2e.test.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

// Test data sets
const testUsers = [
  {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin',
    expectedFeatures: ['user-management', 'system-settings', 'reports']
  },
  {
    email: 'manager@example.com',
    password: 'ManagerPassword123!',
    role: 'manager',
    expectedFeatures: ['team-management', 'reports']
  },
  {
    email: 'user@example.com',
    password: 'UserPassword123!',
    role: 'user',
    expectedFeatures: ['tasks', 'profile']
  }
];

const taskTestData = [
  {
    title: 'Urgent Bug Fix',
    description: 'Critical production issue',
    priority: 'high',
    category: 'bug',
    expectedTags: ['urgent', 'production']
  },
  {
    title: 'Feature Enhancement',
    description: 'Add new user dashboard',
    priority: 'medium',
    category: 'feature',
    expectedTags: ['enhancement', 'ui']
  },
  {
    title: 'Documentation Update',
    description: 'Update API documentation',
    priority: 'low',
    category: 'docs',
    expectedTags: ['documentation']
  }
];

test.describe('GIVEN different user roles', () => {
  for (const userData of testUsers) {
    test(`WHEN ${userData.role} user logs in`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      await loginPage.login(userData.email, userData.password);
      
      await page.waitForURL('**/dashboard');
      
      // Verify role-specific features are available
      for (const feature of userData.expectedFeatures) {
        await expect(page.locator(`[data-testid="${feature}-section"]`))
          .toBeVisible();
      }
      
      // Verify restricted features are not available
      const allFeatures = ['user-management', 'system-settings', 'reports', 'team-management'];
      const restrictedFeatures = allFeatures.filter(
        feature => !userData.expectedFeatures.includes(feature)
      );
      
      for (const feature of restrictedFeatures) {
        await expect(page.locator(`[data-testid="${feature}-section"]`))
          .not.toBeVisible();
      }
    });
  }
});

test.describe('GIVEN different task types', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('testuser@example.com', 'TestPassword123!');
    await page.waitForURL('**/dashboard');
    await page.goto('/tasks');
  });

  for (const taskData of taskTestData) {
    test(`WHEN creating ${taskData.category} task`, async ({ page }) => {
      await page.click('[data-testid="create-task-button"]');
      
      // Fill task form
      await page.fill('[data-testid="task-title-input"]', taskData.title);
      await page.fill('[data-testid="task-description-input"]', taskData.description);
      await page.selectOption('[data-testid="task-priority-select"]', taskData.priority);
      await page.selectOption('[data-testid="task-category-select"]', taskData.category);
      
      await page.click('[data-testid="save-task-button"]');
      
      // Wait for task to be created
      await page.waitForSelector(`[data-testid="task-item-${taskData.title}"]`);
      
      // Verify task properties
      const taskElement = page.locator(`[data-testid="task-item-${taskData.title}"]`);
      
      expect(await taskElement.locator('[data-testid="task-priority"]').textContent())
        .toBe(taskData.priority);
      
      expect(await taskElement.locator('[data-testid="task-category"]').textContent())
        .toBe(taskData.category);
      
      // Verify expected tags are applied
      for (const tag of taskData.expectedTags) {
        await expect(taskElement.locator(`[data-testid="task-tag-${tag}"]`))
          .toBeVisible();
      }
    });
  }
});

// Parameterized browser testing
const testEnvironments = [
  { name: 'production', url: 'https://app.example.com' },
  { name: 'staging', url: 'https://staging.example.com' },
  { name: 'development', url: 'http://localhost:3000' }
];

for (const env of testEnvironments) {
  test.describe(`GIVEN ${env.name} environment`, () => {
    test.use({ baseURL: env.url });
    
    test('THEN should handle basic user workflow', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await loginPage.goto();
      await loginPage.login('testuser@example.com', 'TestPassword123!');
      
      await page.waitForURL('**/dashboard');
      
      // Verify environment-specific elements
      if (env.name === 'development') {
        await expect(page.locator('[data-testid="dev-tools"]')).toBeVisible();
      } else {
        await expect(page.locator('[data-testid="dev-tools"]')).not.toBeVisible();
      }
      
      // Test core functionality works in all environments
      await page.goto('/tasks');
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-title-input"]', `${env.name} test task`);
      await page.click('[data-testid="save-task-button"]');
      
      await page.waitForSelector(`[data-testid="task-item-${env.name} test task"]`);
    });
  });
}
```

## Related Resources
- [Unit Testing Patterns](./unit-testing.md)
- [Integration Testing Patterns](./integration-testing.md)
- [Performance Testing Patterns](./performance-testing.md)
- [Best Practices](../common/best-practices.md)
- [Testing Principles](../common/testing-principles.md)