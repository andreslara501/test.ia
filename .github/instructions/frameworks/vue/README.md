# Vue.js Testing Guide

Welcome to the Vue.js testing documentation. This guide covers comprehensive testing strategies for Vue.js applications using Vue Test Utils and modern testing frameworks.

## Quick Start

### Installation and Setup

#### With Vitest (Recommended)
```bash
npm install --save-dev @vue/test-utils vitest jsdom
```

#### With Jest
```bash
npm install --save-dev @vue/test-utils jest @vue/vue3-jest
```

### Basic Vitest Configuration

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

### Basic Jest Configuration

Update `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testMatch: [
    '**/tests/**/*.spec.(js|jsx|ts|tsx)',
    '**/__tests__/*.(js|jsx|ts|tsx)'
  ],
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx', 'ts', 'tsx'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

## Vue Testing Utilities

### Essential Test Utilities
```typescript
// tests/utils/test-utils.ts
import { mount, VueWrapper } from '@vue/test-utils'
import { App, Component } from 'vue'

// Type-safe wrapper utility
export function mountComponent<T extends Component>(
  component: T,
  options?: any
): VueWrapper<any> {
  return mount(component, {
    global: {
      stubs: {
        // Common stubs
        'router-link': true,
        'router-view': true
      }
    },
    ...options
  })
}

// Mock router utility
export function createMockRouter(routes: any[] = []) {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    currentRoute: { value: { path: '/', params: {}, query: {} } }
  }
}

// Mock store utility (Pinia)
export function createMockStore() {
  return {
    state: {},
    getters: {},
    actions: {}
  }
}
```

### Common Testing Patterns
```typescript
// Basic component structure for testing
describe('GIVEN ComponentName', () => {
  test('WHEN condition THEN expectation', async () => {
    const wrapper = mountComponent(Component, {
      props: { /* props */ }
    })
    
    // Test implementation
    expect(wrapper.text()).toContain('expected text')
  })
})
```

## Directory Structure

```
frameworks/vue/
├── README.md                 # This file
├── component-testing.md      # Vue component testing patterns
├── composition-api.md        # Composition API testing
├── integration.md           # Vue Router, Pinia integration testing
└── mocking.md              # Vue-specific mocking strategies
```

## Framework Features

### Vue 3 Composition API
- Testing composables with isolation
- Reactive state testing
- Lifecycle hooks testing
- Dependency injection testing

### Vue Test Utils Features
- Component mounting and shallow rendering
- Props and emits testing
- Slot testing
- Directive testing
- Async component testing

### Vue Router Integration
- Route navigation testing
- Route guards testing
- Dynamic routing testing

### Pinia State Management
- Store testing
- Action testing
- Getter testing
- Store composition testing

## Navigation

| Topic | Description |
|-------|-------------|
| [Component Testing](./component-testing.md) | Vue component testing with Vue Test Utils |
| [Composition API](./composition-api.md) | Testing Vue 3 Composition API and composables |
| [Integration Testing](./integration.md) | Vue Router and Pinia integration testing |
| [Mocking Strategies](./mocking.md) | Vue-specific mocking patterns |

## Related Resources
- [Testing Principles](../../common/testing-principles.md)
- [Best Practices](../../common/best-practices.md)
- [React Testing](../react/README.md)
- [Angular Testing](../angular/README.md)
- [Svelte Testing](../svelte/README.md)

## Official Vue.js Resources
- [Vue Test Utils Documentation](https://test-utils.vuejs.org/)
- [Vue.js Testing Guide](https://vuejs.org/guide/scaling-up/testing.html)
- [Vitest Documentation](https://vitest.dev/)
- [Pinia Testing Guide](https://pinia.vuejs.org/cookbook/testing.html)