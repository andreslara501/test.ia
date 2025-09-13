# Svelte Store Testing

This guide covers comprehensive testing strategies for Svelte stores, including writable stores, derived stores, custom stores, and store-component integration.

## Basic Store Testing

### Testing Writable Stores
```javascript
// src/stores/counter.js
import { writable } from 'svelte/store';

function createCounter(initialValue = 0) {
  const { subscribe, set, update } = writable(initialValue);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(initialValue),
    set: (value) => set(value),
    add: (amount) => update(n => n + amount),
    multiply: (factor) => update(n => n * factor)
  };
}

export const counter = createCounter();
export { createCounter };
```

```javascript
// src/stores/counter.test.js
import { get } from 'svelte/store';
import { counter, createCounter } from './counter.js';

describe('GIVEN counter store', () => {
  beforeEach(() => {
    counter.reset();
  });

  describe('WHEN initialized', () => {
    it('THEN should have initial value of 0', () => {
      expect(get(counter)).toBe(0);
    });
  });

  describe('WHEN increment is called', () => {
    it('THEN should increase value by 1', () => {
      counter.increment();
      expect(get(counter)).toBe(1);
      
      counter.increment();
      expect(get(counter)).toBe(2);
    });
  });

  describe('WHEN decrement is called', () => {
    it('THEN should decrease value by 1', () => {
      counter.set(5);
      counter.decrement();
      expect(get(counter)).toBe(4);
      
      counter.decrement();
      expect(get(counter)).toBe(3);
    });
  });

  describe('WHEN reset is called', () => {
    it('THEN should return to initial value', () => {
      counter.set(10);
      counter.reset();
      expect(get(counter)).toBe(0);
    });
  });

  describe('WHEN add is called', () => {
    it('THEN should add the specified amount', () => {
      counter.set(5);
      counter.add(3);
      expect(get(counter)).toBe(8);
      
      counter.add(-2);
      expect(get(counter)).toBe(6);
    });
  });

  describe('WHEN multiply is called', () => {
    it('THEN should multiply by the specified factor', () => {
      counter.set(4);
      counter.multiply(3);
      expect(get(counter)).toBe(12);
      
      counter.multiply(0.5);
      expect(get(counter)).toBe(6);
    });
  });

  describe('WHEN custom initial value is provided', () => {
    it('THEN should use custom initial value', () => {
      const customCounter = createCounter(10);
      expect(get(customCounter)).toBe(10);
      
      customCounter.reset();
      expect(get(customCounter)).toBe(10);
    });
  });
});
```

### Testing Store Subscriptions
```javascript
// src/stores/notifications.js
import { writable } from 'svelte/store';

function createNotificationStore() {
  const { subscribe, update } = writable([]);

  return {
    subscribe,
    add: (notification) => {
      const id = Date.now() + Math.random();
      const newNotification = {
        id,
        timestamp: new Date(),
        ...notification
      };
      
      update(notifications => [...notifications, newNotification]);
      
      // Auto-remove after duration if specified
      if (notification.duration) {
        setTimeout(() => {
          update(notifications => 
            notifications.filter(n => n.id !== id)
          );
        }, notification.duration);
      }
      
      return id;
    },
    remove: (id) => {
      update(notifications => notifications.filter(n => n.id !== id));
    },
    clear: () => {
      update(() => []);
    },
    markAsRead: (id) => {
      update(notifications => 
        notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
    }
  };
}

export const notifications = createNotificationStore();
```

