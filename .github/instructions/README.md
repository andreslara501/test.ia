# Modern Testing Documentation

A comprehensive, modular testing guide for modern web development. This documentation provides framework-specific testing strategies, universal patterns, and tool configurations to help you build robust, maintainable test suites.

## 🚀 Quick Start

Choose your path based on your project:

### By Framework
- **[React](./frameworks/react/)** - Testing Library, Jest/Vitest, hooks, components
- **[Vue](./frameworks/vue/)** - Vue Test Utils, Vitest/Jest, Composition API, Pinia
- **[Angular](./frameworks/angular/)** - TestBed, Jasmine/Jest, services, components
- **[Svelte](./frameworks/svelte/)** - Testing Library, Vitest/Jest, stores, components

### By Testing Type
- **[Unit Testing](./patterns/unit-testing.md)** - Functions, classes, components
- **[Integration Testing](./patterns/integration-testing.md)** - Services, APIs, components
- **[E2E Testing](./patterns/e2e-testing.md)** - User workflows, cross-browser
- **[Performance Testing](./patterns/performance-testing.md)** - Load, stress, memory

### By Tool
- **[Jest Configuration](./tools/jest-config.md)** - Setup, TypeScript, coverage
- **[Vitest Configuration](./tools/vitest-config.md)** - Vite integration, ESM support
- **[Playwright Configuration](./tools/playwright-config.md)** - Cross-browser E2E testing
- **[Cypress Configuration](./tools/cypress-config.md)** - Component and E2E testing

## 📚 Documentation Structure

```
.github/instructions/
├── common/                    # Universal principles
│   ├── testing-principles.md     # Core testing concepts
│   └── best-practices.md         # Cross-framework best practices
├── frameworks/                # Framework-specific guides
│   ├── react/                    # React ecosystem
│   │   ├── component-testing.md      # Testing Library, Jest/Vitest
│   │   ├── hooks-testing.md          # Custom hooks, state management
│   │   ├── integration-testing.md    # React Router, context, forms
│   │   ├── mocking-strategies.md     # API, modules, dependencies
│   │   └── advanced-patterns.md      # HOCs, render props, Suspense
│   ├── vue/                      # Vue ecosystem
│   │   ├── component-testing.md      # Vue Test Utils, Vitest/Jest
│   │   ├── composables-testing.md    # Composition API, reactivity
│   │   ├── integration-testing.md    # Vue Router, Pinia, forms
│   │   ├── mocking-strategies.md     # API, plugins, dependencies
│   │   └── advanced-patterns.md      # Directives, transitions, SSR
│   ├── angular/                  # Angular ecosystem
│   │   ├── component-testing.md      # TestBed, Jasmine/Jest
│   │   ├── services-testing.md       # Dependency injection, HTTP
│   │   ├── integration-testing.md    # Routing, forms, modules
│   │   ├── mocking-strategies.md     # HttpClient, services, guards
│   │   └── advanced-patterns.md      # Directives, pipes, animations
│   └── svelte/                   # Svelte ecosystem
│       ├── component-testing.md      # Testing Library, Vitest/Jest
│       ├── stores-testing.md         # State management, reactivity
│       ├── integration-testing.md    # SvelteKit, routing, forms
│       ├── mocking-strategies.md     # API, modules, stores
│       └── advanced-patterns.md      # Actions, transitions, SSR
├── patterns/                  # Framework-agnostic patterns
│   ├── unit-testing.md           # Pure functions, classes, validation
│   ├── integration-testing.md    # Services, APIs, databases
│   ├── e2e-testing.md            # User workflows, cross-browser
│   └── performance-testing.md    # Load, stress, memory testing
└── tools/                     # Testing tool configurations
    ├── jest-config.md             # Jest setup and optimization
    ├── vitest-config.md           # Vitest configuration patterns
    ├── playwright-config.md       # Playwright E2E setup
    └── cypress-config.md          # Cypress configuration guide
```

## 🎯 Testing Philosophy

Our testing approach follows these core principles:

### 1. **User-Centric Testing**
```javascript
// ✅ Test behavior, not implementation
test('should allow user to create a new task', async () => {
  await userEvent.click(screen.getByRole('button', { name: /add task/i }));
  await userEvent.type(screen.getByLabelText(/task title/i), 'Learn testing');
  await userEvent.click(screen.getByRole('button', { name: /save/i }));
  
  expect(screen.getByText('Learn testing')).toBeInTheDocument();
});

// ❌ Don't test implementation details
test('should call setTasks with new task', () => {
  const setTasks = jest.fn();
  render(<TaskForm setTasks={setTasks} />);
  // Testing internal function calls
});
```

