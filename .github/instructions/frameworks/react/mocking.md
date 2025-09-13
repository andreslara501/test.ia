# React Mocking Strategies

This guide covers comprehensive mocking strategies for React applications using Jest and React Testing Library.

## Component Mocking

### Mocking Child Components
```typescript
// components/UserCard.tsx
import React from 'react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
}

interface UserCardProps {
  user: User;
  onClick?: (user: User) => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  return (
    <div 
      data-testid="user-card"
      onClick={() => onClick?.(user)}
      className="user-card"
    >
      <Avatar src={user.avatar} alt={user.name} />
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <Badge status={user.status} />
      </div>
    </div>
  );
}

// components/UserCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

// Mock child components
jest.mock('./Avatar', () => ({
  Avatar: ({ src, alt }: { src: string; alt: string }) => (
    <img data-testid="avatar" src={src} alt={alt} />
  )
}));

jest.mock('./Badge', () => ({
  Badge: ({ status }: { status: string }) => (
    <span data-testid="badge" data-status={status}>
      {status}
    </span>
  )
}));

describe('GIVEN UserCard component', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
    status: 'online' as const
  };

  test('WHEN rendered THEN should display user information', () => {
    render(<UserCard user={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toHaveAttribute('src', mockUser.avatar);
    expect(screen.getByTestId('badge')).toHaveAttribute('data-status', 'online');
  });

  test('WHEN clicked THEN should call onClick with user', () => {
    const mockOnClick = jest.fn();
    
    render(<UserCard user={mockUser} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByTestId('user-card'));
    
    expect(mockOnClick).toHaveBeenCalledWith(mockUser);
  });
});
```

### Partial Mocking with Jest
```typescript
// utils/dateUtils.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// components/DateDisplay.tsx
import React from 'react';
import { formatDate, isToday } from '../utils/dateUtils';

interface DateDisplayProps {
  date: Date;
}

export function DateDisplay({ date }: DateDisplayProps) {
  return (
    <div data-testid="date-display">
      <span data-testid="formatted-date">{formatDate(date)}</span>
      {isToday(date) && (
        <span data-testid="today-indicator">Today</span>
      )}
    </div>
  );
}

// components/DateDisplay.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateDisplay } from './DateDisplay';

// Partial mock - only mock specific functions
jest.mock('../utils/dateUtils', () => ({
  ...jest.requireActual('../utils/dateUtils'),
  isToday: jest.fn()
}));

import { isToday } from '../utils/dateUtils';

const mockIsToday = isToday as jest.MockedFunction<typeof isToday>;

describe('GIVEN DateDisplay component', () => {
  const testDate = new Date('2023-01-15');

  beforeEach(() => {
    mockIsToday.mockClear();
  });

  test('WHEN date is today THEN should show today indicator', () => {
    mockIsToday.mockReturnValue(true);

    render(<DateDisplay date={testDate} />);

    expect(screen.getByTestId('today-indicator')).toBeInTheDocument();
    expect(mockIsToday).toHaveBeenCalledWith(testDate);
  });

  test('WHEN date is not today THEN should not show today indicator', () => {
    mockIsToday.mockReturnValue(false);

    render(<DateDisplay date={testDate} />);

    expect(screen.queryByTestId('today-indicator')).not.toBeInTheDocument();
    expect(mockIsToday).toHaveBeenCalledWith(testDate);
  });

  test('WHEN rendered THEN should format date correctly', () => {
    mockIsToday.mockReturnValue(false);

    render(<DateDisplay date={testDate} />);

    // formatDate is not mocked, so it uses real implementation
    expect(screen.getByTestId('formatted-date')).toHaveTextContent('1/15/2023');
  });
});
```

## Module Mocking

