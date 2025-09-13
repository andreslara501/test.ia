# Angular Service Testing

This guide covers comprehensive testing of Angular services, including dependency injection, HTTP services, and observable patterns.

## Basic Service Testing

### Simple Service Testing
```typescript
// services/calculation.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {
  add(a: number, b: number): number {
    return a + b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    return a / b;
  }

  factorial(n: number): number {
    if (n < 0) {
      throw new Error('Factorial of negative number is not defined');
    }
    if (n === 0 || n === 1) {
      return 1;
    }
    return n * this.factorial(n - 1);
  }
}
```

```typescript
// services/calculation.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { CalculationService } from './calculation.service';

describe('GIVEN CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalculationService);
  });

  it('WHEN service is created THEN should be truthy', () => {
    expect(service).toBeTruthy();
  });

  describe('GIVEN add method', () => {
    it('WHEN adding positive numbers THEN should return correct sum', () => {
      expect(service.add(2, 3)).toBe(5);
      expect(service.add(10, 15)).toBe(25);
    });

    it('WHEN adding negative numbers THEN should return correct sum', () => {
      expect(service.add(-2, -3)).toBe(-5);
      expect(service.add(-5, 3)).toBe(-2);
    });

    it('WHEN adding zero THEN should return correct sum', () => {
      expect(service.add(0, 5)).toBe(5);
      expect(service.add(5, 0)).toBe(5);
    });
  });

  describe('GIVEN multiply method', () => {
    it('WHEN multiplying positive numbers THEN should return correct product', () => {
      expect(service.multiply(2, 3)).toBe(6);
      expect(service.multiply(4, 5)).toBe(20);
    });

    it('WHEN multiplying by zero THEN should return zero', () => {
      expect(service.multiply(5, 0)).toBe(0);
      expect(service.multiply(0, 10)).toBe(0);
    });
  });

  describe('GIVEN divide method', () => {
    it('WHEN dividing valid numbers THEN should return correct quotient', () => {
      expect(service.divide(6, 2)).toBe(3);
      expect(service.divide(10, 4)).toBe(2.5);
    });

    it('WHEN dividing by zero THEN should throw error', () => {
      expect(() => service.divide(5, 0)).toThrowError('Division by zero is not allowed');
    });
  });

  describe('GIVEN factorial method', () => {
    it('WHEN calculating factorial of positive numbers THEN should return correct result', () => {
      expect(service.factorial(0)).toBe(1);
      expect(service.factorial(1)).toBe(1);
      expect(service.factorial(3)).toBe(6);
      expect(service.factorial(5)).toBe(120);
    });

    it('WHEN calculating factorial of negative number THEN should throw error', () => {
      expect(() => service.factorial(-1)).toThrowError('Factorial of negative number is not defined');
    });
  });
});
```

## HTTP Service Testing