```javascript
// src/stores/notifications.test.js
import { get } from 'svelte/store';
import { notifications } from './notifications.js';

// Mock timers for auto-removal testing
vi.useFakeTimers();

describe('GIVEN notifications store', () => {
  beforeEach(() => {
    notifications.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('WHEN initialized', () => {
    it('THEN should have empty array', () => {
      expect(get(notifications)).toEqual([]);
    });
  });

  describe('WHEN notification is added', () => {
    it('THEN should add notification to store', () => {
      const notificationData = {
        type: 'success',
        message: 'Operation completed',
        title: 'Success'
      };
      
      const id = notifications.add(notificationData);
      const currentNotifications = get(notifications);
      
      expect(currentNotifications).toHaveLength(1);
      expect(currentNotifications[0]).toMatchObject({
        id,
        type: 'success',
        message: 'Operation completed',
        title: 'Success',
        timestamp: expect.any(Date)
      });
    });

    it('THEN should generate unique IDs', () => {
      const id1 = notifications.add({ message: 'First' });
      const id2 = notifications.add({ message: 'Second' });
      
      expect(id1).not.toBe(id2);
    });

    it('THEN should auto-remove after duration', () => {
      notifications.add({
        message: 'Auto-remove',
        duration: 1000
      });
      
      expect(get(notifications)).toHaveLength(1);
      
      vi.advanceTimersByTime(1000);
      
      expect(get(notifications)).toHaveLength(0);
    });

    it('THEN should not auto-remove without duration', () => {
      notifications.add({ message: 'Persistent' });
      
      expect(get(notifications)).toHaveLength(1);
      
      vi.advanceTimersByTime(5000);
      
      expect(get(notifications)).toHaveLength(1);
    });
  });

  describe('WHEN notification is removed', () => {
    it('THEN should remove specific notification', () => {
      const id1 = notifications.add({ message: 'First' });
      const id2 = notifications.add({ message: 'Second' });
      
      expect(get(notifications)).toHaveLength(2);
      
      notifications.remove(id1);
      const remaining = get(notifications);
      
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(id2);
    });

    it('THEN should handle removing non-existent notification', () => {
      notifications.add({ message: 'Test' });
      
      expect(() => {
        notifications.remove('non-existent-id');
      }).not.toThrow();
      
      expect(get(notifications)).toHaveLength(1);
    });
  });

  describe('WHEN all notifications are cleared', () => {
    it('THEN should remove all notifications', () => {
      notifications.add({ message: 'First' });
      notifications.add({ message: 'Second' });
      notifications.add({ message: 'Third' });
      
      expect(get(notifications)).toHaveLength(3);
      
      notifications.clear();
      
      expect(get(notifications)).toHaveLength(0);
    });
  });

  describe('WHEN notification is marked as read', () => {
    it('THEN should update read status', () => {
      const id = notifications.add({ message: 'Unread notification' });
      
      notifications.markAsRead(id);
      const currentNotifications = get(notifications);
      
      expect(currentNotifications[0].read).toBe(true);
    });

    it('THEN should only affect specified notification', () => {
      const id1 = notifications.add({ message: 'First' });
      const id2 = notifications.add({ message: 'Second' });
      
      notifications.markAsRead(id1);
      const currentNotifications = get(notifications);
      
      expect(currentNotifications[0].read).toBe(true);
      expect(currentNotifications[1].read).toBeUndefined();
    });
  });

  describe('WHEN testing store subscriptions', () => {
    it('THEN should notify subscribers of changes', () => {
      const mockSubscriber = vi.fn();
      
      const unsubscribe = notifications.subscribe(mockSubscriber);
      
      // Initial call with empty array
      expect(mockSubscriber).toHaveBeenCalledWith([]);
      
      notifications.add({ message: 'Test' });
      
      expect(mockSubscriber).toHaveBeenCalledTimes(2);
      expect(mockSubscriber).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message: 'Test' })
        ])
      );
      
      unsubscribe();
    });

    it('THEN should handle multiple subscribers', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      
      const unsubscribe1 = notifications.subscribe(subscriber1);
      const unsubscribe2 = notifications.subscribe(subscriber2);
      
      notifications.add({ message: 'Test' });
      
      expect(subscriber1).toHaveBeenCalledTimes(2);
      expect(subscriber2).toHaveBeenCalledTimes(2);
      
      unsubscribe1();
      unsubscribe2();
    });
  });
});
```

## Testing Derived Stores

