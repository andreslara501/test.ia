# React Component Testing

This guide covers comprehensive patterns for testing React components using React Testing Library.

## Basic Component Testing

### Simple Component Test
```typescript
import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('GIVEN Button component', () => {
  test('WHEN rendered THEN should display text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('WHEN clicked THEN should call onClick handler', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('WHEN disabled THEN should not be clickable', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Props Testing

### Testing Different Prop Combinations
```typescript
describe('GIVEN Button with various props', () => {
  test('WHEN variant is primary THEN should have primary styles', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  test('WHEN size is large THEN should have large styles', () => {
    render(<Button size="large">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-large');
  });

  test('WHEN loading is true THEN should show loading indicator', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Form Testing

### Input Components
```typescript
import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { TextInput } from './TextInput';

describe('GIVEN TextInput component', () => {
  test('WHEN user types THEN should update value', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<TextInput onChange={handleChange} placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText(/enter text/i);
    await user.type(input, 'Hello world');
    
    expect(input).toHaveValue('Hello world');
    expect(handleChange).toHaveBeenCalledWith('Hello world');
  });

  test('WHEN has error THEN should display error message', () => {
    render(
      <TextInput 
        error="This field is required" 
        placeholder="Enter text" 
      />
    );
    
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
```

### Form Submission
```typescript
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';

describe('GIVEN ContactForm component', () => {
  test('WHEN valid form is submitted THEN should call onSubmit', async () => {
    const handleSubmit = jest.fn();
    const user = userEvent.setup();
    
    render(<ContactForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      });
    });
  });

  test('WHEN required fields are empty THEN should show validation errors', async () => {
    const user = userEvent.setup();
    
    render(<ContactForm onSubmit={jest.fn()} />);
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });
});
```

## State Management Testing

### Component with State
```typescript
import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('GIVEN Counter component', () => {
  test('WHEN increment button is clicked THEN should increase count', async () => {
    const user = userEvent.setup();
    
    render(<Counter initialCount={0} />);
    
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
    
    await user.click(screen.getByRole('button', { name: /increment/i }));
    
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  test('WHEN decrement button is clicked THEN should decrease count', async () => {
    const user = userEvent.setup();
    
    render(<Counter initialCount={5} />);
    
    await user.click(screen.getByRole('button', { name: /decrement/i }));
    
    expect(screen.getByText('Count: 4')).toBeInTheDocument();
  });
});
```

## Async Components

### Loading States
```typescript
import { render, screen, waitFor } from '../test-utils';
import { UserProfile } from './UserProfile';

// Mock the API
const mockFetchUser = jest.fn();
jest.mock('../api/userService', () => ({
  fetchUser: mockFetchUser
}));

describe('GIVEN UserProfile component', () => {
  test('WHEN user data is loading THEN should show loading indicator', () => {
    mockFetchUser.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<UserProfile userId="123" />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('WHEN user data loads successfully THEN should display user info', async () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' };
    mockFetchUser.mockResolvedValue(mockUser);
    
    render(<UserProfile userId="123" />);
    
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  test('WHEN user data fails to load THEN should show error message', async () => {
    mockFetchUser.mockRejectedValue(new Error('Failed to fetch'));
    
    render(<UserProfile userId="123" />);
    
    expect(await screen.findByText(/error loading user/i)).toBeInTheDocument();
  });
});
```

## Context Testing

### Component with Context
```typescript
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from './ThemeContext';
import { ThemedButton } from './ThemedButton';

describe('GIVEN ThemedButton component', () => {
  test('WHEN dark theme is provided THEN should use dark styles', () => {
    render(
      <ThemeProvider theme="dark">
        <ThemedButton>Click me</ThemedButton>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('button')).toHaveClass('btn-dark');
  });

  test('WHEN light theme is provided THEN should use light styles', () => {
    render(
      <ThemeProvider theme="light">
        <ThemedButton>Click me</ThemedButton>
      </ThemeProvider>
    );
    
    expect(screen.getByRole('button')).toHaveClass('btn-light');
  });
});
```

## Conditional Rendering

### Testing Different States
```typescript
describe('GIVEN UserStatus component', () => {
  test('WHEN user is online THEN should show online indicator', () => {
    render(<UserStatus user={{ name: 'John', isOnline: true }} />);
    
    expect(screen.getByText(/john/i)).toBeInTheDocument();
    expect(screen.getByText(/online/i)).toBeInTheDocument();
    expect(screen.getByTestId('online-indicator')).toHaveClass('status-online');
  });

  test('WHEN user is offline THEN should show offline indicator', () => {
    render(<UserStatus user={{ name: 'John', isOnline: false }} />);
    
    expect(screen.getByText(/john/i)).toBeInTheDocument();
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    expect(screen.getByTestId('online-indicator')).toHaveClass('status-offline');
  });

  test('WHEN no user is provided THEN should show placeholder', () => {
    render(<UserStatus user={null} />);
    
    expect(screen.getByText(/no user selected/i)).toBeInTheDocument();
  });
});
```

## List Components

### Dynamic Lists
```typescript
describe('GIVEN UserList component', () => {
  test('WHEN users array is provided THEN should render all users', () => {
    const users = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Bob Johnson' }
    ];
    
    render(<UserList users={users} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  test('WHEN users array is empty THEN should show empty state', () => {
    render(<UserList users={[]} />);
    
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  test('WHEN user is clicked THEN should call onUserSelect', async () => {
    const handleUserSelect = jest.fn();
    const users = [{ id: 1, name: 'John Doe' }];
    const user = userEvent.setup();
    
    render(<UserList users={users} onUserSelect={handleUserSelect} />);
    
    await user.click(screen.getByText('John Doe'));
    
    expect(handleUserSelect).toHaveBeenCalledWith(users[0]);
  });
});
```

## Accessibility Testing

### ARIA Attributes
```typescript
describe('GIVEN Modal component', () => {
  test('WHEN modal is open THEN should have proper ARIA attributes', () => {
    render(<Modal isOpen={true} title="Test Modal">Content</Modal>);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    
    expect(screen.getByText('Test Modal')).toHaveAttribute('id');
  });

  test('WHEN modal is closed THEN should not be visible to screen readers', () => {
    render(<Modal isOpen={false} title="Test Modal">Content</Modal>);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

## Common Patterns

### Testing with Multiple Variants
```typescript
describe.each([
  ['primary', 'btn-primary'],
  ['secondary', 'btn-secondary'],
  ['danger', 'btn-danger']
])('GIVEN Button with %s variant', (variant, expectedClass) => {
  test(`THEN should have ${expectedClass} class`, () => {
    render(<Button variant={variant}>Button</Button>);
    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });
});
```

### Custom Matchers
```typescript
// In setupTests.js
expect.extend({
  toBeVisible(received) {
    const pass = received && received.style.display !== 'none';
    return {
      message: () => `expected element to ${pass ? 'not ' : ''}be visible`,
      pass,
    };
  },
});

// Usage in tests
expect(screen.getByTestId('modal')).toBeVisible();
```

## Related Resources
- [Hooks Testing](./hooks-testing.md)
- [Integration Testing](./integration.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)