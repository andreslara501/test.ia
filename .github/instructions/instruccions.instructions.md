# Testing Documentation Migration Notice

⚠️ **IMPORTANT: This documentation has been refactored and moved to a modular structure.**

## 🆕 New Documentation Structure

This single-file documentation has been replaced with a comprehensive, modular testing guide. Please use the new structure for all testing needs:

### 📍 New Location
All testing documentation is now located in the modular structure at:
- **Main Guide**: [README.md](./README.md)
- **Framework-Specific**: [./frameworks/](./frameworks/)
- **Universal Patterns**: [./patterns/](./patterns/)
- **Tool Configurations**: [./tools/](./tools/)

### 🚀 Quick Navigation

#### By Framework
- **[React →](./frameworks/react/)** - Testing Library, Jest/Vitest, hooks, components
- **[Vue →](./frameworks/vue/)** - Vue Test Utils, Vitest/Jest, Composition API, Pinia  
- **[Angular →](./frameworks/angular/)** - TestBed, Jasmine/Jest, services, components
- **[Svelte →](./frameworks/svelte/)** - Testing Library, Vitest/Jest, stores, components

#### By Testing Type
- **[Unit Testing →](./patterns/unit-testing.md)** - Functions, classes, components
- **[Integration Testing →](./patterns/integration-testing.md)** - Services, APIs, components
- **[E2E Testing →](./patterns/e2e-testing.md)** - User workflows, cross-browser
- **[Performance Testing →](./patterns/performance-testing.md)** - Load, stress, memory

#### By Tool
- **[Jest Configuration →](./tools/jest-config.md)** - Setup, TypeScript, coverage
- **[Vitest Configuration →](./tools/vitest-config.md)** - Vite integration, ESM support
- **[Playwright Configuration →](./tools/playwright-config.md)** - Cross-browser E2E testing
- **[Cypress Configuration →](./tools/cypress-config.md)** - Component and E2E testing

### ✨ Benefits of the New Structure

1. **Framework-Specific Guides**: Dedicated documentation for React, Vue, Angular, and Svelte
2. **Modular Architecture**: Smaller, focused files that are easier to maintain and navigate
3. **Universal Patterns**: Framework-agnostic testing strategies you can apply anywhere
4. **Tool Configurations**: Complete setup guides for Jest, Vitest, Playwright, and Cypress
5. **Better Organization**: Clear separation between concepts, frameworks, and tools
6. **Improved Maintainability**: Easier to update, extend, and keep current

### 🔄 Migration Path

1. **Stop using this file** for new testing implementations
2. **Navigate to the new structure** using the links above
3. **Choose your framework** from the frameworks directory
4. **Follow the setup guides** in your chosen framework documentation
5. **Apply universal patterns** from the patterns directory as needed

### 📚 What's in the New Documentation

- **Complete Framework Coverage**: Comprehensive guides for all major frontend frameworks
- **Modern Testing Tools**: Updated configurations for latest testing tools and libraries
- **Real-World Examples**: Practical, copy-paste examples for common testing scenarios
- **Performance Testing**: Advanced performance testing strategies and configurations
- **Accessibility Testing**: Built-in accessibility testing patterns and examples
- **TypeScript Support**: Full TypeScript examples and configurations throughout

---

## 🗂️ Legacy Content (Deprecated)

The content below is preserved for reference but is **no longer maintained**. Please use the new modular documentation structure above.

---

## Core Testing Principles

### 1. Test from the User's Perspective
- Focus on testing behavior, not implementation details
- Write tests that resemble how users interact with your application
- Avoid testing internal component state or methods directly

### 2. Confidence Over Coverage
- Prioritize tests that give you confidence in critical user flows
- Target realistic scenarios and edge cases
- Maintain test quality over achieving 100% coverage

### 3. Maintainable Test Architecture
- Keep tests simple and focused on one behavior per test
- Use descriptive test names following GIVEN/WHEN/THEN structure
- Structure tests for easy maintenance and debugging

## {{FRAMEWORK || React}} Testing Library Setup

### Required Dependencies

