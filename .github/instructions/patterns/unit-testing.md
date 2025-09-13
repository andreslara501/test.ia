# Unit Testing Patterns

This guide covers universal unit testing patterns that apply across all JavaScript/TypeScript frameworks. These patterns focus on testing individual units of code in isolation with proper mocking and assertions.

## Core Unit Testing Principles

### Test Structure Pattern (AAA)
```javascript
describe('GIVEN a specific context or setup', () => {
  describe('WHEN a specific action occurs', () => {
    it('THEN should produce expected result', () => {
      // Arrange - Set up test data and dependencies
      const input = { name: 'John', age: 30 };
      const mockCallback = vi.fn();
      
      // Act - Execute the function under test
      const result = processUser(input, mockCallback);
      
      // Assert - Verify the outcome
      expect(result).toEqual({ id: expect.any(String), name: 'John', age: 30 });
      expect(mockCallback).toHaveBeenCalledWith(input);
    });
  });
});
```

### Test Organization Pattern
```javascript
// Good: Descriptive test structure
describe('UserValidator', () => {
  describe('validateEmail', () => {
    describe('WHEN email is valid', () => {
      it('THEN should return true for standard email format', () => {
        expect(UserValidator.validateEmail('user@example.com')).toBe(true);
      });
      
      it('THEN should return true for email with subdomain', () => {
        expect(UserValidator.validateEmail('user@mail.example.com')).toBe(true);
      });
    });
    
    describe('WHEN email is invalid', () => {
      it('THEN should return false for missing @ symbol', () => {
        expect(UserValidator.validateEmail('userexample.com')).toBe(false);
      });
      
      it('THEN should return false for empty string', () => {
        expect(UserValidator.validateEmail('')).toBe(false);
      });
    });
  });
});
```

## Function Testing Patterns

### Pure Function Testing
```javascript
// src/utils/calculations.js
export const calculateDiscount = (price, discountPercent, minPrice = 0) => {
  if (price < minPrice) {
    return 0;
  }
  
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  
  return price * (discountPercent / 100);
};

export const calculateTax = (amount, taxRate, region = 'default') => {
  const taxRates = {
    'US': 0.08,
    'CA': 0.12,
    'EU': 0.20,
    'default': 0.10
  };
  
  const rate = taxRates[region] || taxRates.default;
  return amount * rate;
};

export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};
```

```javascript
// src/utils/calculations.test.js
import { calculateDiscount, calculateTax, formatCurrency } from './calculations.js';

describe('GIVEN calculation utilities', () => {
  describe('calculateDiscount', () => {
    describe('WHEN valid inputs are provided', () => {
      it('THEN should calculate correct discount amount', () => {
        expect(calculateDiscount(100, 20)).toBe(20);
        expect(calculateDiscount(50, 15)).toBe(7.5);
        expect(calculateDiscount(200, 25)).toBe(50);
      });
      
      it('THEN should handle zero discount', () => {
        expect(calculateDiscount(100, 0)).toBe(0);
      });
      
      it('THEN should handle minimum price threshold', () => {
        expect(calculateDiscount(5, 20, 10)).toBe(0);
        expect(calculateDiscount(15, 20, 10)).toBe(3);
      });
    });
    
    describe('WHEN invalid inputs are provided', () => {
      it('THEN should throw error for negative discount', () => {
        expect(() => calculateDiscount(100, -5)).toThrow(
          'Discount percent must be between 0 and 100'
        );
      });
      
      it('THEN should throw error for discount over 100%', () => {
        expect(() => calculateDiscount(100, 150)).toThrow(
          'Discount percent must be between 0 and 100'
        );
      });
    });
  });
  
  describe('calculateTax', () => {
    describe('WHEN calculating tax for different regions', () => {
      it('THEN should use correct tax rates', () => {
        expect(calculateTax(100, null, 'US')).toBe(8);
        expect(calculateTax(100, null, 'CA')).toBe(12);
        expect(calculateTax(100, null, 'EU')).toBe(20);
        expect(calculateTax(100, null, 'default')).toBe(10);
      });
      
      it('THEN should use default rate for unknown region', () => {
        expect(calculateTax(100, null, 'UNKNOWN')).toBe(10);
      });
      
      it('THEN should handle decimal amounts', () => {
        expect(calculateTax(99.99, null, 'US')).toBeCloseTo(7.999, 3);
      });
    });
  });
  
  describe('formatCurrency', () => {
    describe('WHEN formatting different currencies', () => {
      it('THEN should format USD correctly', () => {
        expect(formatCurrency(123.45, 'USD', 'en-US')).toBe('$123.45');
      });
      
      it('THEN should format EUR correctly', () => {
        expect(formatCurrency(123.45, 'EUR', 'de-DE')).toBe('123,45 €');
      });
      
      it('THEN should use default values', () => {
        expect(formatCurrency(123.45)).toBe('$123.45');
      });
    });
  });
});
```