### Service with HTTP Client
```typescript
// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://api.example.com';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createUser(user: CreateUserRequest): Observable<User> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users`, user, { headers })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updateUser(id: string, user: Partial<CreateUserRequest>): Observable<User> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, user, { headers })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  searchUsers(query: string, limit: number = 10): Observable<User[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users/search`, { params })
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
```

```typescript
// services/api.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, User, CreateUserRequest, ApiResponse } from './api.service';

describe('GIVEN ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('GIVEN getUsers method', () => {
    it('WHEN called THEN should return users array', () => {
      const mockUsers: User[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2023-01-01' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: '2023-01-02' }
      ];
      const mockResponse: ApiResponse<User[]> = {
        data: mockUsers,
        message: 'Success',
        status: 'ok'
      };

      service.getUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
        expect(users.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('WHEN API returns error THEN should handle error properly', () => {
      const errorMessage = 'Server error';

      service.getUsers().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain(errorMessage);
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/users`);
      req.flush({ message: errorMessage }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('GIVEN getUserById method', () => {
    it('WHEN called with valid ID THEN should return user', () => {
      const userId = '1';
      const mockUser: User = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2023-01-01'
      };
      const mockResponse: ApiResponse<User> = {
        data: mockUser,
        message: 'Success',
        status: 'ok'
      };

      service.getUserById(userId).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${baseUrl}/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('WHEN called with invalid ID THEN should handle 404 error', () => {
      const userId = 'invalid';

      service.getUserById(userId).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('404');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/users/${userId}`);
      req.flush({ message: 'User not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('GIVEN createUser method', () => {
    it('WHEN called with valid data THEN should create user', () => {
      const newUser: CreateUserRequest = {
        name: 'New User',
        email: 'new@example.com'
      };
      const createdUser: User = {
        id: '3',
        ...newUser,
        createdAt: '2023-01-03'
      };
      const mockResponse: ApiResponse<User> = {
        data: createdUser,
        message: 'User created',
        status: 'ok'
      };

      service.createUser(newUser).subscribe(user => {
        expect(user).toEqual(createdUser);
      });

      const req = httpMock.expectOne(`${baseUrl}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('WHEN called with invalid data THEN should handle validation error', () => {
      const invalidUser: CreateUserRequest = {
        name: '',
        email: 'invalid-email'
      };

      service.createUser(invalidUser).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('Validation failed');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/users`);
      req.flush({ message: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('GIVEN updateUser method', () => {
    it('WHEN called with valid data THEN should update user', () => {
      const userId = '1';
      const updateData = { name: 'Updated Name' };
      const updatedUser: User = {
        id: userId,
        name: 'Updated Name',
        email: 'john@example.com',
        createdAt: '2023-01-01'
      };
      const mockResponse: ApiResponse<User> = {
        data: updatedUser,
        message: 'User updated',
        status: 'ok'
      };

      service.updateUser(userId, updateData).subscribe(user => {
        expect(user).toEqual(updatedUser);
      });

      const req = httpMock.expectOne(`${baseUrl}/users/${userId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });
  });

  describe('GIVEN deleteUser method', () => {
    it('WHEN called with valid ID THEN should delete user', () => {
      const userId = '1';

      service.deleteUser(userId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/users/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('GIVEN searchUsers method', () => {
    it('WHEN called with query THEN should search users with default limit', () => {
      const query = 'john';
      const mockUsers: User[] = [
        { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2023-01-01' }
      ];
      const mockResponse: ApiResponse<User[]> = {
        data: mockUsers,
        message: 'Search results',
        status: 'ok'
      };

      service.searchUsers(query).subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne(
        request => request.url === `${baseUrl}/users/search` && 
                  request.params.get('q') === query &&
                  request.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('WHEN called with query and custom limit THEN should use custom limit', () => {
      const query = 'jane';
      const limit = 5;

      service.searchUsers(query, limit).subscribe();

      const req = httpMock.expectOne(
        request => request.url === `${baseUrl}/users/search` && 
                  request.params.get('q') === query &&
                  request.params.get('limit') === '5'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], message: 'No results', status: 'ok' });
    });
  });
});
```

## Service with Dependencies

### Service with Injected Dependencies
```typescript
// services/logger.service.ts
import { Injectable } from '@angular/core';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.Info;

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.Debug, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.Info, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.Warn, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.Error, message, ...args);
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level >= this.logLevel) {
      const timestamp = new Date().toISOString();
      const levelString = LogLevel[level];
      console.log(`[${timestamp}] ${levelString}: ${message}`, ...args);
    }
  }
}
```

```typescript
// services/user-manager.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService, User, CreateUserRequest } from './api.service';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class UserManagerService {
  private cachedUsers: User[] = [];

  constructor(
    private apiService: ApiService,
    private logger: LoggerService
  ) {}

  loadUsers(forceRefresh = false): Observable<User[]> {
    if (!forceRefresh && this.cachedUsers.length > 0) {
      this.logger.debug('Returning cached users');
      return of(this.cachedUsers);
    }

    this.logger.info('Loading users from API');
    return this.apiService.getUsers().pipe(
      tap(users => {
        this.cachedUsers = users;
        this.logger.info(`Loaded ${users.length} users`);
      }),
      catchError(error => {
        this.logger.error('Failed to load users', error);
        return throwError(() => error);
      })
    );
  }

  getUserById(id: string): Observable<User | null> {
    this.logger.debug(`Getting user by ID: ${id}`);
    
    // First check cache
    const cachedUser = this.cachedUsers.find(user => user.id === id);
    if (cachedUser) {
      this.logger.debug('User found in cache');
      return of(cachedUser);
    }

    // If not in cache, fetch from API
    return this.apiService.getUserById(id).pipe(
      tap(user => {
        this.logger.info(`Fetched user ${user.name} from API`);
        // Add to cache
        this.cachedUsers.push(user);
      }),
      catchError(error => {
        this.logger.error(`Failed to get user ${id}`, error);
        return of(null);
      })
    );
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    this.logger.info('Creating new user', userData);
    
    return this.apiService.createUser(userData).pipe(
      tap(user => {
        this.cachedUsers.push(user);
        this.logger.info(`Created user ${user.name} with ID ${user.id}`);
      }),
      catchError(error => {
        this.logger.error('Failed to create user', error);
        return throwError(() => error);
      })
    );
  }

  removeUserFromCache(id: string): void {
    const index = this.cachedUsers.findIndex(user => user.id === id);
    if (index > -1) {
      this.cachedUsers.splice(index, 1);
      this.logger.debug(`Removed user ${id} from cache`);
    }
  }

  clearCache(): void {
    this.cachedUsers = [];
    this.logger.info('User cache cleared');
  }

  getCachedUsers(): User[] {
    return [...this.cachedUsers];
  }
}
```

```typescript
// services/user-manager.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserManagerService } from './user-manager.service';
import { ApiService, User, CreateUserRequest } from './api.service';
import { LoggerService } from './logger.service';

describe('GIVEN UserManagerService', () => {
  let service: UserManagerService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockLoggerService: jasmine.SpyObj<LoggerService>;

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2023-01-01' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: '2023-01-02' }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getUsers', 'getUserById', 'createUser'
    ]);
    const loggerServiceSpy = jasmine.createSpyObj('LoggerService', [
      'debug', 'info', 'warn', 'error'
    ]);

    TestBed.configureTestingModule({
      providers: [
        UserManagerService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy }
      ]
    });

    service = TestBed.inject(UserManagerService);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockLoggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
  });

  describe('GIVEN loadUsers method', () => {
    it('WHEN called first time THEN should fetch from API and cache', () => {
      mockApiService.getUsers.and.returnValue(of(mockUsers));

      service.loadUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
        expect(service.getCachedUsers()).toEqual(mockUsers);
      });

      expect(mockApiService.getUsers).toHaveBeenCalled();
      expect(mockLoggerService.info).toHaveBeenCalledWith('Loading users from API');
      expect(mockLoggerService.info).toHaveBeenCalledWith('Loaded 2 users');
    });

    it('WHEN called second time without force refresh THEN should return cached data', () => {
      mockApiService.getUsers.and.returnValue(of(mockUsers));

      // First call to populate cache
      service.loadUsers().subscribe();
      mockApiService.getUsers.calls.reset();
      mockLoggerService.debug.calls.reset();

      // Second call should use cache
      service.loadUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      expect(mockApiService.getUsers).not.toHaveBeenCalled();
      expect(mockLoggerService.debug).toHaveBeenCalledWith('Returning cached users');
    });

    it('WHEN called with force refresh THEN should fetch from API', () => {
      mockApiService.getUsers.and.returnValue(of(mockUsers));

      // First call to populate cache
      service.loadUsers().subscribe();
      mockApiService.getUsers.calls.reset();

      // Second call with force refresh
      service.loadUsers(true).subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      expect(mockApiService.getUsers).toHaveBeenCalled();
    });

    it('WHEN API call fails THEN should log error and propagate', () => {
      const error = new Error('API Error');
      mockApiService.getUsers.and.returnValue(throwError(() => error));

      service.loadUsers().subscribe({
        next: () => fail('Expected error'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });

      expect(mockLoggerService.error).toHaveBeenCalledWith('Failed to load users', error);
    });
  });

  describe('GIVEN getUserById method', () => {
    it('WHEN user exists in cache THEN should return cached user', () => {
      // Populate cache first
      mockApiService.getUsers.and.returnValue(of(mockUsers));
      service.loadUsers().subscribe();

      service.getUserById('1').subscribe(user => {
        expect(user).toEqual(mockUsers[0]);
      });

      expect(mockApiService.getUserById).not.toHaveBeenCalled();
      expect(mockLoggerService.debug).toHaveBeenCalledWith('User found in cache');
    });

    it('WHEN user not in cache THEN should fetch from API', () => {
      const newUser: User = { 
        id: '3', 
        name: 'New User', 
        email: 'new@example.com', 
        createdAt: '2023-01-03' 
      };
      mockApiService.getUserById.and.returnValue(of(newUser));

      service.getUserById('3').subscribe(user => {
        expect(user).toEqual(newUser);
        expect(service.getCachedUsers()).toContain(newUser);
      });

      expect(mockApiService.getUserById).toHaveBeenCalledWith('3');
      expect(mockLoggerService.info).toHaveBeenCalledWith('Fetched user New User from API');
    });

    it('WHEN API call fails THEN should log error and return null', () => {
      const error = new Error('User not found');
      mockApiService.getUserById.and.returnValue(throwError(() => error));

      service.getUserById('999').subscribe(user => {
        expect(user).toBeNull();
      });

      expect(mockLoggerService.error).toHaveBeenCalledWith('Failed to get user 999', error);
    });
  });

  describe('GIVEN createUser method', () => {
    it('WHEN called with valid data THEN should create user and add to cache', () => {
      const userData: CreateUserRequest = { name: 'New User', email: 'new@example.com' };
      const createdUser: User = { 
        id: '3', 
        ...userData, 
        createdAt: '2023-01-03' 
      };
      
      mockApiService.createUser.and.returnValue(of(createdUser));

      service.createUser(userData).subscribe(user => {
        expect(user).toEqual(createdUser);
        expect(service.getCachedUsers()).toContain(createdUser);
      });

      expect(mockApiService.createUser).toHaveBeenCalledWith(userData);
      expect(mockLoggerService.info).toHaveBeenCalledWith('Creating new user', userData);
      expect(mockLoggerService.info).toHaveBeenCalledWith('Created user New User with ID 3');
    });

    it('WHEN API call fails THEN should log error and propagate', () => {
      const userData: CreateUserRequest = { name: 'Invalid', email: 'invalid' };
      const error = new Error('Validation failed');
      
      mockApiService.createUser.and.returnValue(throwError(() => error));

      service.createUser(userData).subscribe({
        next: () => fail('Expected error'),
        error: (err) => {
          expect(err).toBe(error);
        }
      });

      expect(mockLoggerService.error).toHaveBeenCalledWith('Failed to create user', error);
    });
  });

  describe('GIVEN cache management methods', () => {
    beforeEach(() => {
      // Populate cache
      mockApiService.getUsers.and.returnValue(of(mockUsers));
      service.loadUsers().subscribe();
    });

    it('WHEN removeUserFromCache is called THEN should remove user from cache', () => {
      service.removeUserFromCache('1');

      const cachedUsers = service.getCachedUsers();
      expect(cachedUsers.length).toBe(1);
      expect(cachedUsers.find(u => u.id === '1')).toBeUndefined();
      expect(mockLoggerService.debug).toHaveBeenCalledWith('Removed user 1 from cache');
    });

    it('WHEN clearCache is called THEN should clear all cached users', () => {
      service.clearCache();

      expect(service.getCachedUsers()).toEqual([]);
      expect(mockLoggerService.info).toHaveBeenCalledWith('User cache cleared');
    });

    it('WHEN getCachedUsers is called THEN should return copy of cached users', () => {
      const cachedUsers = service.getCachedUsers();
      
      expect(cachedUsers).toEqual(mockUsers);
      // Ensure it's a copy, not the original array
      cachedUsers.pop();
      expect(service.getCachedUsers().length).toBe(2);
    });
  });
});
```

## Observable Service Testing

### Service with Complex Observables
```typescript
// services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  autoHide?: boolean;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private nextId = 1;

  notifications$ = this.notificationsSubject.asObservable();

  show(
    message: string, 
    type: Notification['type'] = 'info',
    autoHide = true,
    duration = 5000
  ): string {
    const notification: Notification = {
      id: this.nextId++.toString(),
      message,
      type,
      timestamp: new Date(),
      autoHide,
      duration
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    if (autoHide) {
      timer(duration).subscribe(() => {
        this.hide(notification.id);
      });
    }

    return notification.id;
  }

  hide(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(updatedNotifications);
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  getNotificationsByType(type: Notification['type']): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === type))
    );
  }

  getLatestNotification(): Observable<Notification | null> {
    return this.notifications$.pipe(
      map(notifications => notifications.length > 0 ? notifications[notifications.length - 1] : null)
    );
  }

  hasNotifications(): Observable<boolean> {
    return this.notifications$.pipe(
      map(notifications => notifications.length > 0)
    );
  }

  success(message: string): string {
    return this.show(message, 'success');
  }

  error(message: string, autoHide = false): string {
    return this.show(message, 'error', autoHide);
  }

  warning(message: string): string {
    return this.show(message, 'warning');
  }

  info(message: string): string {
    return this.show(message, 'info');
  }
}
```

```typescript
// services/notification.service.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService, Notification } from './notification.service';