### Mocking External Libraries
```typescript
// components/ImageUploader.tsx
import React, { useState } from 'react';
import { uploadImage } from '../services/cloudinaryService';
import { toast } from 'react-toastify';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
}

export function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadImage(file);
      onUploadComplete(url);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid="image-uploader">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        data-testid="file-input"
      />
      {uploading && <div data-testid="uploading">Uploading...</div>}
    </div>
  );
}

// components/ImageUploader.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploader } from './ImageUploader';

// Mock external libraries
jest.mock('../services/cloudinaryService', () => ({
  uploadImage: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

import { uploadImage } from '../services/cloudinaryService';
import { toast } from 'react-toastify';

const mockUploadImage = uploadImage as jest.MockedFunction<typeof uploadImage>;

describe('GIVEN ImageUploader component', () => {
  const mockOnUploadComplete = jest.fn();

  beforeEach(() => {
    mockUploadImage.mockClear();
    mockOnUploadComplete.mockClear();
    jest.clearAllMocks();
  });

  test('WHEN file is selected and upload succeeds THEN should call onUploadComplete', async () => {
    const user = userEvent.setup();
    const mockUrl = 'https://cloudinary.com/image.jpg';
    mockUploadImage.mockResolvedValue(mockUrl);

    render(<ImageUploader onUploadComplete={mockOnUploadComplete} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input');

    await user.upload(input, file);

    // Should show uploading state
    expect(screen.getByTestId('uploading')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(mockUrl);
    });

    expect(toast.success).toHaveBeenCalledWith('Image uploaded successfully!');
    expect(screen.queryByTestId('uploading')).not.toBeInTheDocument();
  });

  test('WHEN upload fails THEN should show error toast', async () => {
    const user = userEvent.setup();
    mockUploadImage.mockRejectedValue(new Error('Upload failed'));

    render(<ImageUploader onUploadComplete={mockOnUploadComplete} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByTestId('file-input');

    await user.upload(input, file);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to upload image');
    });

    expect(mockOnUploadComplete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('uploading')).not.toBeInTheDocument();
  });
});
```

### Mocking Default Exports
```typescript
// services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000
});

export default apiClient;

// hooks/useUsers.ts
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get('/users');
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, loading, error };
}

// hooks/useUsers.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';

// Mock default export
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

import apiClient from '../services/apiClient';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('GIVEN useUsers hook', () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  test('WHEN hook is used THEN should fetch users successfully', async () => {
    const mockUsers = [
      { id: '1', name: 'John', email: 'john@example.com' },
      { id: '2', name: 'Jane', email: 'jane@example.com' }
    ];

    mockApiClient.get.mockResolvedValue({ data: mockUsers });

    const { result } = renderHook(() => useUsers());

    expect(result.current.loading).toBe(true);
    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.error).toBe(null);
    expect(mockApiClient.get).toHaveBeenCalledWith('/users');
  });

  test('WHEN API call fails THEN should set error state', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toEqual([]);
    expect(result.current.error).toBe('Failed to fetch users');
  });
});
```

## Function Mocking

### Mocking Utility Functions
```typescript
// utils/storage.ts
export function saveToLocalStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => 
    loadFromLocalStorage(key, defaultValue)
  );

  useEffect(() => {
    saveToLocalStorage(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}

// hooks/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// Mock storage utilities
jest.mock('../utils/storage', () => ({
  saveToLocalStorage: jest.fn(),
  loadFromLocalStorage: jest.fn()
}));

import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';

const mockSaveToLocalStorage = saveToLocalStorage as jest.MockedFunction<typeof saveToLocalStorage>;
const mockLoadFromLocalStorage = loadFromLocalStorage as jest.MockedFunction<typeof loadFromLocalStorage>;

describe('GIVEN useLocalStorage hook', () => {
  beforeEach(() => {
    mockSaveToLocalStorage.mockClear();
    mockLoadFromLocalStorage.mockClear();
  });

  test('WHEN initialized THEN should load from localStorage', () => {
    const defaultValue = { count: 0 };
    const storedValue = { count: 5 };
    
    mockLoadFromLocalStorage.mockReturnValue(storedValue);

    const { result } = renderHook(() => 
      useLocalStorage('test-key', defaultValue)
    );

    expect(mockLoadFromLocalStorage).toHaveBeenCalledWith('test-key', defaultValue);
    expect(result.current[0]).toEqual(storedValue);
  });

  test('WHEN value changes THEN should save to localStorage', () => {
    mockLoadFromLocalStorage.mockReturnValue({ count: 0 });

    const { result } = renderHook(() => 
      useLocalStorage('test-key', { count: 0 })
    );

    const newValue = { count: 10 };

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toEqual(newValue);
    expect(mockSaveToLocalStorage).toHaveBeenCalledWith('test-key', newValue);
  });

  test('WHEN localStorage fails THEN should use default value', () => {
    const defaultValue = { count: 0 };
    
    mockLoadFromLocalStorage.mockReturnValue(defaultValue);

    const { result } = renderHook(() => 
      useLocalStorage('test-key', defaultValue)
    );

    expect(result.current[0]).toEqual(defaultValue);
  });
});
```

## Mocking Global Objects

