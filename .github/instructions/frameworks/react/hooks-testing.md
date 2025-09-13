# React Hooks Testing

This guide covers testing custom React hooks using `@testing-library/react`.

## Basic Hook Testing

### Simple Custom Hook
```typescript
// hooks/useCounter.ts
import { useState } from 'react';

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}

// hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('GIVEN useCounter hook', () => {
  test('WHEN initialized THEN should start with default value', () => {
    const { result } = renderHook(() => useCounter());
    
    expect(result.current.count).toBe(0);
  });

  test('WHEN initialized with custom value THEN should start with that value', () => {
    const { result } = renderHook(() => useCounter(5));
    
    expect(result.current.count).toBe(5);
  });

  test('WHEN increment is called THEN should increase count by 1', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  test('WHEN decrement is called THEN should decrease count by 1', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });

  test('WHEN reset is called THEN should return to initial value', () => {
    const { result } = renderHook(() => useCounter(3));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(5);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(3);
  });
});
```

## Hooks with Dependencies

### Hook with API Calls
```typescript
// hooks/useUser.ts
import { useState, useEffect } from 'react';
import { fetchUser } from '../api/userService';

export function useUser(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}

// hooks/useUser.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from './useUser';

// Mock the API
const mockFetchUser = jest.fn();
jest.mock('../api/userService', () => ({
  fetchUser: mockFetchUser
}));

describe('GIVEN useUser hook', () => {
  beforeEach(() => {
    mockFetchUser.mockClear();
  });

  test('WHEN initialized without userId THEN should not fetch user', () => {
    renderHook(() => useUser(''));
    
    expect(mockFetchUser).not.toHaveBeenCalled();
  });

  test('WHEN userId is provided THEN should start loading', () => {
    mockFetchUser.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { result } = renderHook(() => useUser('123'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.error).toBe(null);
  });

  test('WHEN user data loads successfully THEN should set user', async () => {
    const mockUser = { id: '123', name: 'John Doe' };
    mockFetchUser.mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useUser('123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBe(null);
  });

  test('WHEN user data fails to load THEN should set error', async () => {
    const mockError = new Error('Failed to fetch');
    mockFetchUser.mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useUser('123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.user).toBe(null);
    expect(result.current.error).toEqual(mockError);
  });

  test('WHEN userId changes THEN should fetch new user', async () => {
    const user1 = { id: '123', name: 'John' };
    const user2 = { id: '456', name: 'Jane' };
    
    mockFetchUser
      .mockResolvedValueOnce(user1)
      .mockResolvedValueOnce(user2);
    
    const { result, rerender } = renderHook(
      ({ userId }) => useUser(userId),
      { initialProps: { userId: '123' } }
    );
    
    await waitFor(() => {
      expect(result.current.user).toEqual(user1);
    });
    
    rerender({ userId: '456' });
    
    await waitFor(() => {
      expect(result.current.user).toEqual(user2);
    });
    
    expect(mockFetchUser).toHaveBeenCalledTimes(2);
  });
});
```

## Hooks with Context

### Hook using Context
```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any;
  login: (user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  
  const login = (userData: any) => setUser(userData);
  const logout = () => setUser(null);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// hooks/useAuth.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('GIVEN useAuth hook', () => {
  test('WHEN initialized THEN should have no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBe(null);
  });

  test('WHEN login is called THEN should set user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const userData = { id: '123', name: 'John Doe' };
    
    act(() => {
      result.current.login(userData);
    });
    
    expect(result.current.user).toEqual(userData);
  });

  test('WHEN logout is called THEN should clear user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const userData = { id: '123', name: 'John Doe' };
    
    act(() => {
      result.current.login(userData);
    });
    
    expect(result.current.user).toEqual(userData);
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBe(null);
  });

  test('WHEN used outside provider THEN should throw error', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');
  });
});
```

## Hooks with Timers

### Hook with Debounce
```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('GIVEN useDebounce hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('WHEN value changes THEN should debounce the update', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Should still be initial value before delay
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should now be updated
    expect(result.current).toBe('updated');
  });

  test('WHEN value changes rapidly THEN should only update after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Multiple rapid changes
    rerender({ value: 'change1', delay: 500 });
    rerender({ value: 'change2', delay: 500 });
    rerender({ value: 'final', delay: 500 });

    // Should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should jump to final value
    expect(result.current).toBe('final');
  });
});
```