### 2. **Confidence Over Coverage**
- Focus on critical user paths
- Test edge cases and error scenarios
- Maintain tests that provide real value
- Use coverage as a guide, not a goal

### 3. **Test Pyramid Structure**
```
        /\     E2E Tests
       /  \    (Few, High-Level)
      /____\
     /      \   Integration Tests
    /        \  (Some, API/Component)
   /__________\
  /            \ Unit Tests
 /              \ (Many, Fast, Isolated)
/______________\
```

## 🔧 Framework Comparison

| Feature | React | Vue | Angular | Svelte |
|---------|-------|-----|---------|--------|
| **Primary Testing Library** | Testing Library | Vue Test Utils | TestBed | Testing Library |
| **Test Runner** | Jest/Vitest | Vitest/Jest | Jasmine/Jest | Vitest/Jest |
| **Component Testing** | `render()` | `mount()` | `TestBed.createComponent()` | `render()` |
| **State Management Testing** | Context/Redux | Pinia/Vuex | Services/NgRx | Stores |
| **Routing Testing** | React Router | Vue Router | Angular Router | SvelteKit |
| **E2E Recommendations** | Playwright/Cypress | Playwright/Cypress | Protractor/Playwright | Playwright/Cypress |

## 🛠️ Tool Recommendations

### Unit/Integration Testing
- **Jest** - Mature, comprehensive, great for Node.js and React
- **Vitest** - Fast, ESM-native, perfect for Vite-based projects
- **Testing Library** - User-centric testing across frameworks

### E2E Testing
- **Playwright** - Modern, fast, reliable cross-browser testing
- **Cypress** - Excellent DX, time-travel debugging, component testing

### Performance Testing
- **k6** - Load testing with JavaScript
- **Lighthouse** - Web performance auditing
- **Web Vitals** - Core user experience metrics

## 🚦 Getting Started Guide