### Function with Side Effects Testing
```javascript
// src/services/logger.js
class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.logs = [];
  }
  
  log(message, level = 'info') {
    if (this.shouldLog(level)) {
      const logEntry = {
        message,
        level,
        timestamp: new Date(),
        id: this.generateId()
      };
      
      this.logs.push(logEntry);
      this.writeToConsole(logEntry);
      this.writeToStorage(logEntry);
      
      return logEntry.id;
    }
    
    return null;
  }
  
  shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level] <= levels[this.level];
  }
  
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
  
  writeToConsole(logEntry) {
    console[logEntry.level](logEntry.message);
  }
  
  writeToStorage(logEntry) {
    const stored = localStorage.getItem('app-logs') || '[]';
    const logs = JSON.parse(stored);
    logs.push(logEntry);
    localStorage.setItem('app-logs', JSON.stringify(logs.slice(-100))); // Keep last 100
  }
  
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('app-logs');
  }
  
  getLogs(level = null) {
    return level ? this.logs.filter(log => log.level === level) : this.logs;
  }
}

export default Logger;
```

```javascript
// src/services/logger.test.js
import Logger from './logger.js';

// Mock console methods
const mockConsole = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Mock localStorage
const mockLocalStorage = {
  storage: new Map(),
  getItem: vi.fn((key) => mockLocalStorage.storage.get(key) || null),
  setItem: vi.fn((key, value) => mockLocalStorage.storage.set(key, value)),
  removeItem: vi.fn((key) => mockLocalStorage.storage.delete(key))
};

describe('GIVEN Logger class', () => {
  let logger;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.storage.clear();
    
    // Replace global console and localStorage
    Object.assign(console, mockConsole);
    Object.assign(global.localStorage, mockLocalStorage);
    
    logger = new Logger('info');
    
    // Mock Math.random for predictable IDs
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('WHEN logging messages', () => {
    it('THEN should log info messages by default', () => {
      const logId = logger.log('Test message');
      
      expect(logId).toBe('4fzyo6msn'); // Predictable due to mocked random
      expect(mockConsole.info).toHaveBeenCalledWith('Test message');
      expect(logger.getLogs()).toHaveLength(1);
    });
    
    it('THEN should store logs in localStorage', () => {
      logger.log('Storage test');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'app-logs',
        expect.stringContaining('"message":"Storage test"')
      );
    });
    
    it('THEN should respect log levels', () => {
      const warnLogger = new Logger('warn');
      
      warnLogger.log('Debug message', 'debug');
      warnLogger.log('Info message', 'info');
      warnLogger.log('Warning message', 'warn');
      warnLogger.log('Error message', 'error');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledWith('Warning message');
      expect(mockConsole.error).toHaveBeenCalledWith('Error message');
      
      expect(warnLogger.getLogs()).toHaveLength(2);
    });
    
    it('THEN should filter logs by level', () => {
      logger.log('Error 1', 'error');
      logger.log('Info 1', 'info');
      logger.log('Error 2', 'error');
      
      const errorLogs = logger.getLogs('error');
      expect(errorLogs).toHaveLength(2);
      expect(errorLogs.every(log => log.level === 'error')).toBe(true);
    });
  });
  
  describe('WHEN managing log storage', () => {
    it('THEN should limit stored logs to 100 entries', () => {
      // Mock existing logs in storage
      const existingLogs = Array.from({ length: 99 }, (_, i) => ({
        message: `Existing log ${i}`,
        level: 'info',
        timestamp: new Date(),
        id: `existing-${i}`
      }));
      
      mockLocalStorage.storage.set('app-logs', JSON.stringify(existingLogs));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingLogs));
      
      logger.log('New log entry');
      
      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const storedLogs = JSON.parse(setItemCall[1]);
      
      expect(storedLogs).toHaveLength(100);
      expect(storedLogs[storedLogs.length - 1].message).toBe('New log entry');
    });
    
    it('THEN should clear all logs', () => {
      logger.log('Test 1');
      logger.log('Test 2');
      
      expect(logger.getLogs()).toHaveLength(2);
      
      logger.clearLogs();
      
      expect(logger.getLogs()).toHaveLength(0);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app-logs');
    });
  });
  
  describe('WHEN testing edge cases', () => {
    it('THEN should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => logger.log('Test message')).not.toThrow();
      expect(logger.getLogs()).toHaveLength(1); // Still logs in memory
    });
    
    it('THEN should handle malformed stored logs', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      expect(() => logger.log('Test message')).not.toThrow();
    });
  });
});
```

