# Svelte Mocking Strategies

This guide covers comprehensive mocking strategies for Svelte applications, including mocking modules, stores, SvelteKit features, external APIs, and third-party libraries.

## Module Mocking

### Mocking Svelte Stores
```javascript
// src/stores/__mocks__/user.js
import { writable } from 'svelte/store';

const mockUser = writable({
  data: null,
  loading: false,
  error: null
});

const mockIsAuthenticated = writable(false);
const mockUserProfile = writable(null);

export const user = {
  subscribe: mockUser.subscribe,
  login: vi.fn(() => Promise.resolve()),
  logout: vi.fn(() => Promise.resolve()),
  fetchProfile: vi.fn(() => Promise.resolve()),
  clearError: vi.fn()
};

export const isAuthenticated = mockIsAuthenticated;
export const userProfile = mockUserProfile;

// Helper functions for tests
export const __setMockUser = (userData) => {
  mockUser.set(userData);
  mockUserProfile.set(userData.data);
  mockIsAuthenticated.set(userData.data !== null);
};

export const __setMockAuthenticated = (authenticated) => {
  mockIsAuthenticated.set(authenticated);
};

export const __resetMocks = () => {
  mockUser.set({ data: null, loading: false, error: null });
  mockIsAuthenticated.set(false);
  mockUserProfile.set(null);
  vi.clearAllMocks();
};
```

```javascript
// src/components/UserProfile.test.js
import { render } from '@testing-library/svelte';
import UserProfile from './UserProfile.svelte';

// Mock the user store
vi.mock('../stores/user.js', () => import('../stores/__mocks__/user.js'));

import { __setMockUser, __resetMocks } from '../stores/user.js';

describe('GIVEN UserProfile component', () => {
  beforeEach(() => {
    __resetMocks();
  });

  describe('WHEN user is authenticated', () => {
    it('THEN should display user information', () => {
      __setMockUser({
        data: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'avatar-url'
        },
        loading: false,
        error: null
      });

      const { getByTestId } = render(UserProfile);
      
      expect(getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(getByTestId('user-email')).toHaveTextContent('john@example.com');
    });
  });
});
```

### Mocking SvelteKit Modules
```javascript
// src/routes/__mocks__/$app.js

// Mock $app/stores
export const page = {
  subscribe: vi.fn((callback) => {
    callback({
      url: new URL('http://localhost:3000/test'),
      params: {},
      route: { id: '/test' },
      status: 200,
      error: null,
      data: {},
      form: null
    });
    return () => {};
  })
};

export const navigating = {
  subscribe: vi.fn((callback) => {
    callback(null);
    return () => {};
  })
};

export const updated = {
  subscribe: vi.fn((callback) => {
    callback(false);
    return () => {};
  })
};

// Mock $app/navigation
export const goto = vi.fn(() => Promise.resolve());
export const invalidate = vi.fn(() => Promise.resolve());
export const invalidateAll = vi.fn(() => Promise.resolve());
export const preloadData = vi.fn(() => Promise.resolve());
export const preloadCode = vi.fn(() => Promise.resolve());
export const beforeNavigate = vi.fn();
export const afterNavigate = vi.fn();

// Mock $app/environment
export const browser = true;
export const building = false;
export const dev = true;
export const version = '1.0.0';

// Helper to update page store
export const __setPageData = (pageData) => {
  page.subscribe.mockImplementation((callback) => {
    callback(pageData);
    return () => {};
  });
};
```

