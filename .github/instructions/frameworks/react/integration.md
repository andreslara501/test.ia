# React Integration Testing

This guide covers integration testing for React applications, focusing on testing multiple components working together.

## Component Integration Testing

### Testing Parent-Child Communication
```typescript
// components/UserProfile.tsx
import React, { useState } from 'react';
import { UserDetails } from './UserDetails';
import { UserActions } from './UserActions';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onDelete: (userId: string) => void;
}

export function UserProfile({ user, onUpdate, onDelete }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updatedUser: User) => {
    onUpdate(updatedUser);
    setIsEditing(false);
  };

  return (
    <div data-testid="user-profile">
      <UserDetails 
        user={user} 
        isEditing={isEditing}
        onSave={handleSave}
      />
      <UserActions 
        userId={user.id}
        isActive={user.isActive}
        onEdit={() => setIsEditing(true)}
        onDelete={onDelete}
      />
    </div>
  );
}

// components/UserProfile.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

// Mock child components to focus on integration
jest.mock('./UserDetails', () => ({
  UserDetails: ({ user, isEditing, onSave }: any) => (
    <div data-testid="user-details">
      <span>{user.name}</span>
      {isEditing && (
        <button 
          onClick={() => onSave({ ...user, name: 'Updated Name' })}
          data-testid="save-button"
        >
          Save
        </button>
      )}
    </div>
  )
}));

jest.mock('./UserActions', () => ({
  UserActions: ({ userId, onEdit, onDelete }: any) => (
    <div data-testid="user-actions">
      <button onClick={onEdit} data-testid="edit-button">Edit</button>
      <button onClick={() => onDelete(userId)} data-testid="delete-button">Delete</button>
    </div>
  )
}));

describe('GIVEN UserProfile integration', () => {
  const mockUser = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true
  };

  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnDelete.mockClear();
  });

  test('WHEN edit button is clicked THEN should enable editing mode', async () => {
    const user = userEvent.setup();
    
    render(
      <UserProfile 
        user={mockUser} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    );

    // Initially not in editing mode
    expect(screen.queryByTestId('save-button')).not.toBeInTheDocument();

    // Click edit button
    await user.click(screen.getByTestId('edit-button'));

    // Should now show save button (editing mode)
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
  });

  test('WHEN save is clicked THEN should call onUpdate and exit editing mode', async () => {
    const user = userEvent.setup();
    
    render(
      <UserProfile 
        user={mockUser} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    );

    // Enter editing mode
    await user.click(screen.getByTestId('edit-button'));
    
    // Save changes
    await user.click(screen.getByTestId('save-button'));

    // Should call onUpdate with updated user
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockUser,
      name: 'Updated Name'
    });

    // Should exit editing mode
    await waitFor(() => {
      expect(screen.queryByTestId('save-button')).not.toBeInTheDocument();
    });
  });

  test('WHEN delete button is clicked THEN should call onDelete', async () => {
    const user = userEvent.setup();
    
    render(
      <UserProfile 
        user={mockUser} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    );

    await user.click(screen.getByTestId('delete-button'));

    expect(mockOnDelete).toHaveBeenCalledWith('123');
  });
});
```

## Testing with React Router

