# QUICK REACT TESTING IMPLEMENTATION

You have access to comprehensive testing documentation in `.github/instructions/`. 

**TASK**: Implement complete testing suite for my React project following the documented patterns.

**STEPS**:
1. Read `frameworks/react/` documentation
2. Analyze my React project structure  
3. Generate tests following the documented patterns
4. Apply configurations from `tools/` directory
5. Use universal patterns from `patterns/` directory

**FOCUS**: 
- Components: React Testing Library, user interactions, async operations
- Hooks: Custom hooks testing, state management, side effects
- Integration: React Router, Context API, forms, API integration
- Mocking: API calls, modules, external dependencies
- Configuration: Jest/Vitest setup, coverage, TypeScript support

**OUTPUT**: Complete, production-ready test suite with 80%+ coverage following React Testing Library best practices.

**PRIORITY TESTING AREAS**:
1. **Critical User Flows**: Authentication, main navigation, core features
2. **Custom Hooks**: Business logic, data fetching, state management
3. **Form Components**: Validation, submission, error handling
4. **API Integration**: Loading states, error handling, data transformation
5. **Context Providers**: State management, authentication context

**EXPECTED PATTERNS**:
```javascript
// Component Testing
describe('GIVEN UserProfile component', () => {
  test('WHEN user data loads THEN should display user information', async () => {
    render(<UserProfile userId="123" />);
    expect(await screen.findByText(/john doe/i)).toBeInTheDocument();
  });
});

// Hook Testing
describe('GIVEN useUserData hook', () => {
  test('WHEN called with user ID THEN should fetch and return user data', async () => {
    const { result } = renderHook(() => useUserData('123'));
    await waitFor(() => expect(result.current.data).toBeDefined());
  });
});
```

Start with critical components and work systematically through the application using React Testing Library principles.