# Svelte Testing Guide

This guide covers comprehensive testing strategies for Svelte applications using modern testing tools and best practices.

## Overview

Svelte testing leverages familiar tools like Jest, Vitest, and Testing Library to provide a robust testing environment for components, stores, and application logic.

### Key Testing Tools

- **@testing-library/svelte**: Component testing with user-centric approach
- **Jest**: Full-featured testing framework with mocking capabilities
- **Vitest**: Fast unit testing with native ESM and TypeScript support
- **@testing-library/jest-dom**: Additional matchers for DOM assertions
- **@testing-library/user-event**: Realistic user interaction simulation

## Setup and Configuration

### Vitest Setup (Recommended)

```bash
npm install -D vitest @testing-library/svelte @testing-library/jest-dom @testing-library/user-event jsdom
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js']
  }
});
```

```javascript
// src/setupTests.js
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
```

### Jest Setup (Alternative)

```bash
npm install -D jest @testing-library/svelte @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleFileExtensions: ['js', 'ts', 'svelte'],
  transform: {
    '^.+\\.svelte$': ['svelte-jester', { preprocess: true }],
    '^.+\\.(js|ts)$': 'babel-jest'
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,svelte}',
    '!src/**/*.d.ts',
    '!src/main.js'
  ]
};
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "checkJs": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules/*", "build/*"]
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Basic Testing Patterns

### Simple Component Test

```svelte
<!-- src/components/Button.svelte -->
<script>
  export let variant = 'primary';
  export let disabled = false;
  export let loading = false;
  
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  function handleClick(event) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
</script>

<button 
  class="btn btn-{variant}" 
  class:disabled 
  class:loading
  {disabled}
  on:click={handleClick}
  data-testid="button"