describe('GIVEN NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('WHEN service is created THEN should initialize with empty notifications', () => {
    service.notifications$.subscribe(notifications => {
      expect(notifications).toEqual([]);
    });
  });

  describe('GIVEN show method', () => {
    it('WHEN called THEN should add notification to list', () => {
      const id = service.show('Test message', 'info', false);

      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(1);
        expect(notifications[0].id).toBe(id);
        expect(notifications[0].message).toBe('Test message');
        expect(notifications[0].type).toBe('info');
        expect(notifications[0].autoHide).toBe(false);
      });
    });

    it('WHEN called multiple times THEN should add all notifications', () => {
      service.show('First message', 'info', false);
      service.show('Second message', 'success', false);

      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(2);
        expect(notifications[0].message).toBe('First message');
        expect(notifications[1].message).toBe('Second message');
      });
    });

    it('WHEN autoHide is true THEN should auto-remove after duration', fakeAsync(() => {
      const id = service.show('Auto-hide message', 'info', true, 1000);

      // Initially should be present
      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(1);
      });

      // After duration should be removed
      tick(1000);

      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(0);
      });
    }));
  });

  describe('GIVEN hide method', () => {
    it('WHEN called with valid ID THEN should remove notification', () => {
      const id = service.show('Test message', 'info', false);
      
      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(1);
      });

      service.hide(id);

      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(0);
      });
    });

    it('WHEN called with invalid ID THEN should not affect notifications', () => {
      service.show('Test message', 'info', false);
      
      service.hide('invalid-id');

      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(1);
      });
    });
  });

  describe('GIVEN clear method', () => {
    it('WHEN called THEN should remove all notifications', () => {
      service.show('First message', 'info', false);
      service.show('Second message', 'success', false);

      service.clear();

      service.notifications$.subscribe(notifications => {
        expect(notifications.length).toBe(0);
      });
    });
  });

  describe('GIVEN getNotificationsByType method', () => {
    it('WHEN called with specific type THEN should return filtered notifications', () => {
      service.show('Info message', 'info', false);
      service.show('Error message', 'error', false);
      service.show('Another info', 'info', false);

      service.getNotificationsByType('info').subscribe(notifications => {
        expect(notifications.length).toBe(2);
        expect(notifications.every(n => n.type === 'info')).toBe(true);
      });

      service.getNotificationsByType('error').subscribe(notifications => {
        expect(notifications.length).toBe(1);
        expect(notifications[0].type).toBe('error');
      });
    });
  });

  describe('GIVEN getLatestNotification method', () => {
    it('WHEN no notifications exist THEN should return null', () => {
      service.getLatestNotification().subscribe(notification => {
        expect(notification).toBe(null);
      });
    });

    it('WHEN notifications exist THEN should return latest', () => {
      service.show('First message', 'info', false);
      service.show('Latest message', 'success', false);

      service.getLatestNotification().subscribe(notification => {
        expect(notification?.message).toBe('Latest message');
        expect(notification?.type).toBe('success');
      });
    });
  });

  describe('GIVEN hasNotifications method', () => {
    it('WHEN no notifications exist THEN should return false', () => {
      service.hasNotifications().subscribe(hasNotifications => {
        expect(hasNotifications).toBe(false);
      });
    });

    it('WHEN notifications exist THEN should return true', () => {
      service.show('Test message', 'info', false);

      service.hasNotifications().subscribe(hasNotifications => {
        expect(hasNotifications).toBe(true);
      });
    });
  });

  describe('GIVEN convenience methods', () => {
    it('WHEN success is called THEN should create success notification', () => {
      service.success('Success message');

      service.notifications$.subscribe(notifications => {
        expect(notifications[0].type).toBe('success');
        expect(notifications[0].message).toBe('Success message');
      });
    });

    it('WHEN error is called THEN should create error notification without auto-hide', () => {
      service.error('Error message');

      service.notifications$.subscribe(notifications => {
        expect(notifications[0].type).toBe('error');
        expect(notifications[0].message).toBe('Error message');
        expect(notifications[0].autoHide).toBe(false);
      });
    });

    it('WHEN warning is called THEN should create warning notification', () => {
      service.warning('Warning message');

      service.notifications$.subscribe(notifications => {
        expect(notifications[0].type).toBe('warning');
        expect(notifications[0].message).toBe('Warning message');
      });
    });

    it('WHEN info is called THEN should create info notification', () => {
      service.info('Info message');

      service.notifications$.subscribe(notifications => {
        expect(notifications[0].type).toBe('info');
        expect(notifications[0].message).toBe('Info message');
      });
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