## Complex Hooks with Multiple State

### Hook with Reducer Pattern
```typescript
// hooks/useFormState.ts
import { useReducer } from 'react';

interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error }
      };
    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'RESET':
      return { values: {}, errors: {}, isSubmitting: false };
    default:
      return state;
  }
}

export function useFormState(initialValues = {}) {
  const [state, dispatch] = useReducer(formReducer, {
    values: initialValues,
    errors: {},
    isSubmitting: false
  });

  const setField = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const setError = (field: string, error: string) => {
    dispatch({ type: 'SET_ERROR', field, error });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const setSubmitting = (isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', isSubmitting });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  return {
    ...state,
    setField,
    setError,
    clearErrors,
    setSubmitting,
    reset
  };
}

// hooks/useFormState.test.ts
import { renderHook, act } from '@testing-library/react';
import { useFormState } from './useFormState';

describe('GIVEN useFormState hook', () => {
  test('WHEN initialized THEN should have empty state', () => {
    const { result } = renderHook(() => useFormState());
    
    expect(result.current.values).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });

  test('WHEN initialized with values THEN should use initial values', () => {
    const initialValues = { name: 'John', email: 'john@example.com' };
    const { result } = renderHook(() => useFormState(initialValues));
    
    expect(result.current.values).toEqual(initialValues);
  });

  test('WHEN setField is called THEN should update field value', () => {
    const { result } = renderHook(() => useFormState());
    
    act(() => {
      result.current.setField('name', 'John Doe');
    });
    
    expect(result.current.values.name).toBe('John Doe');
  });

  test('WHEN setError is called THEN should set field error', () => {
    const { result } = renderHook(() => useFormState());
    
    act(() => {
      result.current.setError('email', 'Invalid email');
    });
    
    expect(result.current.errors.email).toBe('Invalid email');
  });

  test('WHEN setField is called on field with error THEN should clear error', () => {
    const { result } = renderHook(() => useFormState());
    
    act(() => {
      result.current.setError('email', 'Invalid email');
    });
    
    expect(result.current.errors.email).toBe('Invalid email');
    
    act(() => {
      result.current.setField('email', 'valid@email.com');
    });
    
    expect(result.current.errors.email).toBe('');
  });

  test('WHEN reset is called THEN should clear all state', () => {
    const { result } = renderHook(() => useFormState());
    
    act(() => {
      result.current.setField('name', 'John');
      result.current.setError('email', 'Error');
      result.current.setSubmitting(true);
    });
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.values).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
  });
});
```

## Testing Hook Performance

### Optimization Testing
```typescript
// hooks/useExpensiveCalculation.ts
import { useMemo } from 'react';

export function useExpensiveCalculation(data: number[], dependency: string) {
  return useMemo(() => {
    // Simulate expensive calculation
    return data.reduce((sum, num) => sum + num, 0);
  }, [data, dependency]);
}

// hooks/useExpensiveCalculation.test.ts
import { renderHook } from '@testing-library/react';
import { useExpensiveCalculation } from './useExpensiveCalculation';

describe('GIVEN useExpensiveCalculation hook', () => {
  test('WHEN dependency does not change THEN should return memoized value', () => {
    const data = [1, 2, 3, 4, 5];
    const { result, rerender } = renderHook(
      ({ data, dependency }) => useExpensiveCalculation(data, dependency),
      { initialProps: { data, dependency: 'same' } }
    );

    const firstResult = result.current;
    
    // Rerender with same dependency
    rerender({ data, dependency: 'same' });
    
    // Should be the same object reference (memoized)
    expect(result.current).toBe(firstResult);
  });

  test('WHEN dependency changes THEN should recalculate', () => {
    const data = [1, 2, 3, 4, 5];
    const { result, rerender } = renderHook(
      ({ data, dependency }) => useExpensiveCalculation(data, dependency),
      { initialProps: { data, dependency: 'initial' } }
    );

    const firstResult = result.current;
    
    // Rerender with different dependency
    rerender({ data, dependency: 'changed' });
    
    // Should be a new calculation
    expect(result.current).not.toBe(firstResult);
    expect(result.current).toBe(15); // Sum of [1,2,3,4,5]
  });
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Integration Testing](./integration.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)