### 1. Choose Your Framework
Navigate to your framework's directory for specific setup instructions:
- [React Setup Guide](./frameworks/react/component-testing.md#setup)
- [Vue Setup Guide](./frameworks/vue/component-testing.md#setup)
- [Angular Setup Guide](./frameworks/angular/component-testing.md#setup)
- [Svelte Setup Guide](./frameworks/svelte/component-testing.md#setup)

### 2. Configure Your Tools
Set up your testing environment:
- [Jest Configuration](./tools/jest-config.md)
- [Vitest Configuration](./tools/vitest-config.md)
- [Playwright Configuration](./tools/playwright-config.md)
- [Cypress Configuration](./tools/cypress-config.md)

### 3. Learn Testing Patterns
Master universal testing concepts:
- [Testing Principles](./common/testing-principles.md)
- [Best Practices](./common/best-practices.md)
- [Unit Testing Patterns](./patterns/unit-testing.md)
- [Integration Testing Patterns](./patterns/integration-testing.md)

### 4. Implement E2E Testing
Build comprehensive end-to-end test suites:
- [E2E Testing Patterns](./patterns/e2e-testing.md)
- [Performance Testing](./patterns/performance-testing.md)

## 📖 Common Patterns

### Testing Components
```javascript
// React example
import { render, screen, userEvent } from '@testing-library/react';

test('TaskItem toggles completion status', async () => {
  const onToggle = jest.fn();
  render(<TaskItem title="Learn testing" completed={false} onToggle={onToggle} />);
  
  await userEvent.click(screen.getByRole('checkbox'));
  
  expect(onToggle).toHaveBeenCalledWith(true);
});
```

### Testing Async Operations
```javascript
test('loads and displays tasks', async () => {
  const mockTasks = [
    { id: 1, title: 'Task 1', completed: false },
    { id: 2, title: 'Task 2', completed: true }
  ];
  
  jest.spyOn(api, 'getTasks').mockResolvedValue(mockTasks);
  
  render(<TaskList />);
  
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });
  
  expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
});
```

### Testing Error States
```javascript
test('displays error message when API fails', async () => {
  jest.spyOn(api, 'getTasks').mockRejectedValue(new Error('API Error'));
  
  render(<TaskList />);
  
  await waitFor(() => {
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
  });
});
```

## 🔍 Advanced Topics

### Performance Testing
Monitor and optimize your application's performance:

```javascript
// Load testing with k6
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 }
  ]
};

export default function() {
  const response = http.get('https://api.example.com/tasks');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
}
```

### Accessibility Testing
Ensure your application is accessible to all users:

```javascript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('TaskForm is accessible', async () => {
  const { container } = render(<TaskForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Visual Regression Testing
Catch visual changes with screenshot testing:

```javascript
// With Playwright
test('TaskList visual regression', async ({ page }) => {
  await page.goto('/tasks');
  await page.waitForSelector('[data-testid="task-list"]');
  await expect(page).toHaveScreenshot('task-list.png');
});
```

## 📊 Test Coverage Guidelines

### Coverage Targets
- **Units**: 90%+ coverage for utility functions and business logic
- **Components**: 80%+ coverage for UI components
- **Integration**: 70%+ coverage for feature workflows
- **E2E**: 50%+ coverage for critical user paths

### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## 🔄 Migration Guide

### From Legacy Testing Patterns

#### Before: Implementation-focused
```javascript
// ❌ Testing implementation details
test('should update state correctly', () => {
  const wrapper = shallow(<TaskItem />);
  wrapper.instance().handleClick();
  expect(wrapper.state('completed')).toBe(true);
});
```

#### After: Behavior-focused
```javascript
// ✅ Testing user behavior
test('should mark task as completed when clicked', async () => {
  const onComplete = jest.fn();
  render(<TaskItem title="Test task" onComplete={onComplete} />);
  
  await userEvent.click(screen.getByRole('checkbox'));
  
  expect(onComplete).toHaveBeenCalled();
});
```

### From Enzyme to Testing Library
```javascript
// Before (Enzyme)
const wrapper = mount(<TaskForm />);
wrapper.find('input[name="title"]').simulate('change', { target: { value: 'New task' } });
wrapper.find('form').simulate('submit');

// After (Testing Library)
render(<TaskForm />);
await userEvent.type(screen.getByLabelText(/task title/i), 'New task');
await userEvent.click(screen.getByRole('button', { name: /submit/i }));
```

## 🎨 Best Practices Summary

### ✅ Do
- Write tests that resemble how users interact with your application
- Test behavior, not implementation details
- Use descriptive test names that explain the scenario
- Keep tests simple, focused, and fast
- Mock external dependencies and side effects
- Use proper test organization (describe/test blocks)
- Maintain tests as first-class citizens of your codebase

### ❌ Avoid
- Testing implementation details (internal state, private methods)
- Over-mocking (mock only what you need to)
- Testing third-party libraries
- Complex test setup that's hard to understand
- Tests that are flaky or environment-dependent
- Ignoring failing tests or commenting them out
- Writing tests just to increase coverage numbers

## 🤝 Contributing

This documentation is a living resource that evolves with the testing ecosystem. To contribute:

1. **Report Issues**: Found outdated information or missing patterns? Open an issue.
2. **Suggest Improvements**: Have a better testing pattern? Share it!
3. **Add Examples**: More real-world examples are always welcome.
4. **Update Dependencies**: Keep tool configurations current.

## 📝 Changelog

### Latest Updates
- **Framework Coverage**: Complete guides for React, Vue, Angular, and Svelte
- **Modern Tools**: Updated configurations for Jest, Vitest, Playwright, and Cypress
- **Pattern Library**: Comprehensive patterns for unit, integration, E2E, and performance testing
- **TypeScript Support**: Full TypeScript examples and configurations
- **Performance Focus**: Advanced performance testing strategies
- **Accessibility Integration**: Built-in accessibility testing patterns

---

## 🔗 Quick Links

### Framework Guides
- [React Testing Guide →](./frameworks/react/)
- [Vue Testing Guide →](./frameworks/vue/)
- [Angular Testing Guide →](./frameworks/angular/)
- [Svelte Testing Guide →](./frameworks/svelte/)

### Universal Patterns
- [Unit Testing Patterns →](./patterns/unit-testing.md)
- [Integration Testing Patterns →](./patterns/integration-testing.md)
- [E2E Testing Patterns →](./patterns/e2e-testing.md)
- [Performance Testing Patterns →](./patterns/performance-testing.md)

### Tool Configurations
- [Jest Configuration →](./tools/jest-config.md)
- [Vitest Configuration →](./tools/vitest-config.md)
- [Playwright Configuration →](./tools/playwright-config.md)
- [Cypress Configuration →](./tools/cypress-config.md)

### Core Concepts
- [Testing Principles →](./common/testing-principles.md)
- [Best Practices →](./common/best-practices.md)

---

*Happy Testing! 🚀*