### Complex Derived Store
```javascript
// src/stores/shopping-cart.js
import { writable, derived } from 'svelte/store';

// Base stores
export const cartItems = writable([]);
export const discountCode = writable(null);
export const taxRate = writable(0.08);

// Derived stores
export const itemCount = derived(
  cartItems,
  $cartItems => $cartItems.reduce((total, item) => total + item.quantity, 0)
);

export const subtotal = derived(
  cartItems,
  $cartItems => $cartItems.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  )
);

export const discount = derived(
  [subtotal, discountCode],
  ([$subtotal, $discountCode]) => {
    if (!$discountCode) return 0;
    
    switch ($discountCode.type) {
      case 'percentage':
        return $subtotal * ($discountCode.value / 100);
      case 'fixed':
        return Math.min($discountCode.value, $subtotal);
      default:
        return 0;
    }
  }
);

export const discountedSubtotal = derived(
  [subtotal, discount],
  ([$subtotal, $discount]) => Math.max(0, $subtotal - $discount)
);

export const tax = derived(
  [discountedSubtotal, taxRate],
  ([$discountedSubtotal, $taxRate]) => $discountedSubtotal * $taxRate
);

export const total = derived(
  [discountedSubtotal, tax],
  ([$discountedSubtotal, $tax]) => $discountedSubtotal + $tax
);

export const isEmpty = derived(
  cartItems,
  $cartItems => $cartItems.length === 0
);

export const cartSummary = derived(
  [itemCount, subtotal, discount, tax, total],
  ([$itemCount, $subtotal, $discount, $tax, $total]) => ({
    itemCount: $itemCount,
    subtotal: $subtotal,
    discount: $discount,
    tax: $tax,
    total: $total,
    savings: $discount > 0 ? $discount : null
  })
);

// Cart actions
export const cartActions = {
  addItem: (product, quantity = 1) => {
    cartItems.update(items => {
      const existingItem = items.find(item => item.id === product.id);
      
      if (existingItem) {
        return items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...items, { ...product, quantity }];
      }
    });
  },
  
  removeItem: (productId) => {
    cartItems.update(items => items.filter(item => item.id !== productId));
  },
  
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      cartActions.removeItem(productId);
    } else {
      cartItems.update(items =>
        items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  },
  
  clear: () => {
    cartItems.set([]);
  },
  
  applyDiscount: (code) => {
    discountCode.set(code);
  },
  
  removeDiscount: () => {
    discountCode.set(null);
  }
};
```