## Class Testing Patterns

### Class with Dependencies
```javascript
// src/services/userService.js
export class UserService {
  constructor(apiClient, cache, logger) {
    this.apiClient = apiClient;
    this.cache = cache;
    this.logger = logger;
    this.users = new Map();
  }
  
  async getUser(id) {
    // Check cache first
    const cached = await this.cache.get(`user:${id}`);
    if (cached) {
      this.logger.log(`User ${id} retrieved from cache`, 'debug');
      return cached;
    }
    
    // Check memory cache
    if (this.users.has(id)) {
      this.logger.log(`User ${id} retrieved from memory`, 'debug');
      return this.users.get(id);
    }
    
    try {
      // Fetch from API
      this.logger.log(`Fetching user ${id} from API`, 'info');
      const user = await this.apiClient.get(`/users/${id}`);
      
      // Store in caches
      this.users.set(id, user);
      await this.cache.set(`user:${id}`, user, 3600); // 1 hour TTL
      
      this.logger.log(`User ${id} fetched and cached`, 'info');
      return user;
      
    } catch (error) {
      this.logger.log(`Failed to fetch user ${id}: ${error.message}`, 'error');
      throw new Error(`Unable to retrieve user ${id}`);
    }
  }
  
  async createUser(userData) {
    try {
      const user = await this.apiClient.post('/users', userData);
      
      // Update caches
      this.users.set(user.id, user);
      await this.cache.set(`user:${user.id}`, user, 3600);
      
      this.logger.log(`User ${user.id} created successfully`, 'info');
      return user;
      
    } catch (error) {
      this.logger.log(`Failed to create user: ${error.message}`, 'error');
      throw error;
    }
  }
  
  async updateUser(id, updates) {
    try {
      const user = await this.apiClient.patch(`/users/${id}`, updates);
      
      // Update caches
      this.users.set(id, user);
      await this.cache.set(`user:${id}`, user, 3600);
      await this.cache.delete(`user:${id}:profile`); // Invalidate related cache
      
      this.logger.log(`User ${id} updated successfully`, 'info');
      return user;
      
    } catch (error) {
      this.logger.log(`Failed to update user ${id}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  clearCache() {
    this.users.clear();
    this.logger.log('User service cache cleared', 'debug');
  }
  
  getCacheSize() {
    return this.users.size;
  }
}
```

```javascript
// src/services/userService.test.js
import { UserService } from './userService.js';