### Router Integration Testing
```typescript
// components/Navigation.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  return (
    <nav data-testid="navigation">
      <Link 
        to="/" 
        className={location.pathname === '/' ? 'active' : ''}
        data-testid="home-link"
      >
        Home
      </Link>
      <Link 
        to="/users" 
        className={location.pathname === '/users' ? 'active' : ''}
        data-testid="users-link"
      >
        Users
      </Link>
      <Link 
        to="/settings" 
        className={location.pathname === '/settings' ? 'active' : ''}
        data-testid="settings-link"
      >
        Settings
      </Link>
    </nav>
  );
}

// components/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './Navigation';
import { HomePage } from './HomePage';
import { UsersPage } from './UsersPage';
import { SettingsPage } from './SettingsPage';

export function App() {
  return (
    <div>
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

// components/App.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { App } from './App';

// Mock page components
jest.mock('./HomePage', () => ({
  HomePage: () => <div data-testid="home-page">Home Page</div>
}));

jest.mock('./UsersPage', () => ({
  UsersPage: () => <div data-testid="users-page">Users Page</div>
}));

jest.mock('./SettingsPage', () => ({
  SettingsPage: () => <div data-testid="settings-page">Settings Page</div>
}));

function renderWithRouter(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>
  );
}

describe('GIVEN App with routing', () => {
  test('WHEN app loads THEN should show home page by default', () => {
    renderWithRouter();
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('home-link')).toHaveClass('active');
  });

  test('WHEN starting at /users THEN should show users page', () => {
    renderWithRouter(['/users']);
    
    expect(screen.getByTestId('users-page')).toBeInTheDocument();
    expect(screen.getByTestId('users-link')).toHaveClass('active');
  });

  test('WHEN navigation link is clicked THEN should navigate to page', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Initially on home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();

    // Navigate to users
    await user.click(screen.getByTestId('users-link'));

    expect(screen.getByTestId('users-page')).toBeInTheDocument();
    expect(screen.getByTestId('users-link')).toHaveClass('active');
    expect(screen.getByTestId('home-link')).not.toHaveClass('active');
  });

  test('WHEN navigating between pages THEN should update active states', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // Go to settings
    await user.click(screen.getByTestId('settings-link'));
    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.getByTestId('settings-link')).toHaveClass('active');

    // Go back to home
    await user.click(screen.getByTestId('home-link'));
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('home-link')).toHaveClass('active');
    expect(screen.getByTestId('settings-link')).not.toHaveClass('active');
  });
});
```

## Testing with Context Providers

### Multi-Provider Integration
```typescript
// providers/AppProviders.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';

interface AppProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export function AppProviders({ children, queryClient }: AppProvidersProps) {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// components/UserDashboard.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useUsers } from '../hooks/useUsers';

export function UserDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { data: users, isLoading, error } = useUsers();

  if (!user) {
    return <div data-testid="login-required">Please log in</div>;
  }

  if (isLoading) {
    return <div data-testid="loading">Loading users...</div>;
  }

  if (error) {
    return <div data-testid="error">Error loading users</div>;
  }

  return (
    <div data-testid="user-dashboard" className={`theme-${theme}`}>
      <h1>Welcome, {user.name}!</h1>
      <div data-testid="users-list">
        {users?.map(user => (
          <div key={user.id} data-testid={`user-${user.id}`}>
            {user.name}
          </div>
        ))}
      </div>
    </div>
  );
}

// components/UserDashboard.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from 'react-query';
import { AppProviders } from '../providers/AppProviders';
import { UserDashboard } from './UserDashboard';

// Mock hooks
const mockUseAuth = jest.fn();
const mockUseTheme = jest.fn();
const mockUseUsers = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../hooks/useTheme', () => ({
  useTheme: () => mockUseTheme()
}));

jest.mock('../hooks/useUsers', () => ({
  useUsers: () => mockUseUsers()
}));

function renderWithProviders(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <AppProviders queryClient={queryClient}>
      {children}
    </AppProviders>
  );
}

describe('GIVEN UserDashboard integration', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({ theme: 'light' });
  });

  test('WHEN user is not authenticated THEN should show login required', () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockUseUsers.mockReturnValue({ data: null, isLoading: false, error: null });

    renderWithProviders(<UserDashboard />);

    expect(screen.getByTestId('login-required')).toBeInTheDocument();
  });

  test('WHEN data is loading THEN should show loading state', () => {
    mockUseAuth.mockReturnValue({ 
      user: { id: '1', name: 'John Doe' } 
    });
    mockUseUsers.mockReturnValue({ 
      data: null, 
      isLoading: true, 
      error: null 
    });

    renderWithProviders(<UserDashboard />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  test('WHEN there is an error THEN should show error state', () => {
    mockUseAuth.mockReturnValue({ 
      user: { id: '1', name: 'John Doe' } 
    });
    mockUseUsers.mockReturnValue({ 
      data: null, 
      isLoading: false, 
      error: new Error('Failed to fetch') 
    });

    renderWithProviders(<UserDashboard />);

    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  test('WHEN data loads successfully THEN should show dashboard with users', async () => {
    const mockUser = { id: '1', name: 'John Doe' };
    const mockUsers = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' }
    ];

    mockUseAuth.mockReturnValue({ user: mockUser });
    mockUseUsers.mockReturnValue({ 
      data: mockUsers, 
      isLoading: false, 
      error: null 
    });

    renderWithProviders(<UserDashboard />);

    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
    expect(screen.getByTestId('user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
  });

  test('WHEN theme is set THEN should apply theme class', () => {
    mockUseAuth.mockReturnValue({ 
      user: { id: '1', name: 'John Doe' } 
    });
    mockUseUsers.mockReturnValue({ 
      data: [], 
      isLoading: false, 
      error: null 
    });
    mockUseTheme.mockReturnValue({ theme: 'dark' });

    renderWithProviders(<UserDashboard />);

    expect(screen.getByTestId('user-dashboard')).toHaveClass('theme-dark');
  });
});
```

