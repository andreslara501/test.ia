# Core Testing Principles

These principles apply to all frontend frameworks and form the foundation of effective testing strategies.

## 1. Test from the User's Perspective

### Philosophy
- **Focus on behavior, not implementation details**
- Write tests that resemble how users interact with your application
- Avoid testing internal component state or methods directly

### Practical Guidelines
- Use semantic queries (getByRole, getByLabelText) over implementation-specific selectors
- Test user workflows rather than isolated functions
- Simulate real user interactions (clicking, typing, navigating)
- Assert on what users see and experience

### Anti-patterns to Avoid
- ❌ Testing component internal state directly
- ❌ Testing implementation details (class methods, private functions)
- ❌ Over-mocking components and dependencies
- ❌ Testing framework-specific internals

## 2. Confidence Over Coverage

### Philosophy
- **Prioritize tests that give you confidence in critical user flows**
- Target realistic scenarios and edge cases
- Maintain test quality over achieving 100% coverage

### Coverage Strategy
- **Critical Path**: 100% coverage for core business logic
- **User Flows**: Complete coverage for main user journeys
- **Edge Cases**: Focus on error scenarios and boundary conditions
- **Nice-to-Have**: Lower priority for utility functions and helpers

### Quality Metrics
- Tests should catch real bugs, not just increase coverage numbers
- Each test should verify meaningful application behavior
- Flaky or brittle tests reduce confidence and should be fixed or removed

## 3. Maintainable Test Architecture

### Structure Principles
- **Keep tests simple and focused** on one behavior per test
- Use descriptive test names following GIVEN/WHEN/THEN structure
- Structure tests for easy maintenance and debugging

### Test Organization
```
describe('GIVEN [component/feature/context]', () => {
  test('WHEN [action/condition] THEN [expected outcome]', () => {
    // Arrange: Setup test data and environment
    // Act: Perform the action being tested
    // Assert: Verify the expected outcome
  });
});
```

### Maintainability Guidelines
- **DRY Principle**: Extract common setup into helpers and utilities
- **Single Responsibility**: Each test should verify one specific behavior
- **Clear Naming**: Test names should describe the scenario and expected outcome
- **Isolated Tests**: Tests should not depend on each other or external state

## 4. Test Categories and Strategy

### Unit Tests
- **Purpose**: Test individual functions, components, or modules in isolation
- **Speed**: Fast execution (milliseconds)
- **Scope**: Single unit of code
- **Dependencies**: Mock external dependencies

### Integration Tests
- **Purpose**: Test how multiple units work together
- **Speed**: Moderate execution (seconds)
- **Scope**: Multiple components or modules
- **Dependencies**: Real implementations where possible

### End-to-End Tests
- **Purpose**: Test complete user workflows
- **Speed**: Slow execution (minutes)
- **Scope**: Full application stack
- **Dependencies**: Real services and databases

## 5. Testing Pyramid Strategy

```
        /\
       /  \
      / E2E \     ← Few, slow, high confidence
     /______\
    /        \
   /Integration\ ← Some, moderate speed
  /__________\
 /            \
/  Unit Tests  \ ← Many, fast, focused
/______________\
```

### Distribution Guidelines
- **70% Unit Tests**: Fast, focused, isolated
- **20% Integration Tests**: Moderate scope, real interactions
- **10% E2E Tests**: Critical user journeys only

## 6. Common Testing Patterns

### AAA Pattern (Arrange-Act-Assert)
```typescript
test('WHEN user clicks submit THEN form should be submitted', () => {
  // Arrange: Setup
  const mockSubmit = jest.fn();
  render(<Form onSubmit={mockSubmit} />);
  
  // Act: User interaction
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  // Assert: Verify outcome
  expect(mockSubmit).toHaveBeenCalledTimes(1);
});
```

### Test Data Management
- Use factories or builders for test data creation
- Keep test data minimal and focused
- Use descriptive data that makes test intent clear

### Error Handling Testing
- Test both happy path and error scenarios
- Verify error messages and user feedback
- Test error recovery and fallback behaviors

## 7. Best Practices Summary

### ✅ Do
- Write tests that would catch real bugs
- Test user-visible behavior and outcomes
- Keep tests simple and readable
- Run tests frequently during development
- Fix flaky tests immediately

### ❌ Don't
- Test implementation details
- Write tests just to increase coverage
- Create overly complex test setups
- Ignore failing or flaky tests
- Test framework internals

## Related Resources
- [Best Practices](./best-practices.md)
- [Setup Patterns](./setup-patterns.md)
- [Framework-Specific Guides](../frameworks/)