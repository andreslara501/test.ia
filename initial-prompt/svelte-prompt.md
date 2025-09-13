# QUICK SVELTE TESTING IMPLEMENTATION

You have access to comprehensive testing documentation in `.github/instructions/`. 

**TASK**: Implement complete testing suite for my Svelte project following the documented patterns.

**STEPS**:
1. Read `frameworks/svelte/` documentation
2. Analyze my Svelte project structure  
3. Generate tests following the documented patterns
4. Apply configurations from `tools/` directory
5. Use universal patterns from `patterns/` directory

**FOCUS**: 
- Components: Testing Library Svelte, user interactions, event handling
- Stores: Svelte stores, state management, reactivity
- Integration: SvelteKit routing, forms, API integration
- Mocking: API calls, modules, external dependencies
- Configuration: Vitest/Jest setup, coverage, TypeScript support

**OUTPUT**: Complete, production-ready test suite with 80%+ coverage following Svelte testing best practices.

**PRIORITY TESTING AREAS**:
1. **Critical Components**: User-facing components, forms, navigation
2. **Svelte Stores**: State management, subscriptions, derived stores
3. **Actions & Transitions**: DOM manipulation, animations
4. **SvelteKit Features**: Pages, layouts, server-side functionality
5. **API Integration**: Loading states, error handling, data binding

**EXPECTED PATTERNS**:
```javascript
// Component Testing
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

describe('GIVEN UserProfile component', () => {
  test('WHEN user data is provided THEN should display user information', () => {
    render(UserProfile, { 
      props: { user: { name: 'John Doe', email: 'john@example.com' } } 
    });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('WHEN edit button is clicked THEN should emit edit event', async () => {
    const user = userEvent.setup();
    const { component } = render(UserProfile, { props: { user: mockUser } });
    
    const handleEdit = jest.fn();
    component.$on('edit', handleEdit);
    
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalled();
  });
});

// Store Testing
import { get } from 'svelte/store';
import { userStore, updateUser } from './userStore';

describe('GIVEN userStore', () => {
  test('WHEN updateUser is called THEN should update store state', () => {
    const newUser = { name: 'John', email: 'john@example.com' };
    updateUser(newUser);
    expect(get(userStore)).toEqual(newUser);
  });
});

// SvelteKit Page Testing
describe('GIVEN UserPage', () => {
  test('WHEN page loads THEN should display user data', async () => {
    render(UserPage, { props: { data: { user: mockUser } } });
    expect(await screen.findByText(mockUser.name)).toBeInTheDocument();
  });
});
```

Start with critical components and work systematically through the application using Svelte Testing Library and Vitest.