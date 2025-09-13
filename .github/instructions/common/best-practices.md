# Best Practices for Frontend Testing

This document outlines universal best practices that apply across all frontend frameworks and testing tools.

## Code Organization

### Test File Structure
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── Form/
│       ├── Form.tsx
│       ├── Form.test.tsx
│       └── index.ts
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts
└── __tests__/
    ├── setup.ts
    └── test-utils.ts
```

### Test File Naming
- **Unit Tests**: `Component.test.tsx` or `utils.test.ts`
- **Integration Tests**: `Feature.integration.test.tsx`
- **E2E Tests**: `user-workflow.e2e.test.ts`

## Test Structure and Naming

### Descriptive Test Names
```typescript
// ✅ Good: Describes scenario and outcome
test('WHEN user enters invalid email THEN should show validation error', () => {});

// ❌ Bad: Vague and unhelpful
test('validates email', () => {});
```

### Test Organization
```typescript
describe('GIVEN LoginForm component', () => {
  describe('WHEN user submits form', () => {
    test('THEN should call onSubmit with form data', () => {});
    test('THEN should show loading state', () => {});
  });

  describe('WHEN validation fails', () => {
    test('THEN should show error messages', () => {});
    test('THEN should not call onSubmit', () => {});
  });
});
```

## Setup and Teardown

### Test Environment Setup
```typescript
// setupTests.ts
import '@testing-library/jest-dom';

// Global test configuration
beforeEach(() => {
  // Clear mocks
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Clear localStorage/sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});
```

### Test Utilities
```typescript
// test-utils.ts
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders>{children}</TestProviders>
    ),
    ...options,
  });
};

export * from '@testing-library/react';
export { customRender as render };
```

## Test Data Management

### Test Data Factories
```typescript
// factories/userFactory.ts
export const createUser = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  ...overrides,
});

// Usage in tests
const adminUser = createUser({ role: 'admin' });
const userWithoutEmail = createUser({ email: null });
```

### Fixtures and Mock Data
```typescript
// fixtures/apiResponses.ts
export const mockApiResponses = {
  users: {
    success: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ],
    empty: [],
    error: { message: 'Server error' },
  },
};
```

## Mocking Strategies

### External Dependencies
```typescript
// Mock API calls
jest.mock('../api/userService', () => ({
  fetchUsers: jest.fn(),
  createUser: jest.fn(),
}));

// Mock external libraries
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));
```

### Time and Dates
```typescript
describe('GIVEN time-dependent component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });
});
```

## Async Testing Patterns

### Waiting for Elements
```typescript
// Wait for element to appear
const submitButton = await screen.findByRole('button', { name: /submit/i });

// Wait for element to disappear
await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

// Wait for condition
await waitFor(() => {
  expect(mockFunction).toHaveBeenCalled();
});
```

### Testing Async Operations
```typescript
test('WHEN data loads THEN should display content', async () => {
  // Arrange
  const mockData = [{ id: 1, name: 'Test' }];
  mockFetchUsers.mockResolvedValue(mockData);

  // Act
  render(<UserList />);

  // Assert
  expect(await screen.findByText('Test')).toBeInTheDocument();
});
```

## Error Handling Testing

### Testing Error States
```typescript
test('WHEN API fails THEN should show error message', async () => {
  // Arrange
  mockFetchUsers.mockRejectedValue(new Error('API Error'));

  // Act
  render(<UserList />);

  // Assert
  expect(await screen.findByText(/error loading users/i)).toBeInTheDocument();
});
```

### Testing Error Boundaries
```typescript
test('WHEN child component throws THEN error boundary should catch', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## Accessibility Testing

### Screen Reader Testing
```typescript
test('WHEN form has errors THEN should announce to screen readers', () => {
  render(<Form />);
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
});
```

### Keyboard Navigation
```typescript
test('WHEN user navigates with keyboard THEN should be accessible', () => {
  render(<Navigation />);
  
  const firstLink = screen.getByRole('link', { name: /home/i });
  firstLink.focus();
  
  fireEvent.keyDown(firstLink, { key: 'Tab' });
  
  expect(screen.getByRole('link', { name: /about/i })).toHaveFocus();
});
```

## Performance Testing

### Component Rendering Performance
```typescript
test('WHEN component renders THEN should not cause performance issues', () => {
  const start = performance.now();
  
  render(<LargeDataTable data={largeDataset} />);
  
  const end = performance.now();
  expect(end - start).toBeLessThan(100); // Less than 100ms
});
```

### Memory Leak Testing
```typescript
test('WHEN component unmounts THEN should clean up resources', () => {
  const { unmount } = render(<ComponentWithSubscriptions />);
  
  // Verify subscriptions are created
  expect(mockSubscribe).toHaveBeenCalled();
  
  unmount();
  
  // Verify cleanup
  expect(mockUnsubscribe).toHaveBeenCalled();
});
```

## Common Anti-patterns

### ❌ Don't Test Implementation Details
```typescript
// Bad: Testing internal state
expect(component.state.isLoading).toBe(true);

// Good: Testing user-visible behavior
expect(screen.getByText(/loading/i)).toBeInTheDocument();
```

### ❌ Don't Over-Mock
```typescript
// Bad: Mocking everything
jest.mock('./Button', () => () => <div>Mocked Button</div>);

// Good: Test real integrations
render(<Form><Button>Submit</Button></Form>);
```

### ❌ Don't Write Brittle Tests
```typescript
// Bad: Relying on specific DOM structure
expect(container.firstChild.firstChild).toHaveClass('button');

// Good: Testing semantics
expect(screen.getByRole('button')).toBeInTheDocument();
```

## CI/CD Integration

### Test Commands
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Coverage Configuration
```json
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/index.tsx",
      "!src/reportWebVitals.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Performance and Optimization

### Test Performance
- Keep tests fast (< 50ms per test for unit tests)
- Use `test.only` and `test.skip` for debugging
- Run tests in parallel when possible
- Avoid unnecessary setup in beforeEach

### Memory Management
- Clean up after tests (clear mocks, reset DOM)
- Avoid memory leaks in test utilities
- Use weak references for caching when appropriate

## Documentation and Maintenance

### Test Documentation
```typescript
/**
 * Tests the UserForm component behavior:
 * - Form validation and error handling
 * - Successful form submission
 * - Loading states during API calls
 */
describe('GIVEN UserForm component', () => {
  // Tests...
});
```

### Regular Maintenance
- Review and update test utilities regularly
- Remove obsolete tests when features are removed
- Refactor tests when component APIs change
- Keep test dependencies up to date

## Related Resources
- [Testing Principles](./testing-principles.md)
- [Setup Patterns](./setup-patterns.md)
- [Framework-Specific Guides](../frameworks/)
- [Testing Patterns](../patterns/)