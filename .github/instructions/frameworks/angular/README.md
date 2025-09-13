# Angular Testing Guide

Welcome to the Angular testing documentation. This guide covers comprehensive testing strategies for Angular applications using Angular Testing Utilities, Jasmine, and Karma/Jest.

## Quick Start

### Installation and Setup

#### Default Angular Setup (Jasmine + Karma)
```bash
ng new my-app
cd my-app
npm test
```

#### Alternative Setup with Jest
```bash
ng add @briebug/jest-schematic
```

### Basic Angular Test Configuration

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