```javascript
// src/components/Navigation.test.js
import { render, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Navigation from './Navigation.svelte';

// Mock SvelteKit modules
vi.mock('$app/stores', () => import('../routes/__mocks__/$app.js'));
vi.mock('$app/navigation', () => import('../routes/__mocks__/$app.js'));

import { goto, __setPageData } from '$app/stores';

describe('GIVEN Navigation component', () => {
  const userSetup = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WHEN on tasks page', () => {
    beforeEach(() => {
      __setPageData({
        url: new URL('http://localhost:3000/tasks'),
        params: {},
        route: { id: '/tasks' },
        status: 200,
        error: null,
        data: {},
        form: null
      });
    });

    it('THEN should highlight tasks link', () => {
      const { getByTestId } = render(Navigation);
      
      const tasksLink = getByTestId('tasks-link');
      expect(tasksLink).toHaveClass('active');
    });

    it('THEN should navigate to home when logo clicked', async () => {
      const { getByTestId } = render(Navigation);
      
      const homeLink = getByTestId('home-link');
      await userSetup.click(homeLink);
      
      expect(goto).toHaveBeenCalledWith('/');
    });
  });
});
```

## API Mocking

### Using Fetch Mock
```javascript
// src/tests/setup.js
import { vi } from 'vitest';

// Global fetch mock
global.fetch = vi.fn();

// Mock response helper
export const mockFetchResponse = (data, options = {}) => {
  const response = {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: new Headers(options.headers || {}),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    ...options
  };
  
  fetch.mockResolvedValueOnce(response);
  return response;
};

// Mock network error
export const mockFetchError = (error = new Error('Network error')) => {
  fetch.mockRejectedValueOnce(error);
};

// Mock fetch with delay
export const mockFetchWithDelay = (data, delay = 100, options = {}) => {
  const response = mockFetchResponse(data, options);
  fetch.mockImplementationOnce(
    () => new Promise(resolve => setTimeout(() => resolve(response), delay))
  );
};
```

```javascript
// src/stores/api.test.js
import { get } from 'svelte/store';
import { mockFetchResponse, mockFetchError } from '../tests/setup.js';
import { userAPI, taskAPI } from './api.js';

describe('GIVEN API store functions', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('WHEN calling userAPI.login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('THEN should make correct API call', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      };
      
      mockFetchResponse(mockResponse);
      
      const result = await userAPI.login(credentials);
      
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      expect(result).toEqual(mockResponse);
    });

    it('THEN should handle API errors', async () => {
      mockFetchResponse(
        { error: 'Invalid credentials' },
        { ok: false, status: 401 }
      );
      
      await expect(userAPI.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('THEN should handle network errors', async () => {
      mockFetchError(new Error('Network failure'));
      
      await expect(userAPI.login(credentials)).rejects.toThrow('Network failure');
    });
  });

  describe('WHEN calling taskAPI.fetchTasks', () => {
    it('THEN should return tasks array', async () => {
      const mockTasks = [
        { id: '1', text: 'Task 1', completed: false },
        { id: '2', text: 'Task 2', completed: true }
      ];
      
      mockFetchResponse(mockTasks);
      
      const result = await taskAPI.fetchTasks();
      
      expect(fetch).toHaveBeenCalledWith('/api/tasks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      expect(result).toEqual(mockTasks);
    });

    it('THEN should handle authorization errors', async () => {
      mockFetchResponse(
        { error: 'Unauthorized' },
        { ok: false, status: 401 }
      );
      
      await expect(taskAPI.fetchTasks()).rejects.toThrow('Unauthorized');
    });
  });
});
```