describe('GIVEN UserService class', () => {
  let userService;
  let mockApiClient;
  let mockCache;
  let mockLogger;
  
  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    };
    
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };
    
    mockLogger = {
      log: vi.fn()
    };
    
    userService = new UserService(mockApiClient, mockCache, mockLogger);
  });
  
  describe('getUser', () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    describe('WHEN user is in cache', () => {
      beforeEach(() => {
        mockCache.get.mockResolvedValue(mockUser);
      });
      
      it('THEN should return cached user without API call', async () => {
        const result = await userService.getUser('1');
        
        expect(result).toEqual(mockUser);
        expect(mockCache.get).toHaveBeenCalledWith('user:1');
        expect(mockApiClient.get).not.toHaveBeenCalled();
        expect(mockLogger.log).toHaveBeenCalledWith(
          'User 1 retrieved from cache',
          'debug'
        );
      });
    });
    
    describe('WHEN user is in memory cache', () => {
      beforeEach(() => {
        mockCache.get.mockResolvedValue(null);
        userService.users.set('1', mockUser);
      });
      
      it('THEN should return memory cached user', async () => {
        const result = await userService.getUser('1');
        
        expect(result).toEqual(mockUser);
        expect(mockApiClient.get).not.toHaveBeenCalled();
        expect(mockLogger.log).toHaveBeenCalledWith(
          'User 1 retrieved from memory',
          'debug'
        );
      });
    });
    
    describe('WHEN user is not cached', () => {
      beforeEach(() => {
        mockCache.get.mockResolvedValue(null);
        mockApiClient.get.mockResolvedValue(mockUser);
      });
      
      it('THEN should fetch from API and cache result', async () => {
        const result = await userService.getUser('1');
        
        expect(result).toEqual(mockUser);
        expect(mockApiClient.get).toHaveBeenCalledWith('/users/1');
        expect(mockCache.set).toHaveBeenCalledWith('user:1', mockUser, 3600);
        expect(userService.users.get('1')).toEqual(mockUser);
        
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Fetching user 1 from API',
          'info'
        );
        expect(mockLogger.log).toHaveBeenCalledWith(
          'User 1 fetched and cached',
          'info'
        );
      });
    });
    
    describe('WHEN API call fails', () => {
      beforeEach(() => {
        mockCache.get.mockResolvedValue(null);
        mockApiClient.get.mockRejectedValue(new Error('Network error'));
      });
      
      it('THEN should throw error and log failure', async () => {
        await expect(userService.getUser('1')).rejects.toThrow(
          'Unable to retrieve user 1'
        );
        
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Failed to fetch user 1: Network error',
          'error'
        );
      });
    });
  });
  
  describe('createUser', () => {
    const userData = { name: 'Jane Doe', email: 'jane@example.com' };
    const createdUser = { id: '2', ...userData };
    
    describe('WHEN user creation succeeds', () => {
      beforeEach(() => {
        mockApiClient.post.mockResolvedValue(createdUser);
      });
      
      it('THEN should create user and update caches', async () => {
        const result = await userService.createUser(userData);
        
        expect(result).toEqual(createdUser);
        expect(mockApiClient.post).toHaveBeenCalledWith('/users', userData);
        expect(mockCache.set).toHaveBeenCalledWith('user:2', createdUser, 3600);
        expect(userService.users.get('2')).toEqual(createdUser);
        
        expect(mockLogger.log).toHaveBeenCalledWith(
          'User 2 created successfully',
          'info'
        );
      });
    });
    
    describe('WHEN user creation fails', () => {
      beforeEach(() => {
        mockApiClient.post.mockRejectedValue(new Error('Validation error'));
      });
      
      it('THEN should throw error and log failure', async () => {
        await expect(userService.createUser(userData)).rejects.toThrow(
          'Validation error'
        );
        
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Failed to create user: Validation error',
          'error'
        );
      });
    });
  });
  
  describe('updateUser', () => {
    const updates = { name: 'John Smith' };
    const updatedUser = { id: '1', name: 'John Smith', email: 'john@example.com' };
    
    describe('WHEN user update succeeds', () => {
      beforeEach(() => {
        mockApiClient.patch.mockResolvedValue(updatedUser);
      });
      
      it('THEN should update user and invalidate related cache', async () => {
        const result = await userService.updateUser('1', updates);
        
        expect(result).toEqual(updatedUser);
        expect(mockApiClient.patch).toHaveBeenCalledWith('/users/1', updates);
        expect(mockCache.set).toHaveBeenCalledWith('user:1', updatedUser, 3600);
        expect(mockCache.delete).toHaveBeenCalledWith('user:1:profile');
        
        expect(mockLogger.log).toHaveBeenCalledWith(
          'User 1 updated successfully',
          'info'
        );
      });
    });
  });
  
  describe('cache management', () => {
    it('THEN should clear memory cache', () => {
      userService.users.set('1', { id: '1', name: 'Test' });
      userService.users.set('2', { id: '2', name: 'Test 2' });
      
      expect(userService.getCacheSize()).toBe(2);
      
      userService.clearCache();
      
      expect(userService.getCacheSize()).toBe(0);
      expect(mockLogger.log).toHaveBeenCalledWith(
        'User service cache cleared',
        'debug'
      );
    });
  });
});
```

## Async Testing Patterns

### Promise Testing
```javascript
// src/utils/asyncUtils.js
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const timeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
};