```javascript
// src/stores/shopping-cart.test.js
import { get } from 'svelte/store';
import {
  cartItems,
  discountCode,
  taxRate,
  itemCount,
  subtotal,
  discount,
  discountedSubtotal,
  tax,
  total,
  isEmpty,
  cartSummary,
  cartActions
} from './shopping-cart.js';

describe('GIVEN shopping cart stores', () => {
  const mockProduct1 = {
    id: '1',
    name: 'Product 1',
    price: 10.00
  };
  
  const mockProduct2 = {
    id: '2',
    name: 'Product 2',
    price: 25.00
  };

  beforeEach(() => {
    cartActions.clear();
    cartActions.removeDiscount();
    taxRate.set(0.08);
  });

  describe('WHEN cart is empty', () => {
    it('THEN should have correct initial state', () => {
      expect(get(cartItems)).toEqual([]);
      expect(get(itemCount)).toBe(0);
      expect(get(subtotal)).toBe(0);
      expect(get(total)).toBe(0);
      expect(get(isEmpty)).toBe(true);
    });
  });

  describe('WHEN items are added to cart', () => {
    it('THEN should add new item', () => {
      cartActions.addItem(mockProduct1, 2);
      
      const items = get(cartItems);
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({
        ...mockProduct1,
        quantity: 2
      });
    });

    it('THEN should update quantity for existing item', () => {
      cartActions.addItem(mockProduct1, 2);
      cartActions.addItem(mockProduct1, 3);
      
      const items = get(cartItems);
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('THEN should update derived stores correctly', () => {
      cartActions.addItem(mockProduct1, 2); // 2 * $10 = $20
      cartActions.addItem(mockProduct2, 1); // 1 * $25 = $25
      
      expect(get(itemCount)).toBe(3);
      expect(get(subtotal)).toBe(45);
      expect(get(isEmpty)).toBe(false);
    });
  });

  describe('WHEN items are removed from cart', () => {
    it('THEN should remove specific item', () => {
      cartActions.addItem(mockProduct1, 2);
      cartActions.addItem(mockProduct2, 1);
      
      cartActions.removeItem(mockProduct1.id);
      
      const items = get(cartItems);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(mockProduct2.id);
    });

    it('THEN should update derived stores after removal', () => {
      cartActions.addItem(mockProduct1, 2);
      cartActions.addItem(mockProduct2, 1);
      
      cartActions.removeItem(mockProduct1.id);
      
      expect(get(itemCount)).toBe(1);
      expect(get(subtotal)).toBe(25);
    });
  });

  describe('WHEN item quantities are updated', () => {
    it('THEN should update quantity for existing item', () => {
      cartActions.addItem(mockProduct1, 2);
      cartActions.updateQuantity(mockProduct1.id, 5);
      
      const items = get(cartItems);
      expect(items[0].quantity).toBe(5);
      expect(get(itemCount)).toBe(5);
    });

    it('THEN should remove item when quantity is 0', () => {
      cartActions.addItem(mockProduct1, 2);
      cartActions.updateQuantity(mockProduct1.id, 0);
      
      expect(get(cartItems)).toHaveLength(0);
      expect(get(isEmpty)).toBe(true);
    });
  });

  describe('WHEN discount is applied', () => {
    beforeEach(() => {
      cartActions.addItem(mockProduct1, 5); // $50 subtotal
    });

    it('THEN should calculate percentage discount correctly', () => {
      const percentageDiscount = {
        type: 'percentage',
        value: 20,
        code: 'SAVE20'
      };
      
      cartActions.applyDiscount(percentageDiscount);
      
      expect(get(discount)).toBe(10); // 20% of $50
      expect(get(discountedSubtotal)).toBe(40);
    });

    it('THEN should calculate fixed discount correctly', () => {
      const fixedDiscount = {
        type: 'fixed',
        value: 15,
        code: 'SAVE15'
      };
      
      cartActions.applyDiscount(fixedDiscount);
      
      expect(get(discount)).toBe(15);
      expect(get(discountedSubtotal)).toBe(35);
    });

    it('THEN should not exceed subtotal with fixed discount', () => {
      const largeFixedDiscount = {
        type: 'fixed',
        value: 100,
        code: 'SAVE100'
      };
      
      cartActions.applyDiscount(largeFixedDiscount);
      
      expect(get(discount)).toBe(50); // Limited to subtotal
      expect(get(discountedSubtotal)).toBe(0);
    });

    it('THEN should handle invalid discount type', () => {
      const invalidDiscount = {
        type: 'invalid',
        value: 20,
        code: 'INVALID'
      };
      
      cartActions.applyDiscount(invalidDiscount);
      
      expect(get(discount)).toBe(0);
    });
  });

  describe('WHEN tax is calculated', () => {
    it('THEN should calculate tax on discounted subtotal', () => {
      cartActions.addItem(mockProduct1, 10); // $100 subtotal
      
      const discount = {
        type: 'fixed',
        value: 20,
        code: 'SAVE20'
      };
      cartActions.applyDiscount(discount);
      
      // Tax should be calculated on $80 (discounted subtotal)
      expect(get(tax)).toBe(6.4); // 8% of $80
      expect(get(total)).toBe(86.4); // $80 + $6.40
    });

    it('THEN should update when tax rate changes', () => {
      cartActions.addItem(mockProduct1, 10); // $100 subtotal
      
      expect(get(tax)).toBe(8); // 8% of $100
      
      taxRate.set(0.1); // Change to 10%
      
      expect(get(tax)).toBe(10); // 10% of $100
    });
  });

  describe('WHEN testing cart summary', () => {
    it('THEN should provide complete cart summary', () => {
      cartActions.addItem(mockProduct1, 2); // $20
      cartActions.addItem(mockProduct2, 1); // $25
      
      const percentageDiscount = {
        type: 'percentage',
        value: 10,
        code: 'SAVE10'
      };
      cartActions.applyDiscount(percentageDiscount);
      
      const summary = get(cartSummary);
      
      expect(summary).toEqual({
        itemCount: 3,
        subtotal: 45,
        discount: 4.5, // 10% of $45
        tax: 3.24, // 8% of $40.50
        total: 43.74, // $40.50 + $3.24
        savings: 4.5
      });
    });

    it('THEN should show null savings when no discount', () => {
      cartActions.addItem(mockProduct1, 1);
      
      const summary = get(cartSummary);
      expect(summary.savings).toBeNull();
    });
  });

  describe('WHEN testing store reactivity', () => {
    it('THEN should update derived stores when dependencies change', () => {
      const subtotalValues = [];
      const totalValues = [];
      
      const unsubscribeSubtotal = subtotal.subscribe(value => {
        subtotalValues.push(value);
      });
      
      const unsubscribeTotal = total.subscribe(value => {
        totalValues.push(value);
      });
      
      cartActions.addItem(mockProduct1, 1); // $10
      cartActions.addItem(mockProduct1, 1); // $20
      
      expect(subtotalValues).toEqual([0, 10, 20]);
      expect(totalValues).toEqual([0, 10.8, 21.6]);
      
      unsubscribeSubtotal();
      unsubscribeTotal();
    });
  });
});
```