### Advanced API Mocking with MSW
```javascript
// src/tests/mocks/handlers.js
import { rest } from 'msw';

let users = [
  { id: '1', email: 'test@example.com', name: 'Test User', password: 'password123' }
];

let tasks = [
  { id: '1', text: 'Initial task', completed: false, userId: '1' },
  { id: '2', text: 'Completed task', completed: true, userId: '1' }
];

export const handlers = [
  // Auth handlers
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Invalid credentials' })
      );
    }
    
    return res(
      ctx.json({
        token: `mock-token-${user.id}`,
        user: { id: user.id, email: user.email, name: user.name }
      })
    );
  }),

  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200));
  }),

  rest.get('/api/user/profile', (req, res, ctx) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = token?.split('-')[2];
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Unauthorized' })
      );
    }
    
    return res(
      ctx.json({ id: user.id, email: user.email, name: user.name })
    );
  }),

  // Task handlers
  rest.get('/api/tasks', (req, res, ctx) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = token?.split('-')[2];
    
    if (!userId) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Unauthorized' })
      );
    }
    
    const userTasks = tasks.filter(task => task.userId === userId);
    return res(ctx.json(userTasks));
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = token?.split('-')[2];
    
    if (!userId) {
      return res(
        ctx.status(401),
        ctx.json({ error: 'Unauthorized' })
      );
    }
    
    const newTask = {
      id: Date.now().toString(),
      ...req.body,
      userId,
      createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    
    return res(ctx.json(newTask));
  }),

  rest.patch('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = token?.split('-')[2];
    
    const taskIndex = tasks.findIndex(task => 
      task.id === id && task.userId === userId
    );
    
    if (taskIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Task not found' })
      );
    }
    
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    return res(ctx.json(tasks[taskIndex]));
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const userId = token?.split('-')[2];
    
    const taskIndex = tasks.findIndex(task => 
      task.id === id && task.userId === userId
    );
    
    if (taskIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({ error: 'Task not found' })
      );
    }
    
    tasks.splice(taskIndex, 1);
    return res(ctx.status(204));
  })
];

// Test utilities
export const resetMockData = () => {
  users = [
    { id: '1', email: 'test@example.com', name: 'Test User', password: 'password123' }
  ];
  
  tasks = [
    { id: '1', text: 'Initial task', completed: false, userId: '1' },
    { id: '2', text: 'Completed task', completed: true, userId: '1' }
  ];
};

export const addMockUser = (user) => {
  users.push({ id: Date.now().toString(), ...user });
};

export const addMockTask = (task) => {
  tasks.push({ id: Date.now().toString(), ...task });
};
```

```javascript
// src/tests/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

export const server = setupServer(...handlers);
```

```javascript
// src/tests/integration.test.js
import { render, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { server } from './mocks/server.js';
import { resetMockData } from './mocks/handlers.js';
import App from '../App.svelte';

describe('GIVEN full application integration', () => {
  const userSetup = userEvent.setup();

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    resetMockData();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('WHEN user completes full workflow', () => {
    it('THEN should login, create task, and logout', async () => {
      const { getByTestId, getByRole } = render(App);
      
      // Login
      await userSetup.type(getByTestId('email-input'), 'test@example.com');
      await userSetup.type(getByTestId('password-input'), 'password123');
      await userSetup.click(getByRole('button', { name: /login/i }));
      
      await waitFor(() => {
        expect(getByTestId('dashboard')).toBeInTheDocument();
      });
      
      // Navigate to tasks
      await userSetup.click(getByTestId('tasks-link'));
      
      // Create task
      await userSetup.type(getByTestId('task-input'), 'New integration task');
      await userSetup.click(getByTestId('create-task-button'));
      
      await waitFor(() => {
        expect(getByTestId('task-list')).toHaveTextContent('New integration task');
      });
      
      // Logout
      await userSetup.click(getByTestId('logout-button'));
      
      await waitFor(() => {
        expect(getByTestId('login-form')).toBeInTheDocument();
      });
    });
  });
});
```

## Component Mocking

### Mocking Child Components
```javascript
// src/components/__mocks__/ComplexChart.svelte
<script>
  export let data = [];
  export let options = {};
  export let loading = false;
</script>

<div data-testid="mock-chart" class="mock-chart">
  <div data-testid="chart-title">Mock Chart</div>
  <div data-testid="chart-data-count">Data points: {data.length}</div>
  {#if loading}
    <div data-testid="chart-loading">Loading chart...</div>
  {/if}
  {#if options.title}
    <div data-testid="chart-options-title">{options.title}</div>
  {/if}
</div>
```

