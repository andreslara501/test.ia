# Initial Prompts for Testing Implementation

Quick, framework-specific prompts designed for rapid testing implementation using the comprehensive documentation in `.github/instructions/`.

## 🚀 Framework-Specific Prompts

### [React Testing Prompt](./react-prompt.md)
**Focus**: React Testing Library, hooks, context, React Router
- Component testing with user interactions
- Custom hooks testing
- Context providers and state management
- API integration and async operations

### [Vue Testing Prompt](./vue-prompt.md)  
**Focus**: Vue Test Utils, Composition API, Pinia, Vue Router
- Component testing with Vue Test Utils (official recommendation)
- Composables and reactivity testing
- Pinia store testing
- Vue Router integration

### [Angular Testing Prompt](./angular-prompt.md)
**Focus**: TestBed, dependency injection, HttpClient, Angular Router
- Component testing with TestBed
- Service testing with dependency injection
- HTTP testing with HttpClientTestingModule
- Guards, resolvers, and routing

### [Svelte Testing Prompt](./svelte-prompt.md)
**Focus**: Testing Library Svelte, stores, SvelteKit
- Component testing with event handling
- Svelte stores and state management
- SvelteKit pages and layouts
- Actions and transitions

## 🎯 How to Use

1. **Choose your framework** from the options above
2. **Copy the prompt** from the corresponding file
3. **Paste into your AI assistant** (GitHub Copilot, Claude, ChatGPT, etc.)
4. **Point to your project** that contains the `.github/instructions/` documentation
5. **Watch as comprehensive tests are generated** following the established patterns

## ✨ Benefits

- **Framework-Optimized**: Each prompt uses the best practices for that specific framework
- **Documentation-Driven**: Leverages the comprehensive documentation system
- **Rapid Implementation**: Direct, actionable prompts for quick execution
- **Consistent Quality**: All tests follow the same high standards and patterns
- **Complete Coverage**: Covers components, services, integration, and configuration

## 🔧 Expected Output

Each prompt will generate:
- Complete test configuration
- Component/service tests with 80%+ coverage
- Integration tests for critical workflows
- Proper mocking strategies
- CI/CD ready test suite

## 📚 Documentation Reference

All prompts reference the modular documentation in:
```
.github/instructions/
├── frameworks/[framework]/    # Framework-specific guides
├── patterns/                  # Universal testing patterns
├── tools/                     # Tool configurations
└── common/                    # Core principles
```

---

**Ready to implement comprehensive testing in your project? Choose your framework and get started!**