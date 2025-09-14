# Angular Testing Guide - Pragmatic Implementation Strategy

Welcome to the Angular testing documentation. This guide focuses on **pragmatic testing strategies** for existing Angular projects with minimal or no test coverage.

## 🎯 Core Philosophy

**Start Small, Build Incrementally**: Instead of attempting 100% coverage immediately, focus on creating a solid foundation that can be expanded systematically.

## 📋 Pre-Implementation Checklist

### CRITICAL: Project Analysis Phase

Before writing ANY tests, complete these steps:

1. **📊 Codebase Inventory**
   ```bash
   # Scan the entire project structure
   find src/app -name "*.ts" | head -20
   find src/app -name "*.component.ts" | wc -l
   find src/app -name "*.service.ts" | wc -l
   ```

2. **🔍 Dependency Mapping**
   - Identify all shared components (custom input, button, modal components, etc.)
   - Map interface definitions and their actual field names
   - Document service method signatures
   - List all custom types and enums

3. **🏗️ Architecture Understanding**
   - Standalone components vs NgModule structure
   - Signal-based vs Observable patterns
   - Form field naming conventions (could be any language)
   - Route structure and guards

4. **⚠️ Common Pitfall Prevention**
   - Field name mismatches (check your actual form field names)
   - Missing component dependencies in tests
   - Injection context errors (toObservable, inject calls)
   - Template structure vs test expectations
   - **NEW**: NgRx Store provider missing (NullInjectorError)
   - **NEW**: ControlValueAccessor issues with mock components
   - **NEW**: Facade observable properties not mocked

## Quick Start - Incremental Approach

### Phase 1: Foundation Setup (Week 1)

#### Target: 3-5 Critical Tests
Focus on the most business-critical components:

```typescript
// Priority Order (adapt to your business domain):
// 1. Core authentication/authorization components  
// 2. Main business/domain components (orders, products, users, etc.)
// 3. Data entry forms and validation
// 4. Navigation and layout components
// 5. API services and data processing
```

#### Test Configuration Validation
```bash
# Verify test environment works
ng test --watch=false --browsers=ChromeHeadless
```

### Phase 2: Service Layer (Week 2)

#### Target: Core Services Testing
```typescript
// Focus on your core business services:
- Primary data services (UserService, ProductService, etc.)
- HTTP services with real API contracts
- Data transformation and business logic services
- Error handling patterns
```

### Phase 3: Component Integration (Week 3-4)

#### Target: Component + Service Integration
```typescript
// Test realistic scenarios:
- Form submission flows
- Navigation patterns
- Error state handling
- Loading states
```

## 🛠️ Implementation Strategy

### Critical Success Factors (Learned from Real Debugging)

1. **Always Read First** - Analyze components/services before writing tests
2. **Start Small** - 3-5 working tests beats 50 broken ones
3. **Include Dependencies** - Child components, services, interfaces
4. **Use Real Data** - Actual field names, endpoints, data structures
5. **Verify Constantly** - Run tests after each change
6. **NEW**: **NgRx Setup** - Always provide MockStore for components using Store
7. **NEW**: **Real Components for Forms** - Never mock ControlValueAccessor components
8. **NEW**: **Complete Facade Mocking** - Mock ALL observable properties on facades

### Documentation Structure

```
frameworks/angular/
├── README.md              ← You are here - start overview
├── component-testing.md   ← Practical component testing patterns
├── service-testing.md     ← Real-world service testing  
├── integration.md         ← Component + service integration
├── mocking.md            ← Service and HTTP mocking (includes NgRx)
└── common-errors.md      ← Error catalog with solutions (includes NgRx Store errors)
```

## 🚨 CRITICAL: NgRx Testing Requirements

**If your project uses NgRx Store**, you MUST include proper Store mocking:

```typescript
// ✅ Required imports for NgRx testing
import { MockStore, provideMockStore } from '@ngrx/store/testing';

// ✅ Basic NgRx test setup
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [ComponentName],
    providers: [
      provideMockStore({
        initialState: {
          // Define your app's initial state structure
          // Adapt these to match your application's state
          featureA: { 
            data: null, 
            loading: false, 
            error: null 
          },
          featureB: {
            items: [],
            selectedItem: null,
            filters: {}
          }
          // Add your app's state slices here
        }
      })
    ]
  });
});
```