```javascript
// src/components/Dashboard.test.js
import { render } from '@testing-library/svelte';
import Dashboard from './Dashboard.svelte';

// Mock the complex chart component
vi.mock('./ComplexChart.svelte', () => import('./__mocks__/ComplexChart.svelte'));

describe('GIVEN Dashboard component', () => {
  const mockData = [
    { label: 'Jan', value: 100 },
    { label: 'Feb', value: 150 },
    { label: 'Mar', value: 120 }
  ];

  describe('WHEN rendering with chart data', () => {
    it('THEN should render mocked chart with correct props', () => {
      const { getByTestId } = render(Dashboard, {
        props: { chartData: mockData }
      });
      
      expect(getByTestId('mock-chart')).toBeInTheDocument();
      expect(getByTestId('chart-data-count')).toHaveTextContent('Data points: 3');
    });

    it('THEN should pass loading state to chart', () => {
      const { getByTestId } = render(Dashboard, {
        props: { chartData: mockData, loading: true }
      });
      
      expect(getByTestId('chart-loading')).toBeInTheDocument();
    });
  });
});
```

### Mocking Third-Party Components
```javascript
// src/lib/__mocks__/third-party.js

// Mock D3 charts
export const createChart = vi.fn(() => ({
  render: vi.fn(),
  update: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn()
}));

// Mock date picker
export const DatePicker = vi.fn(() => ({
  subscribe: vi.fn(() => () => {}),
  set: vi.fn(),
  update: vi.fn()
}));

// Mock map component
export const MapLibrary = {
  createMap: vi.fn(() => ({
    addMarker: vi.fn(),
    removeMarker: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  })),
  
  Marker: vi.fn(() => ({
    setPosition: vi.fn(),
    setVisible: vi.fn(),
    remove: vi.fn()
  }))
};
```

```javascript
// src/components/MapView.test.js
import { render, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import MapView from './MapView.svelte';

// Mock the map library
vi.mock('../lib/map-library.js', () => import('../lib/__mocks__/third-party.js'));

import { MapLibrary } from '../lib/map-library.js';

describe('GIVEN MapView component', () => {
  const userSetup = userEvent.setup();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WHEN component mounts', () => {
    it('THEN should create map instance', () => {
      render(MapView, {
        props: {
          center: { lat: 0, lng: 0 },
          zoom: 10
        }
      });
      
      expect(MapLibrary.createMap).toHaveBeenCalledWith(
        expect.any(Element),
        {
          center: { lat: 0, lng: 0 },
          zoom: 10
        }
      );
    });
  });

  describe('WHEN markers are added', () => {
    it('THEN should create marker instances', () => {
      const markers = [
        { id: '1', position: { lat: 1, lng: 1 }, title: 'Marker 1' },
        { id: '2', position: { lat: 2, lng: 2 }, title: 'Marker 2' }
      ];
      
      render(MapView, {
        props: {
          center: { lat: 0, lng: 0 },
          zoom: 10,
          markers
        }
      });
      
      expect(MapLibrary.Marker).toHaveBeenCalledTimes(2);
      expect(MapLibrary.Marker).toHaveBeenCalledWith({
        position: { lat: 1, lng: 1 },
        title: 'Marker 1'
      });
    });
  });
});
```

## Store Mocking

### Creating Store Mocks
```javascript
// src/stores/__mocks__/notifications.js
import { writable } from 'svelte/store';

const mockNotifications = writable([]);

export const notifications = {
  subscribe: mockNotifications.subscribe,
  add: vi.fn((notification) => {
    mockNotifications.update(notifications => [
      ...notifications,
      { id: Date.now(), ...notification }
    ]);
  }),
  remove: vi.fn((id) => {
    mockNotifications.update(notifications =>
      notifications.filter(n => n.id !== id)
    );
  }),
  clear: vi.fn(() => {
    mockNotifications.set([]);
  })
};

// Test helpers
export const __getNotifications = () => {
  let value;
  mockNotifications.subscribe(v => value = v)();
  return value;
};

export const __setNotifications = (notifications) => {
  mockNotifications.set(notifications);
};

export const __resetNotifications = () => {
  mockNotifications.set([]);
  vi.clearAllMocks();
};
```

