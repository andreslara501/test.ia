# REACT TESTING IMPLEMENTATION

# UNIVERSAL REACT TESTING INSTRUCTIONS

## Automated Setup for Testing

Before creating or running tests, ensure you install the development dependencies
```bash
npm install
```

Before creating or running tests, always install the following dependencies and type definitions (adjust versions as needed):
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event@^14.6.1 @types/jest@^30.0.0 @types/testing-library__jest-dom@^5.14.9 @types/testing-library__user-event@^4.1.1
```

You have access to comprehensive testing documentation in `.github/instructions/frameworks/react/`.

**TASK**: Generate comprehensive tests for EXISTING React components and functionality in any React project.

## TypeScript Configuration for Custom Matchers

Create or update a `setupTests.d.ts` file in your project root with:

```ts
import '@testing-library/jest-dom';
```
Ensure this file is included in your `tsconfig.json` under `"include"`.

## Robust Testing Patterns

- Use semantic queries for robustness (e.g., `getByRole`, `getByLabelText`).
- For text split across multiple elements, use `getAllByText` with a function matcher:

```js
const matches = screen.getAllByText((_, element) =>
  !!(element && element.textContent && element.textContent.replace(/\s+/g, ' ').includes('expected text'))
);
expect(matches.length).toBeGreaterThan(0);
```

## Automated Error Resolution Workflow

1. Install all required dependencies and types.
2. Run all tests (`npm run test`).
3. If errors occur:
   - Install missing dependencies.
   - Fix TypeScript configuration for custom matchers.
   - Adjust test matchers for robustness.
   - Re-run tests.
4. Repeat until all tests pass.

## Project Analysis Steps

1. Scan the `src/` directory for `.tsx`, `.jsx`, `.ts` files.
2. Identify main application components and custom hooks.
3. Check for context providers, state management, or routing.
4. Prioritize tests for business-critical functionality.

## Constraints

- ❌ Do NOT create new components, hooks, or features.
- ✅ ONLY create test files for existing code.
- ✅ Focus on testing behavior of existing functionality.
- ✅ Use React Testing Library best practices.
- ✅ Follow Given-When-Then test naming convention.
- ✅ Achieve comprehensive coverage of existing code.
- ✅ Start with most critical/business-important components first.