### Mocking Browser APIs
```typescript
// hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported',
        loading: false
      }));
      return;
    }

    const success = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false
      });
    };

    const error = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    };

    navigator.geolocation.getCurrentPosition(success, error);
  }, []);

  return state;
}

// hooks/useGeolocation.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};

Object.defineProperty(global, 'navigator', {
  value: { geolocation: mockGeolocation },
  writable: true
});

describe('GIVEN useGeolocation hook', () => {
  beforeEach(() => {
    mockGeolocation.getCurrentPosition.mockClear();
  });

  test('WHEN geolocation succeeds THEN should return coordinates', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.latitude).toBe(40.7128);
    expect(result.current.longitude).toBe(-74.0060);
    expect(result.current.error).toBe(null);
  });

  test('WHEN geolocation fails THEN should return error', async () => {
    const mockError = {
      message: 'User denied geolocation'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.latitude).toBe(null);
    expect(result.current.longitude).toBe(null);
    expect(result.current.error).toBe('User denied geolocation');
  });

  test('WHEN geolocation is not supported THEN should return error', async () => {
    // Remove geolocation support
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true
    });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Geolocation is not supported');

    // Restore geolocation
    Object.defineProperty(global, 'navigator', {
      value: { geolocation: mockGeolocation },
      writable: true
    });
  });
});
```

### Mocking Window Methods
```typescript
// hooks/useWindowSize.ts
import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowSize;
}

// hooks/useWindowSize.test.ts
import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from './useWindowSize';

// Mock window properties
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768
});

// Mock addEventListener and removeEventListener
const mockAddEventListener = jest.spyOn(window, 'addEventListener');
const mockRemoveEventListener = jest.spyOn(window, 'removeEventListener');

describe('GIVEN useWindowSize hook', () => {
  beforeEach(() => {
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  test('WHEN initialized THEN should return current window size', () => {
    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  test('WHEN component mounts THEN should add resize listener', () => {
    renderHook(() => useWindowSize());

    expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  test('WHEN component unmounts THEN should remove resize listener', () => {
    const { unmount } = renderHook(() => useWindowSize());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  test('WHEN window resizes THEN should update size', () => {
    const { result } = renderHook(() => useWindowSize());

    // Get the resize handler
    const resizeHandler = mockAddEventListener.mock.calls[0][1] as EventListener;

    // Change window size
    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
      
      // Trigger resize event
      resizeHandler(new Event('resize'));
    });

    expect(result.current.width).toBe(1920);
    expect(result.current.height).toBe(1080);
  });
});
```

## Advanced Mocking Patterns

### Mocking with Different Return Values
```typescript
// services/authService.ts
export async function login(email: string, password: string) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Invalid credentials');
  }
  
  return response.json();
}

// components/LoginForm.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('GIVEN LoginForm component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  test('WHEN login succeeds THEN should call onSuccess', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'abc123', user: { id: '1', name: 'John' } })
    } as Response);

    render(<LoginForm onSuccess={mockOnSuccess} />);

    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        token: 'abc123',
        user: { id: '1', name: 'John' }
      });
    });
  });

  test('WHEN login fails THEN should show error message', async () => {
    const user = userEvent.setup();
    
    // Mock failed response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    } as Response);

    render(<LoginForm onSuccess={jest.fn()} />);

    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrongpassword');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  test('WHEN network error occurs THEN should show network error', async () => {
    const user = userEvent.setup();
    
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<LoginForm onSuccess={jest.fn()} />);

    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
```

### Mocking Implementation Changes
```typescript
// hooks/useApi.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

jest.mock('../services/apiClient');

import apiClient from '../services/apiClient';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('GIVEN useApi hook', () => {
  test('WHEN multiple calls are made THEN should handle different responses', async () => {
    // Setup different mock implementations
    mockApiClient.get
      .mockResolvedValueOnce({ data: { page: 1, items: ['item1', 'item2'] } })
      .mockResolvedValueOnce({ data: { page: 2, items: ['item3', 'item4'] } })
      .mockRejectedValueOnce(new Error('Server error'))
      .mockResolvedValueOnce({ data: { page: 3, items: ['item5'] } });

    const { result, rerender } = renderHook(
      ({ url }) => useApi(url),
      { initialProps: { url: '/api/items?page=1' } }
    );

    // First call
    await waitFor(() => {
      expect(result.current.data).toEqual({ page: 1, items: ['item1', 'item2'] });
    });

    // Second call
    rerender({ url: '/api/items?page=2' });
    await waitFor(() => {
      expect(result.current.data).toEqual({ page: 2, items: ['item3', 'item4'] });
    });

    // Third call (error)
    rerender({ url: '/api/items?page=3' });
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Fourth call (recovery)
    rerender({ url: '/api/items?page=4' });
    await waitFor(() => {
      expect(result.current.data).toEqual({ page: 3, items: ['item5'] });
      expect(result.current.error).toBe(null);
    });
  });
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Hooks Testing](./hooks-testing.md)
- [Integration Testing](./integration.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)