### Testing Store Integration
```javascript
// src/components/NotificationCenter.test.js
import { render, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import NotificationCenter from './NotificationCenter.svelte';

// Mock the notifications store
vi.mock('../stores/notifications.js', () => import('../stores/__mocks__/notifications.js'));

import { 
  notifications, 
  __setNotifications, 
  __resetNotifications 
} from '../stores/notifications.js';

describe('GIVEN NotificationCenter component', () => {
  const userSetup = userEvent.setup();

  beforeEach(() => {
    __resetNotifications();
  });

  describe('WHEN notifications exist', () => {
    beforeEach(() => {
      __setNotifications([
        {
          id: '1',
          type: 'success',
          message: 'Operation successful',
          timestamp: new Date()
        },
        {
          id: '2',
          type: 'error',
          message: 'Operation failed',
          timestamp: new Date()
        }
      ]);
    });

    it('THEN should display all notifications', () => {
      const { getAllByTestId } = render(NotificationCenter);
      
      const notificationItems = getAllByTestId('notification-item');
      expect(notificationItems).toHaveLength(2);
    });

    it('THEN should remove notification when close button clicked', async () => {
      const { getAllByTestId } = render(NotificationCenter);
      
      const closeButtons = getAllByTestId('close-notification');
      await userSetup.click(closeButtons[0]);
      
      expect(notifications.remove).toHaveBeenCalledWith('1');
    });

    it('THEN should clear all notifications when clear button clicked', async () => {
      const { getByTestId } = render(NotificationCenter);
      
      const clearButton = getByTestId('clear-all-notifications');
      await userSetup.click(clearButton);
      
      expect(notifications.clear).toHaveBeenCalledTimes(1);
    });
  });
});
```

## Environment and Configuration Mocking

### Mocking Environment Variables
```javascript
// src/tests/mocks/env.js
export const mockEnv = {
  PUBLIC_API_URL: 'http://localhost:3000/api',
  PUBLIC_APP_NAME: 'Test App',
  PUBLIC_VERSION: '1.0.0-test',
  PRIVATE_SECRET_KEY: 'test-secret'
};

// Helper to override env values
export const setMockEnv = (overrides) => {
  Object.assign(mockEnv, overrides);
};

export const resetMockEnv = () => {
  Object.keys(mockEnv).forEach(key => {
    delete mockEnv[key];
  });
  
  Object.assign(mockEnv, {
    PUBLIC_API_URL: 'http://localhost:3000/api',
    PUBLIC_APP_NAME: 'Test App',
    PUBLIC_VERSION: '1.0.0-test',
    PRIVATE_SECRET_KEY: 'test-secret'
  });
};
```

```javascript
// src/lib/config.test.js
import { setMockEnv, resetMockEnv } from '../tests/mocks/env.js';

// Mock $env/static/public
vi.mock('$env/static/public', () => ({
  get PUBLIC_API_URL() { return mockEnv.PUBLIC_API_URL; },
  get PUBLIC_APP_NAME() { return mockEnv.PUBLIC_APP_NAME; },
  get PUBLIC_VERSION() { return mockEnv.PUBLIC_VERSION; }
}));

// Mock $env/static/private
vi.mock('$env/static/private', () => ({
  get PRIVATE_SECRET_KEY() { return mockEnv.PRIVATE_SECRET_KEY; }
}));

import { mockEnv } from '../tests/mocks/env.js';
import { getConfig, validateConfig } from './config.js';

describe('GIVEN configuration module', () => {
  beforeEach(() => {
    resetMockEnv();
  });

  describe('WHEN getting config with default environment', () => {
    it('THEN should return correct configuration', () => {
      const config = getConfig();
      
      expect(config.apiUrl).toBe('http://localhost:3000/api');
      expect(config.appName).toBe('Test App');
      expect(config.version).toBe('1.0.0-test');
    });
  });

  describe('WHEN environment variables are overridden', () => {
    it('THEN should use overridden values', () => {
      setMockEnv({
        PUBLIC_API_URL: 'https://production-api.com',
        PUBLIC_APP_NAME: 'Production App'
      });
      
      const config = getConfig();
      
      expect(config.apiUrl).toBe('https://production-api.com');
      expect(config.appName).toBe('Production App');
    });
  });

  describe('WHEN validating configuration', () => {
    it('THEN should pass with valid config', () => {
      expect(() => validateConfig()).not.toThrow();
    });

    it('THEN should fail with missing required variables', () => {
      setMockEnv({ PUBLIC_API_URL: '' });
      
      expect(() => validateConfig()).toThrow('PUBLIC_API_URL is required');
    });
  });
});
```