**Common NgRx Errors to Prevent:**
- `NullInjectorError: No provider for Store!`
- `Cannot read properties of undefined (reading 'subscribe')`
- Facade observable properties not mocked

See [mocking.md](./mocking.md) for complete NgRx testing patterns.

### Quick Start Commands

```bash
# 1. Analyze project structure
find src/app -name "*.component.ts" | head -10
find src/app -name "*.service.ts" | head -5

# 2. Run existing tests (see what breaks)
ng test --watch=false

# 3. Start with one simple test
# Create minimal component test following component-testing.md patterns

# 4. Build incrementally  
# Add one test at a time, verify each works
```

#### Karma Configuration (`karma.conf.js`)
```javascript
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-headless'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ]
    }
  });
};
```

#### Jest Configuration (`jest.config.js`)
```javascript
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: [
    '<rootDir>/src/app/**/*.spec.ts',
    '<rootDir>/src/app/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.module.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary', 'lcov'],
  testEnvironment: 'jsdom'
};
```

## Angular Testing Utilities

### Essential Testing Imports
```typescript
// src/app/testing/test-utils.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Helper function for component testing
export function createComponent<T>(
  component: any,
  imports: any[] = [],
  providers: any[] = []
): { fixture: ComponentFixture<T>; component: T; debugElement: DebugElement } {
  
  TestBed.configureTestingModule({
    declarations: [component],
    imports: [NoopAnimationsModule, ...imports],
    providers: [...providers]
  });

  const fixture = TestBed.createComponent(component);
  const componentInstance = fixture.componentInstance;
  const debugElement = fixture.debugElement;

  return {
    fixture,
    component: componentInstance,
    debugElement
  };
}

// Helper for finding elements
export function findElement(
  fixture: ComponentFixture<any>,
  selector: string
): DebugElement {
  return fixture.debugElement.query(By.css(selector));
}

export function findElements(
  fixture: ComponentFixture<any>,
  selector: string
): DebugElement[] {
  return fixture.debugElement.queryAll(By.css(selector));
}

// Helper for getting native element text
export function getElementText(
  fixture: ComponentFixture<any>,
  selector: string
): string {
  const element = findElement(fixture, selector);
  return element ? element.nativeElement.textContent.trim() : '';
}
```

### Common Testing Patterns
```typescript
// Basic component test structure
describe('GIVEN ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ComponentName],
      imports: [CommonModule, FormsModule],
      providers: [ServiceName]
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it('WHEN condition THEN expectation', () => {
    // Arrange
    component.property = 'value';
    
    // Act
    fixture.detectChanges();
    
    // Assert
    expect(component.result).toBe('expected');
  });
});
```

## Directory Structure

```
frameworks/angular/
├── README.md                # This file
├── component-testing.md     # Angular component testing patterns
├── service-testing.md       # Service and dependency injection testing
├── integration.md          # Router, HTTP, and integration testing
└── mocking.md              # Angular-specific mocking strategies
```

## Framework Features

### Angular Testing Utilities
- TestBed for module configuration
- ComponentFixture for component testing
- DebugElement for DOM interaction
- Dependency injection testing
- Change detection strategies

### Component Testing
- Input/Output property testing
- Event binding testing
- Template testing
- Lifecycle hook testing
- Directive testing

### Service Testing
- Dependency injection testing
- HTTP service testing
- Observable testing
- Error handling testing

### Integration Testing
- Router testing
- HTTP interceptor testing
- Guard testing
- Resolver testing

## Navigation

| Topic | Description |
|-------|-------------|
| [Component Testing](./component-testing.md) | Angular component testing with TestBed |
| [Service Testing](./service-testing.md) | Testing services, HTTP, and dependency injection |
| [Integration Testing](./integration.md) | Router, guards, and application integration |
| [Mocking Strategies](./mocking.md) | Angular-specific mocking patterns |

## Related Resources
- [Testing Principles](../../common/testing-principles.md)
- [Best Practices](../../common/best-practices.md)
- [React Testing](../react/README.md)
- [Vue Testing](../vue/README.md)
- [Svelte Testing](../svelte/README.md)

## Official Angular Resources
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Angular Testing Utilities API](https://angular.io/api/core/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Documentation](https://karma-runner.github.io/)