>
  {#if loading}
    <span class="spinner" data-testid="spinner"></span>
  {/if}
  <slot>Click me</slot>
</button>

<style>
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  
  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  
  .btn:hover:not(.disabled) {
    opacity: 0.9;
  }
  
  .btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn.loading {
    position: relative;
  }
  
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

```javascript
// src/components/Button.test.js
import { render, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './Button.svelte';

describe('GIVEN Button component', () => {
  const user = userEvent.setup();

  describe('WHEN rendered with default props', () => {
    it('THEN should display default button', () => {
      const { getByTestId } = render(Button);
      
      const button = getByTestId('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('btn', 'btn-primary');
      expect(button).toHaveTextContent('Click me');
      expect(button).not.toBeDisabled();
    });
  });

  describe('WHEN rendered with custom props', () => {
    it('THEN should apply variant class', () => {
      const { getByTestId } = render(Button, { variant: 'secondary' });
      
      const button = getByTestId('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('THEN should show custom text from slot', () => {
      const { getByTestId } = render(Button, {
        props: {},
        $$slots: { default: 'Custom Text' }
      });
      
      const button = getByTestId('button');
      expect(button).toHaveTextContent('Custom Text');
    });

    it('THEN should be disabled when disabled prop is true', () => {
      const { getByTestId } = render(Button, { disabled: true });
      
      const button = getByTestId('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled');
    });

    it('THEN should show loading state', () => {
      const { getByTestId } = render(Button, { loading: true });
      
      const button = getByTestId('button');
      const spinner = getByTestId('spinner');
      
      expect(button).toHaveClass('loading');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('WHEN user interacts with button', () => {
    it('THEN should dispatch click event', async () => {
      const mockClick = vi.fn();
      const { getByTestId, component } = render(Button);
      
      component.$on('click', mockClick);
      
      const button = getByTestId('button');
      await user.click(button);
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('THEN should not dispatch click when disabled', async () => {
      const mockClick = vi.fn();
      const { getByTestId, component } = render(Button, { disabled: true });
      
      component.$on('click', mockClick);
      
      const button = getByTestId('button');
      await user.click(button);
      
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('THEN should not dispatch click when loading', async () => {
      const mockClick = vi.fn();
      const { getByTestId, component } = render(Button, { loading: true });
      
      component.$on('click', mockClick);
      
      const button = getByTestId('button');
      await user.click(button);
      
      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('WHEN testing keyboard interactions', () => {
    it('THEN should handle Enter key', async () => {
      const mockClick = vi.fn();
      const { getByTestId, component } = render(Button);
      
      component.$on('click', mockClick);
      
      const button = getByTestId('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('THEN should handle Space key', async () => {
      const mockClick = vi.fn();
      const { getByTestId, component } = render(Button);
      
      component.$on('click', mockClick);
      
      const button = getByTestId('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

## Testing Reactive Statements

```svelte
<!-- src/components/Counter.svelte -->
<script>
  export let initialValue = 0;
  export let step = 1;
  export let max = 100;
  export let min = 0;
  
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let count = initialValue;
  
  // Reactive statements
  $: isAtMax = count >= max;
  $: isAtMin = count <= min;
  $: canIncrement = !isAtMax;
  $: canDecrement = !isAtMin;
  
  // Reactive side effects
  $: if (count !== initialValue) {
    dispatch('change', { count, previous: count - step });
  }
  
  $: if (isAtMax) {
    dispatch('max-reached', { count });
  }
  
  $: if (isAtMin) {
    dispatch('min-reached', { count });
  }
  
  function increment() {
    if (canIncrement) {
      count += step;
    }
  }
  
  function decrement() {
    if (canDecrement) {
      count -= step;
    }
  }
  
  function reset() {
    count = initialValue;
  }
</script>

<div class="counter" data-testid="counter">
  <button 
    on:click={decrement} 
    disabled={!canDecrement}
    data-testid="decrement"
  >
    -
  </button>
  
  <span class="count" data-testid="count">{count}</span>
  
  <button 
    on:click={increment} 
    disabled={!canIncrement}
    data-testid="increment"
  >
    +
  </button>
  
  <button on:click={reset} data-testid="reset">Reset</button>
  
  {#if isAtMax}
    <div class="message max" data-testid="max-message">Maximum reached!</div>
  {/if}
  
  {#if isAtMin}
    <div class="message min" data-testid="min-message">Minimum reached!</div>
  {/if}
</div>
```

```javascript
// src/components/Counter.test.js
import { render, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Counter from './Counter.svelte';

describe('GIVEN Counter component', () => {
  const user = userEvent.setup();

  describe('WHEN rendered with default props', () => {
    it('THEN should display initial count', () => {
      const { getByTestId } = render(Counter);
      
      const count = getByTestId('count');
      expect(count).toHaveTextContent('0');
    });

    it('THEN should have working increment/decrement buttons', () => {
      const { getByTestId } = render(Counter);
      
      const incrementBtn = getByTestId('increment');
      const decrementBtn = getByTestId('decrement');
      
      expect(incrementBtn).not.toBeDisabled();
      expect(decrementBtn).toBeDisabled(); // At minimum
    });
  });

  describe('WHEN interacting with counter', () => {
    it('THEN should increment count', async () => {
      const { getByTestId } = render(Counter, { initialValue: 5 });
      
      const incrementBtn = getByTestId('increment');
      const count = getByTestId('count');
      
      await user.click(incrementBtn);
      
      expect(count).toHaveTextContent('6');
    });

    it('THEN should decrement count', async () => {
      const { getByTestId } = render(Counter, { initialValue: 5 });
      
      const decrementBtn = getByTestId('decrement');
      const count = getByTestId('count');
      
      await user.click(decrementBtn);
      
      expect(count).toHaveTextContent('4');
    });

    it('THEN should reset to initial value', async () => {
      const { getByTestId } = render(Counter, { initialValue: 10 });
      
      const incrementBtn = getByTestId('increment');
      const resetBtn = getByTestId('reset');
      const count = getByTestId('count');
      
      // Change the count
      await user.click(incrementBtn);
      await user.click(incrementBtn);
      expect(count).toHaveTextContent('12');
      
      // Reset
      await user.click(resetBtn);
      expect(count).toHaveTextContent('10');
    });
  });

  describe('WHEN testing boundaries', () => {
    it('THEN should disable increment at maximum', async () => {
      const { getByTestId } = render(Counter, { 
        initialValue: 99, 
        max: 100 
      });
      
      const incrementBtn = getByTestId('increment');
      const count = getByTestId('count');
      
      await user.click(incrementBtn);
      
      expect(count).toHaveTextContent('100');
      expect(incrementBtn).toBeDisabled();
      expect(getByTestId('max-message')).toBeInTheDocument();
    });

    it('THEN should disable decrement at minimum', () => {
      const { getByTestId } = render(Counter, { 
        initialValue: 0, 
        min: 0 
      });
      
      const decrementBtn = getByTestId('decrement');
      
      expect(decrementBtn).toBeDisabled();
      expect(getByTestId('min-message')).toBeInTheDocument();
    });

    it('THEN should work with custom step', async () => {
      const { getByTestId } = render(Counter, { 
        initialValue: 10, 
        step: 5 
      });
      
      const incrementBtn = getByTestId('increment');
      const count = getByTestId('count');
      
      await user.click(incrementBtn);
      
      expect(count).toHaveTextContent('15');
    });
  });

  describe('WHEN testing events', () => {
    it('THEN should dispatch change event', async () => {
      const mockChange = vi.fn();
      const { getByTestId, component } = render(Counter, { initialValue: 5 });
      
      component.$on('change', mockChange);
      
      const incrementBtn = getByTestId('increment');
      await user.click(incrementBtn);
      
      expect(mockChange).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { count: 6, previous: 5 }
        })
      );
    });

    it('THEN should dispatch max-reached event', async () => {
      const mockMaxReached = vi.fn();
      const { getByTestId, component } = render(Counter, { 
        initialValue: 99, 
        max: 100 
      });
      
      component.$on('max-reached', mockMaxReached);
      
      const incrementBtn = getByTestId('increment');
      await user.click(incrementBtn);
      
      expect(mockMaxReached).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { count: 100 }
        })
      );
    });

    it('THEN should dispatch min-reached event', async () => {
      const mockMinReached = vi.fn();
      const { getByTestId, component } = render(Counter, { 
        initialValue: 1, 
        min: 0 
      });
      
      component.$on('min-reached', mockMinReached);
      
      const decrementBtn = getByTestId('decrement');
      await user.click(decrementBtn);
      
      expect(mockMinReached).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { count: 0 }
        })
      );
    });
  });
});
```

## Component Navigation Structure

### Framework-Specific Guides
- [Component Testing](./component-testing.md) - Comprehensive component testing patterns
- [Store Testing](./stores.md) - Svelte stores and state management testing
- [Integration Testing](./integration.md) - Full application integration tests
- [Mocking Strategies](./mocking.md) - Advanced mocking techniques

### Related Resources
- [Best Practices](../../common/best-practices.md) - Universal testing principles
- [Testing Principles](../../common/testing-principles.md) - Core testing concepts
- [Tool Configuration](../../tools/) - Setup guides for testing tools

## Quick Reference

### Essential Testing Patterns
```javascript
// Basic component rendering
const { getByTestId } = render(Component, { prop: 'value' });

// Testing events
component.$on('custom-event', mockFn);
await user.click(getByTestId('button'));

// Testing slots
render(Component, { $$slots: { default: 'Slot content' } });

// Testing reactive statements
expect(getByTestId('element')).toHaveClass('active');

// Testing stores
const store = writable(initialValue);
const { getByTestId } = render(Component, { store });
```

### Common Assertions
```javascript
// DOM presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Text content
expect(element).toHaveTextContent('Expected text');

// Attributes and classes
expect(element).toHaveClass('active');
expect(element).toHaveAttribute('aria-label', 'Close');

// Form elements
expect(input).toHaveValue('test');
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();
```