### Mocking Browser APIs
```javascript
// src/tests/mocks/browser.js

// Mock localStorage
export const localStorageMock = {
  storage: new Map(),
  
  getItem: vi.fn((key) => localStorageMock.storage.get(key) || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.storage.set(key, String(value));
  }),
  removeItem: vi.fn((key) => {
    localStorageMock.storage.delete(key);
  }),
  clear: vi.fn(() => {
    localStorageMock.storage.clear();
  }),
  
  // Test helpers
  __getAll: () => Object.fromEntries(localStorageMock.storage),
  __reset: () => {
    localStorageMock.storage.clear();
    vi.clearAllMocks();
  }
};

// Mock sessionStorage
export const sessionStorageMock = {
  storage: new Map(),
  
  getItem: vi.fn((key) => sessionStorageMock.storage.get(key) || null),
  setItem: vi.fn((key, value) => {
    sessionStorageMock.storage.set(key, String(value));
  }),
  removeItem: vi.fn((key) => {
    sessionStorageMock.storage.delete(key);
  }),
  clear: vi.fn(() => {
    sessionStorageMock.storage.clear();
  }),
  
  __reset: () => {
    sessionStorageMock.storage.clear();
    vi.clearAllMocks();
  }
};

// Mock location
export const locationMock = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  
  __setURL: (url) => {
    const parsed = new URL(url);
    Object.assign(locationMock, {
      href: parsed.href,
      origin: parsed.origin,
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash
    });
  },
  
  __reset: () => {
    locationMock.__setURL('http://localhost:3000/');
    vi.clearAllMocks();
  }
};

// Mock window.matchMedia
export const matchMediaMock = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}));

// Setup browser mocks
export const setupBrowserMocks = () => {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true
  });
  
  Object.defineProperty(window, 'location', {
    value: locationMock,
    writable: true
  });
  
  Object.defineProperty(window, 'matchMedia', {
    value: matchMediaMock,
    writable: true
  });
};

export const resetBrowserMocks = () => {
  localStorageMock.__reset();
  sessionStorageMock.__reset();
  locationMock.__reset();
  vi.clearAllMocks();
};
```

```javascript
// src/tests/setup.js
import { setupBrowserMocks } from './mocks/browser.js';

// Setup browser mocks for all tests
setupBrowserMocks();
```

```javascript
// src/lib/storage.test.js
import { localStorageMock, resetBrowserMocks } from '../tests/mocks/browser.js';
import { saveUserPreferences, getUserPreferences } from './storage.js';

describe('GIVEN storage utilities', () => {
  beforeEach(() => {
    resetBrowserMocks();
  });

  describe('WHEN saving user preferences', () => {
    it('THEN should store in localStorage', () => {
      const preferences = {
        theme: 'dark',
        language: 'en',
        notifications: true
      };
      
      saveUserPreferences(preferences);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'userPreferences',
        JSON.stringify(preferences)
      );
    });
  });

  describe('WHEN getting user preferences', () => {
    it('THEN should retrieve from localStorage', () => {
      const preferences = {
        theme: 'light',
        language: 'es',
        notifications: false
      };
      
      localStorageMock.storage.set('userPreferences', JSON.stringify(preferences));
      
      const result = getUserPreferences();
      
      expect(result).toEqual(preferences);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('userPreferences');
    });

    it('THEN should return defaults when no preferences stored', () => {
      const result = getUserPreferences();
      
      expect(result).toEqual({
        theme: 'light',
        language: 'en',
        notifications: true
      });
    });
  });
});
```