## Testing Custom Stores

### Async Store with API Integration
```javascript
// src/stores/user.js
import { writable, derived } from 'svelte/store';

function createUserStore() {
  const { subscribe, set, update } = writable({
    data: null,
    loading: false,
    error: null
  });

  return {
    subscribe,
    
    async login(credentials) {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const userData = await response.json();
        
        // Store token
        localStorage.setItem('authToken', userData.token);
        
        update(state => ({
          ...state,
          data: userData.user,
          loading: false
        }));
        
        return userData.user;
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
        throw error;
      }
    },
    
    async logout() {
      update(state => ({ ...state, loading: true }));
      
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
      } catch (error) {
        console.warn('Logout API call failed:', error);
      } finally {
        localStorage.removeItem('authToken');
        set({
          data: null,
          loading: false,
          error: null
        });
      }
    },
    
    async fetchProfile() {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      update(state => ({ ...state, loading: true }));
      
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const userData = await response.json();
        
        update(state => ({
          ...state,
          data: userData,
          loading: false
        }));
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
      }
    },
    
    clearError() {
      update(state => ({ ...state, error: null }));
    }
  };
}

export const user = createUserStore();

// Derived stores
export const isAuthenticated = derived(
  user,
  $user => $user.data !== null
);

export const isLoading = derived(
  user,
  $user => $user.loading
);

export const userError = derived(
  user,
  $user => $user.error
);

export const userProfile = derived(
  user,
  $user => $user.data
);
```

```javascript
// src/stores/user.test.js
import { get } from 'svelte/store';
import { user, isAuthenticated, isLoading, userError, userProfile } from './user.js';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

describe('GIVEN user store', () => {
  beforeEach(() => {
    // Reset store state
    user.logout();
    
    // Clear all mocks
    vi.clearAllMocks();
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('WHEN store is initialized', () => {
    it('THEN should have correct initial state', () => {
      const state = get(user);
      
      expect(state).toEqual({
        data: null,
        loading: false,
        error: null
      });
      
      expect(get(isAuthenticated)).toBe(false);
      expect(get(isLoading)).toBe(false);
      expect(get(userError)).toBe(null);
      expect(get(userProfile)).toBe(null);
    });
  });

  describe('WHEN login is called', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const mockUserData = {
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      }
    };

    it('THEN should handle successful login', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });

      const result = await user.login(mockCredentials);
      
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockCredentials)
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'authToken', 
        mockUserData.token
      );
      
      expect(result).toEqual(mockUserData.user);
      
      const state = get(user);
      expect(state.data).toEqual(mockUserData.user);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      
      expect(get(isAuthenticated)).toBe(true);
    });

    it('THEN should handle login failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(user.login(mockCredentials)).rejects.toThrow('Login failed');
      
      const state = get(user);
      expect(state.data).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Login failed');
      
      expect(get(isAuthenticated)).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('THEN should handle network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(user.login(mockCredentials)).rejects.toThrow('Network error');
      
      const state = get(user);
      expect(state.error).toBe('Network error');
    });

    it('THEN should set loading state during request', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      fetch.mockReturnValueOnce(promise);
      
      const loginPromise = user.login(mockCredentials);
      
      // Check loading state is true during request
      expect(get(isLoading)).toBe(true);
      
      resolvePromise({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });
      
      await loginPromise;
      
      // Check loading state is false after request
      expect(get(isLoading)).toBe(false);
    });
  });

  describe('WHEN logout is called', () => {
    it('THEN should handle successful logout', async () => {
      // Set up authenticated state
      localStorageMock.getItem.mockReturnValue('mock-token');
      fetch.mockResolvedValueOnce({ ok: true });

      await user.logout();
      
      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      
      const state = get(user);
      expect(state.data).toBe(null);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
      
      expect(get(isAuthenticated)).toBe(false);
    });

    it('THEN should handle logout API failure gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'));

      await user.logout();
      
      // Should still clear local state despite API error
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(get(isAuthenticated)).toBe(false);
    });
  });

  describe('WHEN fetchProfile is called', () => {
    const mockProfile = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'avatar-url'
    };

    it('THEN should fetch profile when token exists', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfile)
      });

      await user.fetchProfile();
      
      expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });
      
      expect(get(userProfile)).toEqual(mockProfile);
    });

    it('THEN should not fetch when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await user.fetchProfile();
      
      expect(fetch).not.toHaveBeenCalled();
    });

    it('THEN should handle fetch failure', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await user.fetchProfile();
      
      expect(get(userError)).toBe('Failed to fetch profile');
    });
  });

  describe('WHEN clearError is called', () => {
    it('THEN should clear error state', async () => {
      // Set error state
      fetch.mockRejectedValueOnce(new Error('Test error'));
      try {
        await user.login({});
      } catch {}
      
      expect(get(userError)).toBe('Test error');
      
      user.clearError();
      
      expect(get(userError)).toBe(null);
    });
  });

  describe('WHEN testing derived stores', () => {
    it('THEN should update derived stores when user state changes', () => {
      const authStates = [];
      const loadingStates = [];
      
      const unsubscribeAuth = isAuthenticated.subscribe(value => {
        authStates.push(value);
      });
      
      const unsubscribeLoading = isLoading.subscribe(value => {
        loadingStates.push(value);
      });
      
      // Simulate state changes
      user.clearError(); // Should not change auth/loading
      
      expect(authStates).toEqual([false]);
      expect(loadingStates).toEqual([false]);
      
      unsubscribeAuth();
      unsubscribeLoading();
    });
  });
});
```