export const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw new Error(`Failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      await delay(delayMs * attempt); // Exponential backoff
    }
  }
};

export const batchProcess = async (items, processor, batchSize = 5) => {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);
  }
  
  return results;
};
```

```javascript
// src/utils/asyncUtils.test.js
import { delay, timeout, retry, batchProcess } from './asyncUtils.js';

// Mock timers for controlled testing
vi.useFakeTimers();

describe('GIVEN async utilities', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });
  
  describe('delay', () => {
    it('THEN should resolve after specified time', async () => {
      const promise = delay(1000);
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      await expect(promise).resolves.toBeUndefined();
    });
  });
  
  describe('timeout', () => {
    it('THEN should resolve if promise completes in time', async () => {
      const fastPromise = Promise.resolve('success');
      
      const result = await timeout(fastPromise, 1000);
      
      expect(result).toBe('success');
    });
    
    it('THEN should reject if promise takes too long', async () => {
      const slowPromise = new Promise(resolve => 
        setTimeout(() => resolve('late'), 2000)
      );
      
      const timeoutPromise = timeout(slowPromise, 1000);
      
      // Advance time past timeout
      vi.advanceTimersByTime(1000);
      
      await expect(timeoutPromise).rejects.toThrow('Operation timed out');
    });
  });
  
  describe('retry', () => {
    it('THEN should succeed on first attempt', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      
      const result = await retry(successFn);
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });
    
    it('THEN should retry on failure and eventually succeed', async () => {
      const retryFn = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');
      
      const promise = retry(retryFn, 3, 100);
      
      // Advance timers for delays
      vi.advanceTimersByTime(100); // First retry delay
      await Promise.resolve(); // Allow promise to process
      vi.advanceTimersByTime(200); // Second retry delay (exponential)
      await Promise.resolve();
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(retryFn).toHaveBeenCalledTimes(3);
    });
    
    it('THEN should fail after max attempts', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      const promise = retry(failFn, 2, 100);
      
      // Advance timers for retry delay
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow(
        'Failed after 2 attempts: Always fails'
      );
      expect(failFn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('batchProcess', () => {
    it('THEN should process items in batches', async () => {
      const items = Array.from({ length: 12 }, (_, i) => i + 1);
      const processor = vi.fn().mockImplementation(item => 
        Promise.resolve(item * 2)
      );
      
      const results = await batchProcess(items, processor, 5);
      
      expect(results).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]);
      expect(processor).toHaveBeenCalledTimes(12);
      
      // Verify batching by checking call order
      const calls = processor.mock.calls.map(call => call[0]);
      expect(calls.slice(0, 5)).toEqual([1, 2, 3, 4, 5]); // First batch
      expect(calls.slice(5, 10)).toEqual([6, 7, 8, 9, 10]); // Second batch
      expect(calls.slice(10)).toEqual([11, 12]); // Final batch
    });
    
    it('THEN should handle empty array', async () => {
      const processor = vi.fn();
      
      const results = await batchProcess([], processor);
      
      expect(results).toEqual([]);
      expect(processor).not.toHaveBeenCalled();
    });
    
    it('THEN should handle batch size larger than array', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation(item => 
        Promise.resolve(item * 2)
      );
      
      const results = await batchProcess(items, processor, 10);
      
      expect(results).toEqual([2, 4, 6]);
      expect(processor).toHaveBeenCalledTimes(3);
    });
  });
});

// Real timer tests for actual async behavior
describe('GIVEN async utilities with real timers', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });
  
  it('THEN should actually wait for delays', async () => {
    const start = Date.now();
    await delay(50);
    const end = Date.now();
    
    expect(end - start).toBeGreaterThanOrEqual(40); // Allow some variance
  });
  
  it('THEN should handle concurrent async operations', async () => {
    const asyncFn = (value, delayMs) => 
      delay(delayMs).then(() => value * 2);
    
    const promises = [
      asyncFn(1, 30),
      asyncFn(2, 20),
      asyncFn(3, 10)
    ];
    
    const results = await Promise.all(promises);
    
    expect(results).toEqual([2, 4, 6]);
  });
});
```

## Error Handling Patterns

### Error Testing
```javascript
// src/utils/errorHandling.js
export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends Error {
  constructor(message, status, url) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.url = url;
  }
}

export const handleApiError = (error, context = '') => {
  if (error.name === 'NetworkError') {
    return {
      type: 'network',
      message: `Network error${context ? ` in ${context}` : ''}: ${error.message}`,
      status: error.status,
      retryable: error.status >= 500 || error.status === 408
    };
  }
  
  if (error.name === 'ValidationError') {
    return {
      type: 'validation',
      message: error.message,
      field: error.field,
      retryable: false
    };
  }
  
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred',
    retryable: false
  };
};

export const safeAsync = async (asyncFn, fallback = null) => {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('Safe async operation failed:', error);
    return fallback;
  }
};
```

```javascript
// src/utils/errorHandling.test.js
import { 
  ValidationError, 
  NetworkError, 
  handleApiError, 
  safeAsync 
} from './errorHandling.js';

describe('GIVEN error handling utilities', () => {
  describe('ValidationError', () => {
    it('THEN should create validation error with field', () => {
      const error = new ValidationError('Email is required', 'email');
      
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Email is required');
      expect(error.field).toBe('email');
      expect(error).toBeInstanceOf(Error);
    });
  });
  
  describe('NetworkError', () => {
    it('THEN should create network error with status and URL', () => {
      const error = new NetworkError('Server error', 500, '/api/users');
      
      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Server error');
      expect(error.status).toBe(500);
      expect(error.url).toBe('/api/users');
      expect(error).toBeInstanceOf(Error);
    });
  });
  
  describe('handleApiError', () => {
    describe('WHEN handling network errors', () => {
      it('THEN should format network error correctly', () => {
        const networkError = new NetworkError('Connection failed', 500, '/api/users');
        
        const result = handleApiError(networkError, 'user fetch');
        
        expect(result).toEqual({
          type: 'network',
          message: 'Network error in user fetch: Connection failed',
          status: 500,
          retryable: true
        });
      });
      
      it('THEN should mark 4xx errors as non-retryable', () => {
        const clientError = new NetworkError('Bad request', 400, '/api/users');
        
        const result = handleApiError(clientError);
        
        expect(result.retryable).toBe(false);
      });
      
      it('THEN should mark timeout errors as retryable', () => {
        const timeoutError = new NetworkError('Request timeout', 408, '/api/users');
        
        const result = handleApiError(timeoutError);
        
        expect(result.retryable).toBe(true);
      });
    });
    
    describe('WHEN handling validation errors', () => {
      it('THEN should format validation error correctly', () => {
        const validationError = new ValidationError('Invalid email format', 'email');
        
        const result = handleApiError(validationError);
        
        expect(result).toEqual({
          type: 'validation',
          message: 'Invalid email format',
          field: 'email',
          retryable: false
        });
      });
    });
    
    describe('WHEN handling unknown errors', () => {
      it('THEN should format unknown error correctly', () => {
        const unknownError = new Error('Something went wrong');
        
        const result = handleApiError(unknownError);
        
        expect(result).toEqual({
          type: 'unknown',
          message: 'Something went wrong',
          retryable: false
        });
      });
      
      it('THEN should handle errors without message', () => {
        const errorWithoutMessage = new Error();
        errorWithoutMessage.message = '';
        
        const result = handleApiError(errorWithoutMessage);
        
        expect(result.message).toBe('An unexpected error occurred');
      });
    });
  });
  
  describe('safeAsync', () => {
    it('THEN should return result when async function succeeds', async () => {
      const successFn = vi.fn().mockResolvedValue('success');
      
      const result = await safeAsync(successFn);
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });
    
    it('THEN should return fallback when async function fails', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await safeAsync(failFn, 'fallback');
      
      expect(result).toBe('fallback');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Safe async operation failed:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
    
    it('THEN should return null as default fallback', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('Failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await safeAsync(failFn);
      
      expect(result).toBe(null);
      
      consoleSpy.mockRestore();
    });
  });
});
```

## Data Validation Testing

### Validation Schema Testing
```javascript
// src/utils/validation.js
export const validationRules = {
  required: (value, fieldName) => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  },
  
  email: (value) => {
    if (!value) return null; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Invalid email format';
    }
    return null;
  },
  
  minLength: (minLength) => (value) => {
    if (!value) return null; // Optional field
    if (value.length < minLength) {
      return `Must be at least ${minLength} characters long`;
    }
    return null;
  },
  
  maxLength: (maxLength) => (value) => {
    if (!value) return null; // Optional field
    if (value.length > maxLength) {
      return `Must be no more than ${maxLength} characters long`;
    }
    return null;
  },
  
  pattern: (regex, message) => (value) => {
    if (!value) return null; // Optional field
    if (!regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  },
  
  range: (min, max) => (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) {
      return 'Must be a valid number';
    }
    if (num < min || num > max) {
      return `Must be between ${min} and ${max}`;
    }
    return null;
  }
};

export const validateField = (value, rules, fieldName) => {
  for (const rule of rules) {
    const error = rule(value, fieldName);
    if (error) {
      return error;
    }
  }
  return null;
};

export const validateForm = (data, schema) => {
  const errors = {};
  
  for (const [fieldName, rules] of Object.entries(schema)) {
    const value = data[fieldName];
    const error = validateField(value, rules, fieldName);
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

```javascript
// src/utils/validation.test.js
import { validationRules, validateField, validateForm } from './validation.js';

describe('GIVEN validation utilities', () => {
  describe('validationRules', () => {
    describe('required', () => {
      it('THEN should pass for valid values', () => {
        expect(validationRules.required('value', 'field')).toBe(null);
        expect(validationRules.required(0, 'field')).toBe(null);
        expect(validationRules.required(false, 'field')).toBe(null);
      });
      
      it('THEN should fail for empty values', () => {
        expect(validationRules.required('', 'Email')).toBe('Email is required');
        expect(validationRules.required(null, 'Name')).toBe('Name is required');
        expect(validationRules.required(undefined, 'Phone')).toBe('Phone is required');
      });
    });
    
    describe('email', () => {
      it('THEN should pass for valid emails', () => {
        expect(validationRules.email('user@example.com')).toBe(null);
        expect(validationRules.email('test.user+tag@example.co.uk')).toBe(null);
        expect(validationRules.email('')).toBe(null); // Optional
      });
      
      it('THEN should fail for invalid emails', () => {
        expect(validationRules.email('invalid-email')).toBe('Invalid email format');
        expect(validationRules.email('user@')).toBe('Invalid email format');
        expect(validationRules.email('@example.com')).toBe('Invalid email format');
      });
    });
    
    describe('minLength', () => {
      it('THEN should pass for valid lengths', () => {
        const minLength5 = validationRules.minLength(5);
        expect(minLength5('12345')).toBe(null);
        expect(minLength5('123456')).toBe(null);
        expect(minLength5('')).toBe(null); // Optional
      });
      
      it('THEN should fail for short values', () => {
        const minLength5 = validationRules.minLength(5);
        expect(minLength5('1234')).toBe('Must be at least 5 characters long');
      });
    });
    
    describe('pattern', () => {
      it('THEN should pass for matching patterns', () => {
        const phonePattern = validationRules.pattern(
          /^\d{3}-\d{3}-\d{4}$/,
          'Phone must be in format XXX-XXX-XXXX'
        );
        
        expect(phonePattern('123-456-7890')).toBe(null);
        expect(phonePattern('')).toBe(null); // Optional
      });
      
      it('THEN should fail for non-matching patterns', () => {
        const phonePattern = validationRules.pattern(
          /^\d{3}-\d{3}-\d{4}$/,
          'Phone must be in format XXX-XXX-XXXX'
        );
        
        expect(phonePattern('1234567890')).toBe('Phone must be in format XXX-XXX-XXXX');
      });
    });
    
    describe('range', () => {
      it('THEN should pass for values in range', () => {
        const range1to10 = validationRules.range(1, 10);
        expect(range1to10(5)).toBe(null);
        expect(range1to10(1)).toBe(null);
        expect(range1to10(10)).toBe(null);
        expect(range1to10(null)).toBe(null); // Optional
      });
      
      it('THEN should fail for values out of range', () => {
        const range1to10 = validationRules.range(1, 10);
        expect(range1to10(0)).toBe('Must be between 1 and 10');
        expect(range1to10(11)).toBe('Must be between 1 and 10');
      });
      
      it('THEN should fail for non-numeric values', () => {
        const range1to10 = validationRules.range(1, 10);
        expect(range1to10('abc')).toBe('Must be a valid number');
      });
    });
  });
  
  describe('validateField', () => {
    it('THEN should validate field with multiple rules', () => {
      const rules = [
        validationRules.required,
        validationRules.email
      ];
      
      expect(validateField('user@example.com', rules, 'Email')).toBe(null);
      expect(validateField('', rules, 'Email')).toBe('Email is required');
      expect(validateField('invalid', rules, 'Email')).toBe('Invalid email format');
    });
    
    it('THEN should return first error encountered', () => {
      const rules = [
        validationRules.required,
        validationRules.minLength(5),
        validationRules.email
      ];
      
      // Should fail on required first
      expect(validateField('', rules, 'Email')).toBe('Email is required');
      
      // Should fail on minLength before email
      expect(validateField('ab', rules, 'Email')).toBe('Must be at least 5 characters long');
    });
  });
  
  describe('validateForm', () => {
    const userSchema = {
      name: [validationRules.required],
      email: [validationRules.required, validationRules.email],
      age: [validationRules.required, validationRules.range(18, 100)],
      password: [validationRules.required, validationRules.minLength(8)]
    };
    
    it('THEN should pass validation for valid form data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        password: 'password123'
      };
      
      const result = validateForm(validData, userSchema);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
    
    it('THEN should fail validation and return all errors', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: 17,
        password: '123'
      };
      
      const result = validateForm(invalidData, userSchema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual({
        name: 'name is required',
        email: 'Invalid email format',
        age: 'Must be between 18 and 100',
        password: 'Must be at least 8 characters long'
      });
    });
    
    it('THEN should handle partial form data', () => {
      const partialData = {
        name: 'John Doe',
        email: 'john@example.com'
        // Missing age and password
      };
      
      const result = validateForm(partialData, userSchema);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual({
        age: 'age is required',
        password: 'password is required'
      });
    });
  });
});
```

## Related Resources
- [Integration Testing Patterns](./integration-testing.md)
- [E2E Testing Patterns](./e2e-testing.md)
- [Best Practices](../common/best-practices.md)
- [Testing Principles](../common/testing-principles.md)