## Advanced Mocking Patterns

### Conditional Mocking
```javascript
// src/tests/utils/conditional-mocks.js

export const createConditionalMock = (condition, mockImplementation, fallback) => {
  return vi.fn((...args) => {
    if (typeof condition === 'function' ? condition(...args) : condition) {
      return mockImplementation(...args);
    }
    return fallback ? fallback(...args) : undefined;
  });
};

export const createAsyncMock = (shouldSucceed = true, delay = 0) => {
  return vi.fn(() => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldSucceed) {
          resolve({ success: true, data: 'mock data' });
        } else {
          reject(new Error('Mock async error'));
        }
      }, delay);
    });
  });
};

export const createSequentialMock = (...implementations) => {
  let callCount = 0;
  
  return vi.fn((...args) => {
    const implementation = implementations[callCount] || implementations[implementations.length - 1];
    callCount++;
    
    if (typeof implementation === 'function') {
      return implementation(...args);
    }
    return implementation;
  });
};
```

```javascript
// src/components/AsyncButton.test.js
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createAsyncMock, createSequentialMock } from '../tests/utils/conditional-mocks.js';
import AsyncButton from './AsyncButton.svelte';

describe('GIVEN AsyncButton component', () => {
  const userSetup = userEvent.setup();

  describe('WHEN async operation succeeds', () => {
    it('THEN should show success state', async () => {
      const mockAsyncFn = createAsyncMock(true, 100);
      
      const { getByTestId } = render(AsyncButton, {
        props: { onClick: mockAsyncFn, label: 'Click me' }
      });
      
      const button = getByTestId('async-button');
      await userSetup.click(button);
      
      // Should show loading state
      expect(getByTestId('loading-indicator')).toBeInTheDocument();
      
      // Wait for async operation to complete
      await waitFor(() => {
        expect(getByTestId('success-indicator')).toBeInTheDocument();
      });
      
      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('WHEN async operation fails', () => {
    it('THEN should show error state', async () => {
      const mockAsyncFn = createAsyncMock(false, 50);
      
      const { getByTestId } = render(AsyncButton, {
        props: { onClick: mockAsyncFn, label: 'Click me' }
      });
      
      const button = getByTestId('async-button');
      await userSetup.click(button);
      
      await waitFor(() => {
        expect(getByTestId('error-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('WHEN testing retry behavior', () => {
    it('THEN should fail then succeed on retry', async () => {
      const mockAsyncFn = createSequentialMock(
        () => Promise.reject(new Error('First attempt fails')),
        () => Promise.resolve({ success: true })
      );
      
      const { getByTestId } = render(AsyncButton, {
        props: { onClick: mockAsyncFn, label: 'Click me', enableRetry: true }
      });
      
      const button = getByTestId('async-button');
      
      // First attempt
      await userSetup.click(button);
      
      await waitFor(() => {
        expect(getByTestId('retry-button')).toBeInTheDocument();
      });
      
      // Retry
      const retryButton = getByTestId('retry-button');
      await userSetup.click(retryButton);
      
      await waitFor(() => {
        expect(getByTestId('success-indicator')).toBeInTheDocument();
      });
      
      expect(mockAsyncFn).toHaveBeenCalledTimes(2);
    });
  });
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Store Testing](./stores.md)
- [Integration Testing](./integration.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)