## Testing Store-Component Integration

### Component Using Multiple Stores
```svelte
<!-- src/components/UserDashboard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user, isAuthenticated, isLoading, userError } from '../stores/user.js';
  import { notifications } from '../stores/notifications.js';
  import { cartSummary } from '../stores/shopping-cart.js';
  
  onMount(() => {
    if ($isAuthenticated) {
      user.fetchProfile();
    }
  });
  
  function handleLogout() {
    user.logout().then(() => {
      notifications.add({
        type: 'success',
        message: 'Successfully logged out',
        duration: 3000
      });
    });
  }
  
  function clearError() {
    user.clearError();
  }
</script>

<div class="dashboard" data-testid="dashboard">
  {#if $isLoading}
    <div class="loading" data-testid="loading">Loading...</div>
  {:else if !$isAuthenticated}
    <div class="not-authenticated" data-testid="not-authenticated">
      Please log in to view your dashboard.
    </div>
  {:else}
    <div class="authenticated-content">
      <header class="header">
        <h1>Welcome, {$user.data?.name || 'User'}!</h1>
        <button on:click={handleLogout} data-testid="logout-button">
          Logout
        </button>
      </header>
      
      {#if $userError}
        <div class="error" data-testid="error-message">
          {$userError}
          <button on:click={clearError} data-testid="clear-error">×</button>
        </div>
      {/if}
      
      <div class="user-info" data-testid="user-info">
        <p>Email: {$user.data?.email}</p>
        {#if $user.data?.avatar}
          <img src={$user.data.avatar} alt="Avatar" data-testid="avatar" />
        {/if}
      </div>
      
      {#if $cartSummary.itemCount > 0}
        <div class="cart-summary" data-testid="cart-summary">
          <h3>Your Cart</h3>
          <p>Items: {$cartSummary.itemCount}</p>
          <p>Total: ${$cartSummary.total.toFixed(2)}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
```

