# QUICK VUE TESTING IMPLEMENTATION

You have access to comprehensive testing documentation in `.github/instructions/`. 

**TASK**: Implement complete testing suite for my Vue project following the documented patterns.

**STEPS**:
1. Read `frameworks/vue/` documentation
2. Analyze my Vue project structure  
3. Generate tests following the documented patterns
4. Apply configurations from `tools/` directory
5. Use universal patterns from `patterns/` directory

**FOCUS**: 
- Components: Vue Test Utils, template testing, prop/event testing
- Composables: Composition API, reactivity, lifecycle testing
- Integration: Vue Router, Pinia/Vuex, forms, API integration
- Mocking: API calls, plugins, external dependencies
- Configuration: Vitest/Jest setup, coverage, TypeScript support

**OUTPUT**: Complete, production-ready test suite with 80%+ coverage following Vue Test Utils and modern Vue testing practices.

**PRIORITY TESTING AREAS**:
1. **Critical Components**: User-facing components, forms, navigation
2. **Composables**: Business logic, data fetching, state management
3. **Store Testing**: Pinia stores, state mutations, actions
4. **Router Integration**: Navigation, guards, route parameters
5. **API Integration**: Loading states, error handling, data transformation

**EXPECTED PATTERNS**:
```javascript
// Component Testing (Vue Test Utils - Official Recommendation)
describe('GIVEN UserProfile component', () => {
  test('WHEN user prop is provided THEN should display user information', () => {
    const wrapper = mount(UserProfile, {
      props: { user: { name: 'John Doe', email: 'john@example.com' } }
    });
    expect(wrapper.text()).toContain('John Doe');
  });
});

// Composable Testing
describe('GIVEN useUserData composable', () => {
  test('WHEN called with user ID THEN should fetch and return user data', () => {
    const { user, loading } = useUserData('123');
    expect(loading.value).toBe(true);
  });
});

// Pinia Store Testing
describe('GIVEN userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  
  test('WHEN login action is called THEN should update user state', () => {
    const store = useUserStore();
    store.login({ name: 'John', email: 'john@example.com' });
    expect(store.user.name).toBe('John');
  });
});
```

Start with critical components and work systematically through the application using Vue Test Utils and Vitest.