{{#if (eq FRAMEWORK "React")}}
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
{{else if (eq FRAMEWORK "Vue")}}
```bash
# Official Vue.js testing setup with Vitest (Recommended)
npm install -D vitest happy-dom @testing-library/vue @testing-library/jest-dom @testing-library/user-event

# Vue Test Utils (Official Vue testing utility)
npm install -D @vue/test-utils

# For Pinia testing (if using Pinia for state management)
npm install -D pinia

# Alternative: Jest setup (if migrating from existing Jest setup)
npm install -D jest @vue/test-utils @testing-library/vue @testing-library/jest-dom @testing-library/user-event
```

#### Vue Testing Configuration

**Vitest Configuration (Recommended by Vue.js):**
Create or update `vite.config.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}`:
```{{LANGUAGE === "TypeScript" ? "typescript" : "javascript"}}
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    // enable jest-like global test APIs
    globals: true,
    // simulate DOM with happy-dom
    // (requires installing happy-dom as a peer dependency)
    environment: 'happy-dom'
  }
});
```

**TypeScript Configuration (if using TypeScript):**
Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```
{{else if (eq FRAMEWORK "Angular")}}
```bash
# Core Angular testing dependencies
npm install --save-dev @angular/testing @testing-library/angular @testing-library/jest-dom @testing-library/user-event

# Jest configuration for Angular
npm install --save-dev jest jest-preset-angular @types/jest

# Additional testing utilities
npm install --save-dev @angular/cdk/testing @angular/material/testing
```

#### Angular Testing Setup Files

Create `tsconfig.spec.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["jest", "node"]
  },
  "files": ["src/test.ts", "src/polyfills.ts"],
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

Create `src/test.ts`:
```typescript
import 'zone.js/dist/zone-testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// Initialize the Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
```
{{else if (eq FRAMEWORK "Svelte")}}
```bash
# Official Svelte testing setup with Vitest (Recommended)
npm install -D vitest jsdom @testing-library/svelte @testing-library/jest-dom @testing-library/user-event

# Alternative: Setup using Svelte CLI
npx sv add vitest

# For testing Svelte stores and state management
npm install -D @testing-library/svelte

# Alternative: Jest setup (if needed)
npm install -D jest @testing-library/svelte @testing-library/jest-dom @testing-library/user-event
```

#### Svelte Testing Configuration

**Vitest Configuration (Recommended by Svelte.dev):**
Create or update `vite.config.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}`:
```{{LANGUAGE === "TypeScript" ? "typescript" : "javascript"}}
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    // If you are testing components client-side, you need a DOM environment
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}']
  },
  // Tell Vitest to use the `browser` entry points in `package.json` files
  resolve: process.env.VITEST
    ? {
        conditions: ['browser']
      }
    : undefined
});
```
{{else}}
```bash
npm install --save-dev {{TESTING_LIBRARY || @testing-library/react}} @testing-library/jest-dom @testing-library/user-event
```
{{/if}}

### Test Setup Configuration

Create or update `setupTests.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}`:

{{#if (eq LANGUAGE "TypeScript")}}
```typescript
import '@testing-library/jest-dom';

// Clean up after each test
afterEach(() => {
  // Clear any mocks
  jest.clearAllMocks();
});
```
{{else}}
```javascript
import '@testing-library/jest-dom';

// Clean up after each test
afterEach(() => {
  // Clear any mocks
  jest.clearAllMocks();
});
```
{{/if}}

### {{TEST_FRAMEWORK || Jest}} Configuration (`{{TEST_FRAMEWORK === "Vitest" ? "vitest" : "jest"}}.config.{{LANGUAGE === "TypeScript" ? "ts" : "cjs"}}`)

{{#if (eq TEST_FRAMEWORK "Vitest")}}
```{{LANGUAGE === "TypeScript" ? "typescript" : "javascript"}}
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setupTests.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```
{{else if (eq FRAMEWORK "Angular")}}
```{{LANGUAGE === "TypeScript" ? "typescript" : "javascript"}}
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setupTests.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
  },
  collectCoverageFrom: [
    'src/app/**/*.{ts,js}',
    '!src/app/**/*.module.ts',
    '!src/app/**/*.interface.ts',
    '!src/app/**/*.model.ts',
    '!src/app/**/*.enum.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.d.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
    '!src/environments/**',
  ],
  coverageReporters: ['html', 'text-summary', 'lcov'],
  coverageDirectory: 'coverage',
  testMatch: [
    '<rootDir>/src/app/**/*.spec.ts',
    '<rootDir>/src/app/**/*.test.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@angular|@ngrx|ngx-))'
  ]
};
```
{{else}}
```{{LANGUAGE === "TypeScript" ? "typescript" : "javascript"}}
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.{{LANGUAGE === "TypeScript" ? "ts" : "js"}}'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{{LANGUAGE === "TypeScript" ? "tsx" : "jsx"}}',
    '!src/main.{{LANGUAGE === "TypeScript" ? "tsx" : "jsx"}}'
  ]
};
```
{{/if}}

## Project Structure for Testing

### Recommended File Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── __mocks__/
│   │       └── Button.tsx
│   └── UserProfile/
│       ├── UserProfile.tsx
│       ├── UserProfile.test.tsx
│       └── __mocks__/
│           └── UserProfile.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   └── __mocks__/
│       └── useAuth.ts
├── utils/
│   ├── api.ts
│   ├── api.test.ts
│   └── __mocks__/
│       └── api.ts
├── __tests__/
│   ├── integration/
│   └── helpers/
│       ├── test-utils.tsx
│       └── mockData.ts
└── __mocks__/
    ├── fileMock.js
    └── react-router-dom.js
```

### Test File Naming Conventions

{{#if (eq LANGUAGE "TypeScript")}}
- **Unit Tests**: `ComponentName.test.tsx`
- **Integration Tests**: `ComponentName.integration.test.tsx`
- **Hook Tests**: `useHookName.test.ts`
- **Utility Tests**: `utilityName.test.ts`
{{else}}
- **Unit Tests**: `ComponentName.test.jsx`
- **Integration Tests**: `ComponentName.integration.test.jsx`
- **Hook Tests**: `useHookName.test.js`
- **Utility Tests**: `utilityName.test.js`
{{/if}}

## Testing Patterns and Best Practices

## Testing Patterns and Best Practices

### AAA Pattern (Arrange-Act-Assert)

Structure every test using the AAA pattern for clarity and consistency:

```typescript
describe('GIVEN LoginForm component', () => {
  test('WHEN user submits valid credentials THEN should call onLogin', async () => {
    // Arrange
    const mockOnLogin = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm onLogin={mockOnLogin} />);
    
    // Act
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
    expect(mockOnLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123'
    });
  });
});
```

### Custom Render Function

Create a reusable render function for components that need providers:

```{{LANGUAGE === "TypeScript" ? "typescript" : "javascript"}}
// test-utils.{{LANGUAGE === "TypeScript" ? "tsx" : "jsx"}}
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
{{#if (eq LANGUAGE "TypeScript")}}
import { ReactElement } from 'react';
{{/if}}

const AllTheProviders = ({ children }{{#if (eq LANGUAGE "TypeScript")}}: { children: React.ReactNode }{{/if}}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui{{#if (eq LANGUAGE "TypeScript")}}: ReactElement{{/if}},
  options{{#if (eq LANGUAGE "TypeScript")}}?: Omit<RenderOptions, 'wrapper'>{{/if}}
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Component Testing Examples

#### Basic Component Test

{{#if (eq FRAMEWORK "React")}}
```typescript
// Button.test.tsx
import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('GIVEN Button component', () => {
  test('WHEN clicked THEN should call onClick handler', async () => {
    // Arrange
    const handleClick = jest.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    // Act
    await user.click(screen.getByRole('button', { name: /click me/i }));
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('WHEN disabled THEN should not be clickable', () => {
    // Arrange
    render(<Button disabled>Click me</Button>);
    
    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```
{{else if (eq FRAMEWORK "Vue")}}
```typescript
// Button.test.ts
import { mount } from '@vue/test-utils';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import Button from './Button.vue';

describe('GIVEN Button component', () => {
  test('WHEN clicked THEN should emit click event', async () => {
    // Arrange - Vue Test Utils approach (Official Vue.js recommendation)
    const wrapper = mount(Button, {
      props: { disabled: false },
      slots: { default: 'Click me' }
    });
    
    // Act
    await wrapper.trigger('click');
    
    // Assert
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  test('WHEN clicked THEN should emit click event (Testing Library approach)', async () => {
    // Arrange - Testing Library approach (Alternative)
    const user = userEvent.setup();
    const { emitted } = render(Button, {
      props: { disabled: false },
      slots: { default: 'Click me' }
    });
    
    // Act
    await user.click(screen.getByRole('button', { name: /click me/i }));
    
    // Assert
    expect(emitted().click).toHaveLength(1);
  });

  test('WHEN disabled THEN should not be clickable', () => {
    // Arrange
    render(Button, {
      props: { disabled: true },
      slots: { default: 'Click me' }
    });
    
    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```
{{else if (eq FRAMEWORK "Angular")}}
```typescript
// button.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ButtonComponent } from './button.component';

describe('GIVEN ButtonComponent', () => {
  test('WHEN clicked THEN should emit click event', async () => {
    // Arrange
    const user = userEvent.setup();
    const clickSpy = jest.fn();
    
    await render(ButtonComponent, {
      componentProperties: {
        disabled: false,
        click: { emit: clickSpy } as any
      }
    });
    
    // Act
    await user.click(screen.getByRole('button'));
    
    // Assert
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test('WHEN disabled THEN should not be clickable', async () => {
    // Arrange
    await render(ButtonComponent, {
      componentProperties: { disabled: true }
    });
    
    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```
{{else if (eq FRAMEWORK "Svelte")}}
```typescript
// Button.test.ts
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './Button.svelte';

describe('GIVEN Button component', () => {
  test('WHEN clicked THEN should dispatch click event', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleClick = jest.fn();
    const { component } = render(Button, {
      props: { disabled: false }
    });
    
    component.$on('click', handleClick);
    
    // Act
    await user.click(screen.getByRole('button'));
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('WHEN disabled THEN should not be clickable', () => {
    // Arrange
    render(Button, {
      props: { disabled: true }
    });
    
    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```
{{/if}}

#### Form Component Test

{{#if (eq FRAMEWORK "React")}}
```typescript
// ContactForm.test.tsx
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';

describe('GIVEN ContactForm component', () => {
  test('WHEN submitting valid form THEN should call onSubmit with form data', async () => {
    // Arrange
    const mockOnSubmit = jest.fn();
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    // Act
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      });
    });
  });
});
```
{{else if (eq FRAMEWORK "Vue")}}
```typescript
// ContactForm.test.ts
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm.vue';

describe('GIVEN ContactForm component', () => {
  test('WHEN submitting valid form THEN should emit submit event with form data', async () => {
    // Arrange
    const user = userEvent.setup();
    const { emitted } = render(ContactForm);
    
    // Act
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert
    await waitFor(() => {
      expect(emitted().submit[0]).toEqual([{
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      }]);
    });
  });
});
```
{{else if (eq FRAMEWORK "Angular")}}
```typescript
// contact-form.component.spec.ts
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ContactFormComponent } from './contact-form.component';
import { ReactiveFormsModule } from '@angular/forms';

describe('GIVEN ContactFormComponent', () => {
  test('WHEN submitting valid form THEN should emit submitForm event', async () => {
    // Arrange
    const user = userEvent.setup();
    const submitSpy = jest.fn();
    
    await render(ContactFormComponent, {
      imports: [ReactiveFormsModule],
      componentProperties: {
        submitForm: { emit: submitSpy } as any
      }
    });
    
    // Act
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert
    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      });
    });
  });
});
```
{{else if (eq FRAMEWORK "Svelte")}}
```typescript
// ContactForm.test.ts
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm.svelte';

describe('GIVEN ContactForm component', () => {
  test('WHEN submitting valid form THEN should dispatch submit event', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    const { component } = render(ContactForm);
    
    component.$on('submit', handleSubmit);
    
    // Act
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Hello world'
          }
        })
      );
    });
  });
});
```
{{/if}}

### Hook Testing

{{#if (eq FRAMEWORK "React")}}
```typescript
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('GIVEN useCounter hook', () => {
  test('WHEN initialized THEN should start with count 0', () => {
    // Arrange & Act
    const { result } = renderHook(() => useCounter());
    
    // Assert
    expect(result.current.count).toBe(0);
  });

  test('WHEN increment is called THEN should increase count by 1', () => {
    // Arrange
    const { result } = renderHook(() => useCounter());
    
    // Act
    act(() => {
      result.current.increment();
    });
    
    // Assert
    expect(result.current.count).toBe(1);
  });
});
```
{{else if (eq FRAMEWORK "Vue")}}
```typescript
// useCounter.test.ts (Simple Composable - Official Vue.js approach)
import { useCounter } from './useCounter';

describe('GIVEN useCounter composable', () => {
  test('WHEN initialized THEN should start with count 0', () => {
    // Arrange & Act
    const { count } = useCounter();
    
    // Assert
    expect(count.value).toBe(0);
  });

  test('WHEN increment is called THEN should increase count by 1', () => {
    // Arrange
    const { count, increment } = useCounter();
    
    // Act
    increment();
    
    // Assert
    expect(count.value).toBe(1);
  });
});

// For composables that use lifecycle hooks or provide/inject:
// test-utils.ts (Official Vue.js recommendation from docs)
import { createApp } from 'vue';

export function withSetup(composable: () => any) {
  let result: any;
  const app = createApp({
    setup() {
      result = composable();
      // suppress missing template warning
      return () => {};
    }
  });
  app.mount(document.createElement('div'));
  // return the result and the app instance
  // for testing provide/unmount
  return [result, app];
}

// useFoo.test.ts (Composable with lifecycle/injection dependencies)
import { withSetup } from './test-utils';
import { useFoo } from './useFoo';

describe('GIVEN useFoo composable', () => {
  test('WHEN using composable with lifecycle THEN should work correctly', () => {
    // Arrange & Act
    const [result, app] = withSetup(() => useFoo(123));
    
    // mock provide for testing injections
    app.provide('someKey', 'someValue');
    
    // Assert
    expect(result.foo.value).toBe(1);
    
    // trigger onUnmounted hook if needed
    app.unmount();
  });
});
```
{{else if (eq FRAMEWORK "Angular")}}
```typescript
// counter.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { CounterService } from './counter.service';

describe('GIVEN CounterService', () => {
  let service: CounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CounterService);
  });

  test('WHEN initialized THEN should start with count 0', () => {
    // Assert
    expect(service.count()).toBe(0);
  });

  test('WHEN increment is called THEN should increase count by 1', () => {
    // Act
    service.increment();
    
    // Assert
    expect(service.count()).toBe(1);
  });
});
```
{{else if (eq FRAMEWORK "Svelte")}}
```typescript
// counterStore.test.ts
import { get } from 'svelte/store';
import { counterStore, increment } from './counterStore';

describe('GIVEN counterStore', () => {
  test('WHEN initialized THEN should start with count 0', () => {
    // Assert
    expect(get(counterStore)).toBe(0);
  });

  test('WHEN increment is called THEN should increase count by 1', () => {
    // Act
    increment();
    
    // Assert
    expect(get(counterStore)).toBe(1);
  });
});
```
{{/if}}

## Framework-Specific Testing Patterns

{{#if (eq FRAMEWORK "React")}}
### React-Specific Patterns

#### Testing Context Providers
```typescript
// AuthContext.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { user, login, logout } = useAuth();
  
  return (
    <div>
      {user ? (
        <div>
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login({ name: 'John' })}>Login</button>
      )}
    </div>
  );
};

describe('GIVEN AuthContext', () => {
  test('WHEN user logs in THEN should update context state', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Act
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
    expect(screen.getByText(/welcome, john/i)).toBeInTheDocument();
  });
});
```

#### Testing React Router
```typescript
// Navigation.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { Navigation } from './Navigation';

test('WHEN clicking nav link THEN should navigate to page', async () => {
  // Arrange
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/']}>
      <Navigation />
    </MemoryRouter>
  );
  
  // Act
  await user.click(screen.getByRole('link', { name: /about/i }));
  
  // Assert
  expect(window.location.pathname).toBe('/about');
});
```
{{else if (eq FRAMEWORK "Vue")}}
### Vue-Specific Patterns

#### Testing Components with Vue Test Utils (Official Recommendation)
```typescript
// UserProfile.test.ts
import { mount } from '@vue/test-utils';
import { render, screen } from '@testing-library/vue';
import UserProfile from './UserProfile.vue';

describe('GIVEN UserProfile component', () => {
  test('WHEN user data is provided THEN should display user information', () => {
    // Arrange
    const user = { name: 'John Doe', email: 'john@example.com', role: 'admin' };
    
    // Act
    const wrapper = mount(UserProfile, {
      props: { user }
    });
    
    // Assert
    expect(wrapper.find('[data-testid="user-name"]').text()).toBe('John Doe');
    expect(wrapper.find('[data-testid="user-email"]').text()).toBe('john@example.com');
    expect(wrapper.find('[data-testid="user-role"]').text()).toBe('admin');
  });

  test('WHEN user clicks edit button THEN should emit edit event', async () => {
    // Arrange
    const user = { name: 'John Doe', email: 'john@example.com' };
    const wrapper = mount(UserProfile, {
      props: { user }
    });
    
    // Act
    await wrapper.find('[data-testid="edit-button"]').trigger('click');
    
    // Assert
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0]).toEqual([user]);
  });
});
```

#### Testing Composables (Vue-Specific Feature)
```typescript
// composables/useCounter.ts
import { ref } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = initialValue;

  return {
    count,
    increment,
    decrement,
    reset
  };
}

// composables/useCounter.test.ts
import { useCounter } from './useCounter';

describe('GIVEN useCounter composable', () => {
  test('WHEN initialized THEN should start with default value', () => {
    // Arrange & Act
    const { count } = useCounter();
    
    // Assert
    expect(count.value).toBe(0);
  });

  test('WHEN initialized with custom value THEN should start with that value', () => {
    // Arrange & Act
    const { count } = useCounter(5);
    
    // Assert
    expect(count.value).toBe(5);
  });

  test('WHEN increment is called THEN should increase count', () => {
    // Arrange
    const { count, increment } = useCounter();
    
    // Act
    increment();
    
    // Assert
    expect(count.value).toBe(1);
  });

  test('WHEN reset is called THEN should return to initial value', () => {
    // Arrange
    const { count, increment, reset } = useCounter(3);
    increment();
    increment();
    
    // Act
    reset();
    
    // Assert
    expect(count.value).toBe(3);
  });
});
```

#### Testing Composables with Lifecycle Hooks
```typescript
// composables/useApi.ts
import { ref, onMounted } from 'vue';

export function useApi(url: string) {
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchData = async () => {
    loading.value = true;
    try {
      const response = await fetch(url);
      data.value = await response.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchData();
  });

  return { data, loading, error, fetchData };
}

// test-utils.ts (Official Vue.js recommendation)
import { createApp } from 'vue';

export function withSetup(composable: () => any) {
  let result: any;
  const app = createApp({
    setup() {
      result = composable();
      // suppress missing template warning
      return () => {};
    }
  });
  app.mount(document.createElement('div'));
  // return the result and the app instance
  // for testing provide/unmount
  return [result, app];
}

// composables/useApi.test.ts
import { withSetup } from '../test-utils';
import { useApi } from './useApi';

// Mock fetch globally
global.fetch = jest.fn();

describe('GIVEN useApi composable', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('WHEN component mounts THEN should fetch data automatically', async () => {
    // Arrange
    const mockData = { id: 1, name: 'Test' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockData),
    });

    // Act
    const [result] = withSetup(() => useApi('/api/test'));

    // Wait for the async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert
    expect(fetch).toHaveBeenCalledWith('/api/test');
    expect(result.data.value).toEqual(mockData);
    expect(result.loading.value).toBe(false);
  });

  test('WHEN API call fails THEN should set error state', async () => {
    // Arrange
    const mockError = new Error('API Error');
    (fetch as jest.Mock).mockRejectedValueOnce(mockError);

    // Act
    const [result] = withSetup(() => useApi('/api/test'));

    // Wait for the async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    // Assert
    expect(result.error.value).toEqual(mockError);
    expect(result.loading.value).toBe(false);
    expect(result.data.value).toBeNull();
  });
});
```

#### Testing Pinia Store
```typescript
// stores/user.ts
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const isLoggedIn = computed(() => !!user.value);

  const login = (userData: any) => {
    user.value = userData;
  };

  const logout = () => {
    user.value = null;
  };

  return { user, isLoggedIn, login, logout };
});

// stores/user.test.ts
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from './user';

describe('GIVEN userStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('WHEN initialized THEN user should be null', () => {
    // Arrange & Act
    const store = useUserStore();
    
    // Assert
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
  });

  test('WHEN login is called THEN should set user data', () => {
    // Arrange
    const store = useUserStore();
    const userData = { name: 'John', email: 'john@example.com' };
    
    // Act
    store.login(userData);
    
    // Assert
    expect(store.user).toEqual(userData);
    expect(store.isLoggedIn).toBe(true);
  });

  test('WHEN logout is called THEN should clear user data', () => {
    // Arrange
    const store = useUserStore();
    store.login({ name: 'John', email: 'john@example.com' });
    
    // Act
    store.logout();
    
    // Assert
    expect(store.user).toBeNull();
    expect(store.isLoggedIn).toBe(false);
  });
});
```

#### Testing Vue Router
```typescript
// components/Navigation.test.ts
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import Navigation from './Navigation.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: { template: '<div>Home</div>' } },
    { path: '/about', name: 'About', component: { template: '<div>About</div>' } },
    { path: '/contact', name: 'Contact', component: { template: '<div>Contact</div>' } }
  ]
});

describe('GIVEN Navigation component', () => {
  test('WHEN component renders THEN should display navigation links', () => {
    // Arrange & Act
    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    });
    
    // Assert
    expect(wrapper.find('[data-testid="home-link"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="about-link"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="contact-link"]').exists()).toBe(true);
  });

  test('WHEN navigation link is clicked THEN should navigate to correct route', async () => {
    // Arrange
    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    });
    
    // Act
    await wrapper.find('[data-testid="about-link"]').trigger('click');
    await router.isReady();
    
    // Assert
    expect(router.currentRoute.value.name).toBe('About');
  });
});
```

#### Testing Components with Provide/Inject
```typescript
// components/UserProfile.vue
<template>
  <div>
    <h1>{{ user.name }}</h1>
    <p>Theme: {{ theme }}</p>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const props = defineProps(['user']);
const theme = inject('theme', 'light');
</script>

// components/UserProfile.test.ts
import { mount } from '@vue/test-utils';
import UserProfile from './UserProfile.vue';

describe('GIVEN UserProfile component', () => {
  test('WHEN theme is provided THEN should use provided theme', () => {
    // Arrange
    const user = { name: 'John Doe' };
    
    // Act
    const wrapper = mount(UserProfile, {
      props: { user },
      global: {
        provide: {
          theme: 'dark'
        }
      }
    });
    
    // Assert
    expect(wrapper.text()).toContain('Theme: dark');
  });

  test('WHEN no theme is provided THEN should use default theme', () => {
    // Arrange
    const user = { name: 'John Doe' };
    
    // Act
    const wrapper = mount(UserProfile, {
      props: { user }
    });
    
    // Assert
    expect(wrapper.text()).toContain('Theme: light');
  });
});
```

#### Testing Async Components
```typescript
// components/AsyncUserList.vue
<template>
  <div>
    <div v-if="loading">Loading users...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);
const loading = ref(false);
const error = ref(null);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/users');
    users.value = await response.json();
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

// components/AsyncUserList.test.ts
import { mount, flushPromises } from '@vue/test-utils';
import AsyncUserList from './AsyncUserList.vue';

// Mock fetch
global.fetch = jest.fn();

describe('GIVEN AsyncUserList component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('WHEN component mounts THEN should show loading state initially', () => {
    // Arrange
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    // Act
    const wrapper = mount(AsyncUserList);
    
    // Assert
    expect(wrapper.text()).toContain('Loading users...');
  });

  test('WHEN data loads successfully THEN should display users', async () => {
    // Arrange
    const mockUsers = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockUsers),
    });
    
    // Act
    const wrapper = mount(AsyncUserList);
    await flushPromises(); // Wait for all async operations
    
    // Assert
    expect(wrapper.text()).toContain('John Doe');
    expect(wrapper.text()).toContain('Jane Smith');
    expect(wrapper.text()).not.toContain('Loading');
  });

  test('WHEN API call fails THEN should show error message', async () => {
    // Arrange
    const mockError = new Error('Failed to fetch');
    (fetch as jest.Mock).mockRejectedValueOnce(mockError);
    
    // Act
    const wrapper = mount(AsyncUserList);
    await flushPromises();
    
    // Assert
    expect(wrapper.text()).toContain('Error: Failed to fetch');
    expect(wrapper.text()).not.toContain('Loading');
  });
});
```

#### Testing with Testing Library Vue (Alternative Approach)
```typescript
// components/ContactForm.test.ts
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm.vue';

describe('GIVEN ContactForm component', () => {
  test('WHEN valid form is submitted THEN should emit submit event', async () => {
    // Arrange
    const user = userEvent.setup();
    const { emitted } = render(ContactForm);
    
    // Act
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert
    await waitFor(() => {
      expect(emitted().submit[0]).toEqual([{
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      }]);
    });
  });

  test('WHEN required fields are empty THEN should show validation errors', async () => {
    // Arrange
    const user = userEvent.setup();
    render(ContactForm);
    
    // Act
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });
});
```
{{else if (eq FRAMEWORK "Angular")}}
### Angular-Specific Patterns

#### Testing Services with Dependency Injection
```typescript
// user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('GIVEN UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no unexpected requests
  });

  test('WHEN getUser is called THEN should return user data', () => {
    // Arrange
    const mockUser = { id: 1, name: 'John Doe' };
    
    // Act
    service.getUser(1).subscribe(user => {
      // Assert
      expect(user).toEqual(mockUser);
    });
    
    const req = httpMock.expectOne('/api/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  test('WHEN API fails THEN should handle error correctly', () => {
    // Arrange & Act
    service.getUser(1).subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });
    
    const req = httpMock.expectOne('/api/users/1');
    req.error(new ErrorEvent('Server Error'), { status: 500 });
  });
});
```

#### Testing Components with TestBed and Mock Dependencies
```typescript
// user-list.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { UserListComponent } from './user-list.component';
import { UserService } from '../services/user.service';
import { of } from 'rxjs';

// Create a testing service that implements the same interface
class UserTestingService {
  getUsers() {
    return of([
      { id: 1, name: 'John' }, 
      { id: 2, name: 'Jane' }
    ]);
  }
}

describe('GIVEN UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let userService: UserTestingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [
        { provide: UserService, useClass: UserTestingService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as UserTestingService;
    fixture.detectChanges();
  });

  test('WHEN component initializes THEN should load and display users', async () => {
    // Assert
    expect(await screen.findByText('John')).toBeInTheDocument();
    expect(await screen.findByText('Jane')).toBeInTheDocument();
  });
});
```

#### Testing Interceptors
```typescript
// auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

class AuthTestingService {
  getAccessToken(): string {
    return 'test-token-123';
  }
}

describe('GIVEN AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthTestingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useClass: AuthTestingService },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as AuthTestingService;
  });

  afterEach(() => {
    httpMock.verify();
  });

  test('WHEN making request THEN should add authorization header', () => {
    // Arrange
    const url = '/api/protected-resource';

    // Act
    httpClient.get(url).subscribe();

    // Assert
    const mockRequest = httpMock.expectOne(url);
    const authHeader = mockRequest.request.headers.get('Authorization');
    
    expect(authHeader).toBe(`Bearer ${authService.getAccessToken()}`);
    mockRequest.flush({});
  });
});
```

#### Testing Pipes
```typescript
// currency-format.pipe.spec.ts
import { CurrencyFormatPipe } from './currency-format.pipe';

describe('GIVEN CurrencyFormatPipe', () => {
  let pipe: CurrencyFormatPipe;

  beforeEach(() => {
    pipe = new CurrencyFormatPipe();
  });

  test('WHEN transform is called with number THEN should format as currency', () => {
    // Act
    const result = pipe.transform(1234.56, 'USD');
    
    // Assert
    expect(result).toBe('$1,234.56');
  });

  test('WHEN transform is called with null THEN should handle gracefully', () => {
    // Act
    const result = pipe.transform(null, 'USD');
    
    // Assert
    expect(result).toBe('$0.00');
  });
});
```

#### Testing Directives
```typescript
// highlight.directive.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { HighlightDirective } from './highlight.directive';

@Component({
  template: '<div appHighlight="yellow" data-testid="highlight-div">Test Content</div>'
})
class TestComponent {}

describe('GIVEN HighlightDirective', () => {
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent, HighlightDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  });

  test('WHEN directive is applied THEN should change background color', () => {
    // Assert
    const element = screen.getByTestId('highlight-div');
    expect(element).toHaveStyle('background-color: yellow');
  });
});
```

#### Testing Components with OnPush Change Detection
```typescript
// counter.component.spec.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

// Host component pattern for OnPush components
@Component({
  template: `
    <app-counter 
      [value]="value" 
      (valueChange)="onValueChange($event)">
    </app-counter>
  `
})
class CounterHostComponent {
  value = 0;
  
  onValueChange(newValue: number): void {
    this.value = newValue;
  }
}

describe('GIVEN CounterComponent with OnPush', () => {
  test('WHEN increment button clicked THEN should emit valueChange', async () => {
    // Arrange
    const user = userEvent.setup();
    const { fixture } = await render(CounterHostComponent, {
      declarations: [CounterComponent]
    });
    
    const incrementButton = screen.getByRole('button', { name: /increment/i });
    
    // Act
    await user.click(incrementButton);
    
    // Assert
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

// Alternative: Override change detection for testing
describe('GIVEN CounterComponent (override OnPush)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CounterComponent]
    })
    .overrideComponent(CounterComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    })
    .compileComponents();
  });
  
  // ... rest of tests
});
```

#### Testing Component Inputs and Outputs
```typescript
// button.component.spec.ts
describe('GIVEN ButtonComponent', () => {
  test('WHEN input changes THEN should update component', () => {
    // Arrange
    const { fixture } = render(ButtonComponent, {
      componentProperties: { disabled: false, text: 'Click me' }
    });
    const component = fixture.componentInstance;

    // Act
    component.disabled = true;
    component.text = 'Disabled';
    
    // Manually trigger ngOnChanges for programmatic changes
    component.ngOnChanges({
      disabled: { currentValue: true, previousValue: false, firstChange: false },
      text: { currentValue: 'Disabled', previousValue: 'Click me', firstChange: false }
    });
    fixture.detectChanges();

    // Assert
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  test('WHEN button clicked THEN should emit click event', async () => {
    // Arrange
    const user = userEvent.setup();
    const clickSpy = jest.fn();
    
    render(ButtonComponent, {
      componentProperties: {
        buttonClick: { emit: clickSpy } as any
      }
    });

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
```

#### Testing Parent-Child Component Communication
```typescript
// parent.component.spec.ts
describe('GIVEN ParentComponent with ChildComponent', () => {
  test('WHEN child emits event THEN parent should handle it', () => {
    // Arrange
    const { fixture } = render(ParentComponent, {
      declarations: [ChildComponent]
    });
    const parentComponent = fixture.componentInstance;
    const parentSpy = jest.spyOn(parentComponent, 'onChildEvent');

    // Act
    const childDebugElement = fixture.debugElement.query(By.css('app-child'));
    childDebugElement.triggerEventHandler('childEvent', 'test data');

    // Assert
    expect(parentSpy).toHaveBeenCalledWith('test data');
  });

  test('WHEN parent data changes THEN child should receive new input', () => {
    // Arrange
    const { fixture } = render(ParentComponent, {
      declarations: [ChildComponent]
    });
    const parentComponent = fixture.componentInstance;

    // Act
    parentComponent.dataForChild = 'new data';
    fixture.detectChanges();

    // Assert
    const childComponent = fixture.debugElement.query(By.css('app-child')).componentInstance;
    expect(childComponent.inputData).toBe('new data');
  });
});
```

#### Testing Components with Content Projection
```typescript
// card.component.spec.ts
@Component({
  template: `
    <app-card>
      <h2 slot="title">{{ title }}</h2>
      <p slot="content">{{ content }}</p>
    </app-card>
  `
})
class CardHostComponent {
  title = 'Test Title';
  content = 'Test Content';
}

describe('GIVEN CardComponent with content projection', () => {
  test('WHEN content is projected THEN should display in correct slots', async () => {
    // Arrange & Act
    await render(CardHostComponent, {
      declarations: [CardComponent]
    });

    // Assert
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
```

#### Testing Module Configuration
```typescript
// feature.module.spec.ts
import { TestBed } from '@angular/core/testing';
import { FeatureModule } from './feature.module';
import { FeatureService } from './feature.service';

describe('GIVEN FeatureModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FeatureModule]
    });
  });

  test('WHEN module is imported THEN should provide services', () => {
    // Act
    const service = TestBed.inject(FeatureService);
    
    // Assert
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(FeatureService);
  });
});
```

#### Testing Module Pattern for Test Doubles
```typescript
// user.testing.module.ts
import { NgModule } from '@angular/core';
import { UserService } from './user.service';
import { UserComponent } from './user.component';

// Test double service
export class UserTestingService {
  getUser(id: number) {
    return of({ id, name: 'Test User', email: 'test@example.com' });
  }
}

// Test double component  
@Component({
  selector: 'app-user',
  template: '<div data-testid="user-testing">User Testing Component</div>'
})
export class UserTestingComponent {
  @Input() userId: number;
  @Output() userSelected = new EventEmitter<any>();
}

@NgModule({
  declarations: [UserTestingComponent],
  exports: [UserTestingComponent],
  providers: [
    { provide: UserService, useClass: UserTestingService }
  ]
})
export class UserTestingModule {}

// Usage in tests
describe('GIVEN SomeComponent that uses UserComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTestingModule], // Use testing module instead of real one
      declarations: [SomeComponent]
    }).compileComponents();
  });
  
  // Tests use mock UserComponent and UserService
});
```

#### Advanced Testing Utilities
```typescript
// test-utils/angular-testing-utils.ts

// Custom type to extract only public interface (like ngx-nuts-and-bolts)
export type ExtractPublic<T> = {
  [K in keyof T]: T[K];
};

// Helper for creating component test doubles
export function createComponentTestDouble<T>(
  selector: string,
  inputs: string[] = [],
  outputs: string[] = []
): any {
  const inputsObj = inputs.reduce((acc, input) => {
    acc[input] = undefined;
    return acc;
  }, {} as any);

  const outputsObj = outputs.reduce((acc, output) => {
    acc[output] = new EventEmitter();
    return acc;
  }, {} as any);

  @Component({
    selector,
    template: `<div data-testid="${selector}-testing">Testing Component</div>`,
    inputs,
    outputs
  })
  class TestingComponent {
    constructor() {
      Object.assign(this, inputsObj, outputsObj);
    }
  }

  return TestingComponent;
}

// Usage
const UserCardTestingComponent = createComponentTestDouble(
  'app-user-card', 
  ['user', 'editable'], 
  ['userEdit', 'userDelete']
);
```
{{else if (eq FRAMEWORK "Svelte")}}
### Svelte-Specific Patterns

#### Testing Components with Native Svelte APIs
```typescript
// Button.test.js
import { flushSync, mount, unmount } from 'svelte';
import { expect, test } from 'vitest';
import Button from './Button.svelte';

describe('GIVEN Button component', () => {
  test('WHEN clicked THEN should trigger click handler', () => {
    // Arrange
    const component = mount(Button, {
      target: document.body,
      props: { count: 0 }
    });
    
    // Assert initial state
    expect(document.body.innerHTML).toBe('<button>0</button>');
    
    // Act - Click the button
    document.body.querySelector('button').click();
    flushSync(); // Flush changes synchronously
    
    // Assert
    expect(document.body.innerHTML).toBe('<button>1</button>');
    
    // Cleanup
    unmount(component);
  });
});
```

#### Testing Components with Testing Library (Alternative)
```typescript
// Button.test.js
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import Button from './Button.svelte';

describe('GIVEN Button component', () => {
  test('WHEN clicked THEN should increment counter', async () => {
    // Arrange
    const user = userEvent.setup();
    render(Button, { props: { count: 0 } });
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('0');
    
    // Act
    await user.click(button);
    
    // Assert
    expect(button).toHaveTextContent('1');
  });
});
```

#### Testing Svelte Runes and State Management
```typescript
// multiplier.svelte.test.js
import { flushSync } from 'svelte';
import { expect, test } from 'vitest';
import { multiplier } from './multiplier.svelte.js';

test('GIVEN multiplier function WHEN state changes THEN should compute correctly', () => {
  // Arrange
  let double = multiplier(0, 2);
  
  // Assert initial state
  expect(double.value).toEqual(0);
  
  // Act
  double.set(5);
  
  // Assert
  expect(double.value).toEqual(10);
});

// For testing with runes inside test files
test('WHEN using runes in test THEN should work with .svelte extension', () => {
  // Note: This test would be in a .svelte.test.js file
  let count = $state(0);
  let double = multiplier(() => count, 2);
  
  expect(double.value).toEqual(0);
  
  count = 5;
  expect(double.value).toEqual(10);
});
```

#### Testing Effects and Reactive Statements
```typescript
// logger.svelte.test.js
import { flushSync } from 'svelte';
import { expect, test } from 'vitest';
import { logger } from './logger.svelte.js';

test('GIVEN logger with effect WHEN state changes THEN should log updates', () => {
  // Arrange - Wrap in $effect.root for effects testing
  const cleanup = $effect.root(() => {
    let count = $state(0);
    let log = logger(() => count);
    
    // Act - Effects run after microtask, use flushSync for synchronous execution
    flushSync();
    expect(log).toEqual([0]);
    
    count = 1;
    flushSync();
    
    // Assert
    expect(log).toEqual([0, 1]);
  });
  
  // Cleanup
  cleanup();
});
```

#### Testing Svelte Stores
```typescript
// userStore.test.ts
import { get } from 'svelte/store';
import { writable } from 'svelte/store';
import { userStore, login, logout } from './userStore';

describe('GIVEN userStore', () => {
  test('WHEN login is called THEN should set user data', () => {
    // Arrange
    const userData = { name: 'John', email: 'john@example.com' };
    
    // Act
    login(userData);
    
    // Assert
    expect(get(userStore)).toEqual(userData);
  });

  test('WHEN logout is called THEN should clear user data', () => {
    // Arrange
    login({ name: 'John', email: 'john@example.com' });
    
    // Act
    logout();
    
    // Assert
    expect(get(userStore)).toBeNull();
  });

  test('WHEN store updates THEN should notify subscribers', () => {
    // Arrange
    const mockSubscriber = jest.fn();
    const unsubscribe = userStore.subscribe(mockSubscriber);
    
    // Act
    userStore.set({ name: 'Jane', email: 'jane@example.com' });
    
    // Assert
    expect(mockSubscriber).toHaveBeenCalledWith({ name: 'Jane', email: 'jane@example.com' });
    
    // Cleanup
    unsubscribe();
  });
});
```

#### Testing Components with Stores
```typescript
// UserProfile.test.ts
import { render, screen } from '@testing-library/svelte';
import { userStore } from '../stores/userStore';
import UserProfile from './UserProfile.svelte';

describe('GIVEN UserProfile component', () => {
  test('WHEN user store has data THEN should display user info', () => {
    // Arrange
    userStore.set({ name: 'John Doe', email: 'john@example.com' });
    
    // Act
    render(UserProfile);
    
    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('WHEN user store is empty THEN should show login prompt', () => {
    // Arrange
    userStore.set(null);
    
    // Act
    render(UserProfile);
    
    // Assert
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });
});
```

#### Testing Two-Way Bindings
```typescript
// InputForm.test.js
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import InputForm from './InputForm.svelte';

// Create a wrapper component for testing two-way bindings
const TestWrapper = `
  <script>
    import InputForm from './InputForm.svelte';
    let formData = { name: '', email: '' };
  </script>
  
  <InputForm bind:data={formData} />
  <div data-testid="output">{JSON.stringify(formData)}</div>
`;

test('GIVEN input form WHEN user types THEN should update bound data', async () => {
  // Arrange
  const user = userEvent.setup();
  render(TestWrapper);
  
  const nameInput = screen.getByLabelText(/name/i);
  const output = screen.getByTestId('output');
  
  // Act
  await user.type(nameInput, 'John Doe');
  
  // Assert
  expect(output).toHaveTextContent('"name":"John Doe"');
});
```

#### Testing Context and Provide/Inject
```typescript
// ChildComponent.test.js
import { render, screen } from '@testing-library/svelte';
import { setContext } from 'svelte';
import ChildComponent from './ChildComponent.svelte';

// Create wrapper component that provides context
const ContextWrapper = `
  <script>
    import { setContext } from 'svelte';
    import ChildComponent from './ChildComponent.svelte';
    
    setContext('theme', 'dark');
    setContext('user', { name: 'John', role: 'admin' });
  </script>
  
  <ChildComponent />
`;

test('GIVEN child component WHEN context is provided THEN should use context values', () => {
  // Arrange & Act
  render(ContextWrapper);
  
  // Assert
  expect(screen.getByText(/dark theme/i)).toBeInTheDocument();
  expect(screen.getByText(/admin user/i)).toBeInTheDocument();
});
```

#### Testing Async Components and Loading States
```typescript
// AsyncUserList.test.js
import { render, screen, waitFor } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import AsyncUserList from './AsyncUserList.svelte';

// Mock fetch globally
global.fetch = jest.fn();

describe('GIVEN AsyncUserList component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('WHEN component mounts THEN should show loading state', () => {
    // Arrange
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    // Act
    render(AsyncUserList);
    
    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('WHEN data loads THEN should display users', async () => {
    // Arrange
    const mockUsers = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ];
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockUsers)
    });
    
    // Act
    render(AsyncUserList);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

#### Testing Svelte Router/Navigation
```typescript
// Navigation.test.ts
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Navigation from './Navigation.svelte';

// Mock the router
const mockPush = jest.fn();
jest.mock('svelte-spa-router', () => ({
  push: mockPush
}));

test('WHEN navigation link is clicked THEN should route to correct page', async () => {
  // Arrange
  const user = userEvent.setup();
  render(Navigation);
  
  // Act
  await user.click(screen.getByRole('link', { name: /about/i }));
  
  // Assert
  expect(mockPush).toHaveBeenCalledWith('/about');
});
```

#### Testing with Storybook Integration
```typescript
// Button.stories.svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, fn } from 'storybook/test';
  import Button from './Button.svelte';

  const { Story } = defineMeta({
    component: Button,
    args: {
      onClick: fn()
    }
  });
</script>

<Story name="Default" />

<Story 
  name="Interaction Test"
  play={async ({ args, canvas, userEvent }) => {
    // Simulate user interaction
    await userEvent.click(canvas.getByRole('button'));
    
    // Run assertions
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  }}
/>
```
```
{{/if}}

## Mocking Strategies

### Module Mocking

```typescript
// Mock external dependencies
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock React Router hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: '123' }),
}));
```

### Component Mocking

```typescript
// __mocks__/UserCard.tsx
export const UserCard = ({ user }: { user: any }) => (
  <div data-testid="user-card">
    <span>{user.name}</span>
    <span>{user.email}</span>
  </div>
);

// In test file
jest.mock('../UserCard/UserCard');
```

### API Mocking

```typescript
// Setup MSW (Mock Service Worker) for API mocking
// handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ])
    );
  }),
];

// In test file
import { server } from '../mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Async Testing Patterns

### Testing Async Components

```typescript
describe('GIVEN UserList component', () => {
  test('WHEN data loads successfully THEN should display users', async () => {
    // Arrange
    render(<UserList />);
    
    // Assert loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Assert loaded state
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  test('WHEN API fails THEN should show error message', async () => {
    // Arrange
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );
    
    render(<UserList />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error loading users/i)).toBeInTheDocument();
    });
  });
});
```

## Testing React Router

```typescript
// RouterTestWrapper.tsx
import { MemoryRouter } from 'react-router-dom';

const RouterTestWrapper = ({ 
  children, 
  initialEntries = ['/'] 
}: { 
  children: React.ReactNode;
  initialEntries?: string[];
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    {children}
  </MemoryRouter>
);

// In test
test('WHEN on user profile page THEN should display user details', () => {
  render(
    <RouterTestWrapper initialEntries={['/users/123']}>
      <UserProfile />
    </RouterTestWrapper>
  );
  
  expect(screen.getByText(/user profile/i)).toBeInTheDocument();
});
```

## Testing Context and State Management

### Context Testing

```typescript
// AuthContext.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const TestComponent = () => {
  const { user, login, logout } = useAuth();
  
  return (
    <div>
      {user ? (
        <div>
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login({ name: 'John' })}>Login</button>
      )}
    </div>
  );
};

describe('GIVEN AuthContext', () => {
  test('WHEN user logs in THEN should update context state', async () => {
    // Arrange
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Act
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert
    expect(screen.getByText(/welcome, john/i)).toBeInTheDocument();
  });
});
```

## Jest DOM Matchers

Leverage `@testing-library/jest-dom` for expressive assertions:

```typescript
// Visibility
expect(element).toBeVisible();
expect(element).toBeInTheDocument();

// Form elements
expect(input).toBeDisabled();
expect(input).toBeEnabled();
expect(input).toBeRequired();
expect(input).toHaveValue('expected value');

// Text content
expect(element).toHaveTextContent('exact text');
expect(element).toHaveTextContent(/partial text/i);

// Attributes
expect(element).toHaveAttribute('aria-label', 'Close dialog');
expect(element).toHaveClass('active');

// Focus
expect(element).toHaveFocus();
```

## Error Boundaries Testing

```typescript
// ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('GIVEN ErrorBoundary', () => {
  test('WHEN child throws error THEN should display error UI', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // Assert
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('WHEN no error THEN should render children normally', () => {
    // Arrange & Act
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    // Assert
    expect(screen.getByText(/no error/i)).toBeInTheDocument();
  });
});
```

## Performance Testing

### Testing Performance with React.memo

```typescript
// ExpensiveComponent.test.tsx
import { render } from '@testing-library/react';
import { ExpensiveComponent } from './ExpensiveComponent';

describe('GIVEN ExpensiveComponent', () => {
  test('WHEN props do not change THEN should not re-render', () => {
    // Arrange
    const expensiveFunction = jest.fn();
    const { rerender } = render(
      <ExpensiveComponent data="test" onCalculate={expensiveFunction} />
    );
    
    // Act - rerender with same props
    rerender(<ExpensiveComponent data="test" onCalculate={expensiveFunction} />);
    
    // Assert - expensive function should only be called once
    expect(expensiveFunction).toHaveBeenCalledTimes(1);
  });
});
```

## Accessibility Testing

```typescript
// Install @testing-library/jest-dom for accessibility matchers
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('GIVEN Modal component', () => {
  test('WHEN rendered THEN should have no accessibility violations', async () => {
    // Arrange
    const { container } = render(<Modal isOpen={true}>Content</Modal>);
    
    // Act
    const results = await axe(container);
    
    // Assert
    expect(results).toHaveNoViolations();
  });

  test('WHEN modal opens THEN should focus on close button', () => {
    // Arrange & Act
    render(<Modal isOpen={true}>Content</Modal>);
    
    // Assert
    expect(screen.getByRole('button', { name: /close/i })).toHaveFocus();
  });
});
```

## Snapshot Testing (Use Sparingly)

```typescript
// Button.test.tsx
describe('GIVEN Button component', () => {
  test('WHEN rendered with primary variant THEN should match snapshot', () => {
    // Arrange & Act
    const { container } = render(<Button variant="primary">Click me</Button>);
    
    // Assert
    expect(container.firstChild).toMatchSnapshot();
  });
});

// Update snapshots with: npm test -- --updateSnapshot
```

## Testing Best Practices Summary

### Do's
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names with GIVEN/WHEN/THEN
- ✅ Follow the AAA pattern (Arrange-Act-Assert)
- ✅ Test one behavior per test
- ✅ Use `screen` queries over `container.querySelector`
- ✅ Prefer `getByRole` over other queries when possible
- ✅ Wait for async operations with `waitFor`
- ✅ Mock external dependencies
- ✅ Clean up after each test

### Don'ts
- ❌ Don't test implementation details
- ❌ Don't use `container.querySelector` when screen queries work
- ❌ Don't test third-party library functionality
- ❌ Don't use snapshot tests for complex components
- ❌ Don't forget to clean up mocks and side effects
- ❌ Don't test multiple behaviors in one test
- ❌ Don't use overly complex test setup

## Common Queries Priority

Follow this priority order for queries:

1. **getByRole** - Most accessible
2. **getByLabelText** - Good for form controls
3. **getByPlaceholderText** - Good for inputs
4. **getByText** - Good for non-interactive elements
5. **getByDisplayValue** - Current value of inputs
6. **getByAltText** - For images
7. **getByTitle** - Not recommended
8. **getByTestId** - Last resort for complex scenarios

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm test -- --coverage --watchAll=false
      - run: npm run test:e2e
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Troubleshooting Common Issues

### Act Warning

```typescript
// Wrap state updates in act()
import { act } from '@testing-library/react';

test('WHEN state updates THEN should not show act warning', async () => {
  render(<Component />);
  
  await act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });
  
  // Or use userEvent which handles act automatically
  await user.click(screen.getByRole('button'));
});
```

### Timer Mocking

```typescript
// Mock timers for components using setTimeout/setInterval
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('WHEN timer expires THEN should update state', () => {
  render(<TimerComponent />);
  
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  
  expect(screen.getByText(/time expired/i)).toBeInTheDocument();
});
```

This comprehensive guide provides a solid foundation for testing React applications with modern best practices, focusing on maintainability, reliability, and developer experience.