```javascript
// src/components/UserDashboard.test.js
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';

import UserDashboard from './UserDashboard.svelte';
import { user, isAuthenticated } from '../stores/user.js';
import { notifications } from '../stores/notifications.js';
import { cartActions } from '../stores/shopping-cart.js';

// Mock stores
vi.mock('../stores/user.js', () => {
  const { writable } = require('svelte/store');
  
  const mockUser = writable({
    data: null,
    loading: false,
    error: null
  });
  
  return {
    user: {
      subscribe: mockUser.subscribe,
      fetchProfile: vi.fn(),
      logout: vi.fn(() => Promise.resolve()),
      clearError: vi.fn()
    },
    isAuthenticated: writable(false),
    isLoading: writable(false),
    userError: writable(null)
  };
});

vi.mock('../stores/notifications.js', () => ({
  notifications: {
    add: vi.fn()
  }
}));

describe('GIVEN UserDashboard component', () => {
  const userSetup = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    cartActions.clear();
  });

  describe('WHEN user is not authenticated', () => {
    beforeEach(() => {
      isAuthenticated.set(false);
    });

    it('THEN should show not authenticated message', () => {
      const { getByTestId } = render(UserDashboard);
      
      expect(getByTestId('not-authenticated')).toBeInTheDocument();
      expect(getByTestId('not-authenticated')).toHaveTextContent(
        'Please log in to view your dashboard.'
      );
    });
  });

  describe('WHEN user is authenticated', () => {
    beforeEach(() => {
      isAuthenticated.set(true);
      user.data = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'avatar-url'
      };
    });

    it('THEN should show authenticated content', () => {
      const { getByTestId } = render(UserDashboard);
      
      expect(getByTestId('dashboard')).not.toHaveClass('not-authenticated');
      expect(getByTestId('user-info')).toBeInTheDocument();
      expect(getByTestId('logout-button')).toBeInTheDocument();
    });

    it('THEN should display user information', () => {
      const { getByTestId } = render(UserDashboard);
      
      const header = getByTestId('dashboard').querySelector('h1');
      expect(header).toHaveTextContent('Welcome, John Doe!');
      
      const userInfo = getByTestId('user-info');
      expect(userInfo).toHaveTextContent('Email: john@example.com');
      
      const avatar = getByTestId('avatar');
      expect(avatar).toHaveAttribute('src', 'avatar-url');
    });

    it('THEN should fetch profile on mount', () => {
      render(UserDashboard);
      
      expect(user.fetchProfile).toHaveBeenCalledTimes(1);
    });

    it('THEN should handle logout', async () => {
      const { getByTestId } = render(UserDashboard);
      
      const logoutButton = getByTestId('logout-button');
      await userSetup.click(logoutButton);
      
      expect(user.logout).toHaveBeenCalledTimes(1);
      
      await waitFor(() => {
        expect(notifications.add).toHaveBeenCalledWith({
          type: 'success',
          message: 'Successfully logged out',
          duration: 3000
        });
      });
    });
  });

  describe('WHEN there is an error', () => {
    beforeEach(() => {
      isAuthenticated.set(true);
      user.data = { name: 'John Doe', email: 'john@example.com' };
    });

    it('THEN should display error message', () => {
      // Mock error state
      const mockUserError = 'Profile fetch failed';
      
      const { getByTestId } = render(UserDashboard);
      
      // Simulate error (in real test, this would come from store)
      expect(getByTestId('error-message')).toHaveTextContent(mockUserError);
    });

    it('THEN should clear error when close button clicked', async () => {
      const { getByTestId } = render(UserDashboard);
      
      const clearErrorButton = getByTestId('clear-error');
      await userSetup.click(clearErrorButton);
      
      expect(user.clearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('WHEN cart has items', () => {
    beforeEach(() => {
      isAuthenticated.set(true);
      user.data = { name: 'John Doe', email: 'john@example.com' };
      
      // Add items to cart
      cartActions.addItem({ id: '1', name: 'Product 1', price: 10 }, 2);
    });

    it('THEN should show cart summary', () => {
      const { getByTestId } = render(UserDashboard);
      
      const cartSummary = getByTestId('cart-summary');
      expect(cartSummary).toBeInTheDocument();
      expect(cartSummary).toHaveTextContent('Items: 2');
      expect(cartSummary).toHaveTextContent('Total: $21.60'); // Including tax
    });
  });

  describe('WHEN loading', () => {
    beforeEach(() => {
      isLoading.set(true);
    });

    it('THEN should show loading state', () => {
      const { getByTestId } = render(UserDashboard);
      
      expect(getByTestId('loading')).toBeInTheDocument();
      expect(getByTestId('loading')).toHaveTextContent('Loading...');
    });
  });
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Integration Testing](./integration.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)