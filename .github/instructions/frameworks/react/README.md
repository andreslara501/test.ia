# React Testing Guide - Pragmatic Implementation Strategy

Welcome to the React testing documentation. This guide focuses on **pragmatic testing strategies** for existing React projects with minimal or no test coverage.

## 🎯 Core Philosophy

**Test Existing Code, Don't Build New Features**: Focus on creating comprehensive tests for your existing React components and functionality rather than adding new features.

## 📋 Pre-Implementation Checklist

### CRITICAL: Project Analysis Phase

Before writing ANY tests, complete these steps:

1. **📊 Codebase Inventory**
   ```bash
   # Scan your React project structure
   find src -name "*.tsx" -o -name "*.jsx" | head -20
   find src/components -name "*.tsx" | wc -l
   find src/hooks -name "*.ts" | wc -l
   find src -name "*.test.*" | wc -l  # Check existing tests
   ```

2. **🔍 Component Mapping**
   - Identify all existing components (functional vs class components)
   - Map props interfaces and their actual property names
   - Document custom hooks and their return values
   - List all context providers and their values
   - Identify state management patterns (useState, useReducer, external state)

3. **🏗️ Architecture Understanding**
   - Component hierarchy and data flow
   - Custom hooks usage patterns
   - Form field naming conventions
   - Route structure (if using React Router)
   - Context API usage
   - State management libraries (Redux, Zustand, etc.)

4. **⚠️ Common Pitfall Prevention**
   - Props name mismatches (check actual prop names in components)
   - Missing context providers in tests
   - Async operations not properly awaited
   - Event handling expectations vs implementation
   - Custom hooks dependency arrays
   - Mocking external dependencies incorrectly

## Quick Start - Incremental Approach

### Phase 1: Foundation Setup (Week 1)

#### Target: 3-5 Critical Tests
Focus on the most business-critical components:

```typescript
// Priority Order (adapt to your business domain):
// 1. Main App component and core layout
// 2. Authentication/user management components
// 3. Primary business components (forms, lists, details)
// 4. Navigation and routing components
// 5. Custom hooks with business logic
```

#### Test Configuration Validation
```bash
# Verify test environment works
npm test -- --watchAll=false
# or
yarn test --watchAll=false
```

### Phase 2: Custom Hooks (Week 2)

#### Target: Custom Hooks Testing
```typescript
// Focus on your existing custom hooks:
- Data fetching hooks (useUserData, useApiCall)
- State management hooks (useCounter, useToggle)
- Form handling hooks
- Local storage or browser API hooks
```

### Phase 3: Component Integration (Week 3-4)

#### Target: Component + Hooks Integration
```typescript
// Test realistic user scenarios:
- Form submission flows
- Data loading and error states
- User interactions and state changes
- Navigation patterns
```

## 🛠️ Implementation Strategy

### Critical Success Factors

1. **Always Analyze First** - Read existing components/hooks before writing tests
2. **Start Small** - 3-5 working tests beats 50 broken ones
3. **Include Dependencies** - Mock external APIs, provide context values
4. **Use Real Data** - Actual prop names, realistic test data
5. **Test User Behavior** - Focus on what users see and do
6. **Verify Constantly** - Run tests after each change

## Test Utilities Setup

### Custom Render Function
Create `src/test-utils.tsx`:
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock providers for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Navigation
- [Component Testing](./component-testing.md) - Testing React components
- [Hooks Testing](./hooks-testing.md) - Testing custom hooks
- [Integration Testing](./integration.md) - Testing component interactions
- [Mocking Strategies](./mocking.md) - Mocking patterns for React

## Common Patterns

### Basic Component Test
```typescript
import { render, screen } from '../test-utils';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
});
```

### Testing Props
```typescript
test('WHEN disabled prop is true THEN button should be disabled', () => {
  render(<Button disabled>Click me</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

## Robust Querying Strategies

- **Prefer semantic queries**: Use [getByRole](http://_vscodecontentref_/4), `getByLabelText`, and similar queries for elements.
- **Handle split text**: If text is split across elements (e.g., `<p>Edit <code>src/App.tsx</code> and save</p>`), use a function matcher or [getAllByText](http://_vscodecontentref_/5):
  ```js
  expect(
    screen.getAllByText((content, element) =>
      element.textContent?.replace(/\s+/g, ' ').includes('Edit src/App.tsx and save to test HMR')
    ).length
  ).toBeGreaterThan(0);

### Testing Events
```typescript
import userEvent from '@testing-library/user-event';

test('WHEN button is clicked THEN should call onClick handler', async () => {
  const handleClick = jest.fn();
  const user = userEvent.setup();
  
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await user.click(screen.getByRole('button'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Related Resources
- [Testing Principles](../../common/testing-principles.md)
- [Best Practices](../../common/best-practices.md)
- [Jest Configuration](../../tools/jest-config.md)