## API Integration Testing

### Testing Real API Calls
```typescript
// services/userService.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  
  return response.json();
}

// components/UserManager.tsx
import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser, User } from '../services/userService';

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await fetchUsers();
      setUsers(userData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newUser = await createUser({
        name: newUserName,
        email: newUserEmail
      });
      
      setUsers(prev => [...prev, newUser]);
      setNewUserName('');
      setNewUserEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div data-testid="error">
        Error: {error}
        <button onClick={loadUsers} data-testid="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div data-testid="user-manager">
      <form onSubmit={handleCreateUser} data-testid="create-user-form">
        <input
          type="text"
          placeholder="Name"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
          data-testid="name-input"
        />
        <input
          type="email"
          placeholder="Email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          data-testid="email-input"
        />
        <button type="submit" data-testid="create-button">
          Create User
        </button>
      </form>

      <div data-testid="users-list">
        {users.map(user => (
          <div key={user.id} data-testid={`user-${user.id}`}>
            <span>{user.name}</span> - <span>{user.email}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// components/UserManager.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { UserManager } from './UserManager';

// Setup MSW server
const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ])
    );
  }),

  rest.post('/api/users', (req, res, ctx) => {
    const { name, email } = req.body as any;
    return res(
      ctx.json({
        id: '3',
        name,
        email
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GIVEN UserManager integration with API', () => {
  test('WHEN component loads THEN should fetch and display users', async () => {
    render(<UserManager />);

    // Should show loading first
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Should load users
    await waitFor(() => {
      expect(screen.getByTestId('user-manager')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('WHEN API returns error THEN should show error with retry', async () => {
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    render(<UserManager />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to fetch users/)).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  test('WHEN retry button is clicked THEN should refetch users', async () => {
    const user = userEvent.setup();

    // First request fails
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserManager />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    // Reset to successful response
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(
          ctx.json([
            { id: '1', name: 'John Doe', email: 'john@example.com' }
          ])
        );
      })
    );

    await user.click(screen.getByTestId('retry-button'));

    await waitFor(() => {
      expect(screen.getByTestId('user-manager')).toBeInTheDocument();
    });

    expect(screen.getByTestId('user-1')).toBeInTheDocument();
  });

  test('WHEN new user is created THEN should add to list', async () => {
    const user = userEvent.setup();

    render(<UserManager />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('user-manager')).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByTestId('name-input'), 'New User');
    await user.type(screen.getByTestId('email-input'), 'new@example.com');

    // Submit form
    await user.click(screen.getByTestId('create-button'));

    // Should add new user to list
    await waitFor(() => {
      expect(screen.getByTestId('user-3')).toBeInTheDocument();
    });

    expect(screen.getByText('New User')).toBeInTheDocument();
    expect(screen.getByText('new@example.com')).toBeInTheDocument();

    // Form should be cleared
    expect(screen.getByTestId('name-input')).toHaveValue('');
    expect(screen.getByTestId('email-input')).toHaveValue('');
  });

  test('WHEN create user fails THEN should show error', async () => {
    const user = userEvent.setup();

    server.use(
      rest.post('/api/users', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ message: 'Validation error' }));
      })
    );

    render(<UserManager />);

    await waitFor(() => {
      expect(screen.getByTestId('user-manager')).toBeInTheDocument();
    });

    // Fill and submit form
    await user.type(screen.getByTestId('name-input'), 'Test User');
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('create-button'));

    // Should show error
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to create user/)).toBeInTheDocument();
  });
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Hooks Testing](./hooks-testing.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)