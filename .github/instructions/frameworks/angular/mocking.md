# Angular Mocking Strategies

This guide covers comprehensive mocking strategies for Angular testing, including services, HTTP calls, dependencies, and complex scenarios.

## 🚨 CRITICAL: NgRx Store Mocking

### When Components Use NgRx Store

**Problem**: `NullInjectorError: No provider for Store!`

Components that inject NgRx Store will fail without proper test setup:

```typescript
// Component that uses Store
@Component({
  selector: 'app-dashboard',
  template: `
    <div>{{ user$ | async }}</div>
    <div>{{ isLoading$ | async }}</div>
  `
})
export class DashboardComponent {
  private store = inject(Store);
  
  user$ = this.store.select(selectUser);
  isLoading$ = this.store.select(selectIsLoading);
  
  ngOnInit() {
    this.store.dispatch(loadUser());
  }
}

// ✅ SOLUTION: Use MockStore
import { MockStore, provideMockStore } from '@ngrx/store/testing';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let store: MockStore;

  const initialState = {
    auth: {
      user: { id: '1', name: 'Test User' },
      isAuthenticated: true,
      isLoading: false,
      error: null
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideMockStore({ initialState })
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should dispatch loadData on init', () => {
    spyOn(store, 'dispatch');
    
    component.ngOnInit();
    
    expect(store.dispatch).toHaveBeenCalledWith(loadData());
  });

  it('should select data from store', () => {
    // Override specific selector for this test
    store.overrideSelector(selectUserData, { id: '2', name: 'Test Data' });
    store.refreshState();
    
    component.data$.subscribe(data => {
      expect(data.name).toBe('Test Data');
    });
  });
});
```

### Facade Pattern with NgRx

**Problem**: Facades inject Store and expose observables that aren't mocked.

```typescript
// Generic DataFacade that wraps Store
@Injectable()
export class DataFacade {
  private store = inject(Store);

  // Observable properties - adapt to your domain
  items$ = this.store.select(selectItems);
  selectedItem$ = this.store.select(selectSelectedItem);
  isLoading$ = this.store.select(selectIsLoading);
  error$ = this.store.select(selectError);

  // Action methods - adapt to your needs
  loadData(params: any) {
    this.store.dispatch(loadDataRequest(params));
  }

  clearData() {
    this.store.dispatch(clearData());
  }

  // Synchronous getters (use firstValueFrom internally)  
  getCurrentItem(): any | null {
    return /* sync implementation using store */;
  }
}

// ✅ SOLUTION: Mock ALL observable properties
describe('ComponentUsingDataFacade', () => {
  let dataFacadeSpy: jasmine.SpyObj<DataFacade>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('DataFacade', [
      'loadData',
      'clearData', 
      'getCurrentItem',
      'refreshData'
    ]);

    // ✅ CRITICAL: Mock ALL observable properties your component uses
    spy.items$ = of([]);
    spy.selectedItem$ = of(null);
    spy.isLoading$ = of(false);
    spy.error$ = of(null);

    await TestBed.configureTestingModule({
      imports: [ComponentName],
      providers: [
        { provide: DataFacade, useValue: spy }
      ]
    }).compileComponents();

    dataFacadeSpy = TestBed.inject(DataFacade) as jasmine.SpyObj<DataFacade>;
  });

  it('should handle data state', () => {
    // Change observable value for specific test
    dataFacadeSpy.isLoading$ = of(true);
    dataFacadeSpy.items$ = of([{ id: '1', name: 'Test Item' }]);

    fixture.detectChanges();

    expect(component.isLoading).toBe(true);
  });
});
```

## Service Mocking

### Basic Service Mocking with Jasmine Spies
```typescript
// services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  login(username: string, password: string): Observable<User> {
    // Implementation
    return new Observable();
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles.includes(role) ?? false;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}
```

```typescript
// components/protected.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService, User } from '../services/auth.service';
import { ProtectedComponent } from './protected.component';

describe('GIVEN ProtectedComponent', () => {
  let component: ProtectedComponent;
  let fixture: ComponentFixture<ProtectedComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['admin', 'user']
  };

  beforeEach(async () => {
    // Create spy object with all methods
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'logout',
      'getCurrentUser',
      'hasRole',
      'isAuthenticated'
    ], {
      // Properties (getters) can be defined here
      currentUser$: of(mockUser)
    });

    await TestBed.configureTestingModule({
      declarations: [ProtectedComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProtectedComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  describe('WHEN user is authenticated', () => {
    it('THEN should show protected content', () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);

      fixture.detectChanges();

      expect(component.isAuthenticated).toBe(true);
      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });

    it('THEN should check user roles correctly', () => {
      mockAuthService.hasRole.and.returnValue(true);

      const hasAdminRole = component.checkAdminRole();

      expect(mockAuthService.hasRole).toHaveBeenCalledWith('admin');
      expect(hasAdminRole).toBe(true);
    });
  });

  describe('WHEN user is not authenticated', () => {
    it('THEN should hide protected content', () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockAuthService.getCurrentUser.and.returnValue(null);

      fixture.detectChanges();

      expect(component.isAuthenticated).toBe(false);
    });
  });

  describe('WHEN logout is called', () => {
    it('THEN should call auth service logout', () => {
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });
});
```

### Advanced Service Mocking with Custom Implementation
```typescript
// Custom mock implementation for complex scenarios
class MockAuthService {
  private _currentUser: User | null = null;
  private _currentUserSubject = new BehaviorSubject<User | null>(null);

  get currentUser$() {
    return this._currentUserSubject.asObservable();
  }

  login(username: string, password: string): Observable<User> {
    if (username === 'valid' && password === 'password') {
      const user: User = {
        id: '1',
        username,
        email: `${username}@example.com`,
        roles: ['user']
      };
      this._currentUser = user;
      this._currentUserSubject.next(user);
      return of(user);
    }
    return throwError(() => new Error('Invalid credentials'));
  }

  logout(): void {
    this._currentUser = null;
    this._currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this._currentUser;
  }

  hasRole(role: string): boolean {
    return this._currentUser?.roles.includes(role) ?? false;
  }

  isAuthenticated(): boolean {
    return this._currentUser !== null;
  }

  // Test helpers
  setCurrentUser(user: User | null): void {
    this._currentUser = user;
    this._currentUserSubject.next(user);
  }
}

describe('GIVEN LoginComponent with custom mock', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: MockAuthService;

  beforeEach(async () => {
    mockAuthService = new MockAuthService();

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('WHEN valid credentials are provided THEN should login successfully', () => {
    component.username = 'valid';
    component.password = 'password';

    component.login();

    expect(mockAuthService.isAuthenticated()).toBe(true);
    expect(mockAuthService.getCurrentUser()?.username).toBe('valid');
  });

  it('WHEN invalid credentials are provided THEN should handle error', () => {
    component.username = 'invalid';
    component.password = 'wrong';

    component.login();

    expect(mockAuthService.isAuthenticated()).toBe(false);
    expect(component.errorMessage).toBeTruthy();
  });
});
```

## HTTP Mocking

### HttpClientTestingModule for API Calls
```typescript
// services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  description?: string;
}

export interface ProductFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'https://api.example.com/products';

  constructor(private http: HttpClient) {}

  getProducts(filters?: ProductFilters): Observable<Product[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.category) params = params.set('category', filters.category);
      if (filters.priceMin !== undefined) params = params.set('priceMin', filters.priceMin.toString());
      if (filters.priceMax !== undefined) params = params.set('priceMax', filters.priceMax.toString());
      if (filters.inStock !== undefined) params = params.set('inStock', filters.inStock.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<{ data: Product[] }>(`${this.baseUrl}`, { params })
      .pipe(
        map(response => response.data),
        retry(2),
        catchError(this.handleError)
      );
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<{ data: Product }>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<{ data: Product }>(`${this.baseUrl}`, product)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<{ data: Product }>(`${this.baseUrl}/${id}`, product)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
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
// services/product.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService, Product, ProductFilters } from './product.service';

describe('GIVEN ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const baseUrl = 'https://api.example.com/products';

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Laptop',
      price: 999.99,
      category: 'electronics',
      inStock: true,
      description: 'High-performance laptop'
    },
    {
      id: '2',
      name: 'Mouse',
      price: 29.99,
      category: 'electronics',
      inStock: false,
      description: 'Wireless mouse'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  describe('GIVEN getProducts method', () => {
    it('WHEN called without filters THEN should fetch all products', () => {
      service.getProducts().subscribe(products => {
        expect(products).toEqual(mockProducts);
        expect(products.length).toBe(2);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush({ data: mockProducts });
    });

    it('WHEN called with filters THEN should include query parameters', () => {
      const filters: ProductFilters = {
        category: 'electronics',
        priceMin: 20,
        priceMax: 1000,
        inStock: true,
        search: 'laptop'
      };

      service.getProducts(filters).subscribe(products => {
        expect(products).toEqual(mockProducts);
      });

      const req = httpMock.expectOne(request => {
        return request.url === baseUrl &&
               request.params.get('category') === 'electronics' &&
               request.params.get('priceMin') === '20' &&
               request.params.get('priceMax') === '1000' &&
               request.params.get('inStock') === 'true' &&
               request.params.get('search') === 'laptop';
      });
      
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockProducts });
    });

    it('WHEN API returns error THEN should retry and handle error', () => {
      let errorResponse: any;
      
      service.getProducts().subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          errorResponse = error;
        }
      });

      // First attempt fails
      const req1 = httpMock.expectOne(baseUrl);
      req1.flush('Server error', { status: 500, statusText: 'Server Error' });

      // Second attempt (retry) fails
      const req2 = httpMock.expectOne(baseUrl);
      req2.flush('Server error', { status: 500, statusText: 'Server Error' });

      // Third attempt (retry) fails
      const req3 = httpMock.expectOne(baseUrl);
      req3.flush('Server error', { status: 500, statusText: 'Server Error' });

      expect(errorResponse).toBeTruthy();
      expect(errorResponse.message).toContain('Error Code: 500');
    });
  });

  describe('GIVEN getProductById method', () => {
    it('WHEN called with valid ID THEN should return product', () => {
      const productId = '1';
      const expectedProduct = mockProducts[0];

      service.getProductById(productId).subscribe(product => {
        expect(product).toEqual(expectedProduct);
      });

      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: expectedProduct });
    });

    it('WHEN called with invalid ID THEN should handle 404 error', () => {
      const productId = 'invalid';
      
      service.getProductById(productId).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('Error Code: 404');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      req.flush('Product not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('GIVEN createProduct method', () => {
    it('WHEN called with valid data THEN should create product', () => {
      const newProduct: Omit<Product, 'id'> = {
        name: 'Keyboard',
        price: 79.99,
        category: 'electronics',
        inStock: true,
        description: 'Mechanical keyboard'
      };
      
      const createdProduct: Product = { id: '3', ...newProduct };

      service.createProduct(newProduct).subscribe(product => {
        expect(product).toEqual(createdProduct);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newProduct);
      req.flush({ data: createdProduct });
    });

    it('WHEN called with invalid data THEN should handle validation error', () => {
      const invalidProduct: Omit<Product, 'id'> = {
        name: '',
        price: -10,
        category: 'electronics',
        inStock: true
      };

      service.createProduct(invalidProduct).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('Validation failed');
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        { message: 'Validation failed' }, 
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('GIVEN updateProduct method', () => {
    it('WHEN called with valid data THEN should update product', () => {
      const productId = '1';
      const updateData: Partial<Product> = { price: 899.99, inStock: false };
      const updatedProduct: Product = { ...mockProducts[0], ...updateData };

      service.updateProduct(productId, updateData).subscribe(product => {
        expect(product).toEqual(updatedProduct);
      });

      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush({ data: updatedProduct });
    });
  });

  describe('GIVEN deleteProduct method', () => {
    it('WHEN called with valid ID THEN should delete product', () => {
      const productId = '1';

      service.deleteProduct(productId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/${productId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('GIVEN multiple simultaneous requests', () => {
    it('WHEN called concurrently THEN should handle all requests', () => {
      const results: Product[][] = [];

      // Make multiple concurrent requests
      service.getProducts().subscribe(products => results.push(products));
      service.getProducts({ category: 'electronics' }).subscribe(products => results.push(products));

      // Verify both requests were made
      const requests = httpMock.match(req => req.url.includes(baseUrl));
      expect(requests.length).toBe(2);

      // Respond to both
      requests[0].flush({ data: mockProducts });
      requests[1].flush({ data: [mockProducts[0]] });

      expect(results.length).toBe(2);
      expect(results[0]).toEqual(mockProducts);
      expect(results[1]).toEqual([mockProducts[0]]);
    });
  });
});
```

## Complex Dependency Mocking

### Mocking Nested Dependencies
```typescript
// services/order.service.ts
import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ProductService, Product } from './product.service';
import { AuthService, User } from './auth.service';
import { PaymentService } from './payment.service';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private paymentService: PaymentService
  ) {}

  createOrder(items: Omit<OrderItem, 'price'>[]): Observable<Order> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create order');
    }

    // Get product details for all items
    const productRequests = items.map(item => 
      this.productService.getProductById(item.productId)
    );

    return combineLatest(productRequests).pipe(
      map(products => {
        // Calculate order items with prices
        const orderItems: OrderItem[] = items.map((item, index) => ({
          ...item,
          price: products[index].price
        }));

        // Calculate total
        const total = orderItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );

        return { orderItems, total, user };
      }),
      switchMap(({ orderItems, total, user }) => 
        this.paymentService.processPayment(user.id, total).pipe(
          map(() => ({
            id: Date.now().toString(),
            userId: user.id,
            items: orderItems,
            total,
            status: 'confirmed' as const,
            createdAt: new Date().toISOString()
          }))
        )
      )
    );
  }

  getUserOrders(): Observable<Order[]> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      return new Observable(subscriber => subscriber.next([]));
    }

    // Implementation would fetch from API
    return new Observable();
  }
}
```

```typescript
// services/order.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrderService, OrderItem } from './order.service';
import { ProductService, Product } from './product.service';
import { AuthService, User } from './auth.service';
import { PaymentService } from './payment.service';

describe('GIVEN OrderService', () => {
  let service: OrderService;
  let mockProductService: jasmine.SpyObj<ProductService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockPaymentService: jasmine.SpyObj<PaymentService>;

  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user']
  };

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Laptop',
      price: 999.99,
      category: 'electronics',
      inStock: true
    },
    {
      id: '2',
      name: 'Mouse',
      price: 29.99,
      category: 'electronics',
      inStock: true
    }
  ];

  beforeEach(() => {
    const productServiceSpy = jasmine.createSpyObj('ProductService', [
      'getProductById'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'getCurrentUser'
    ]);
    const paymentServiceSpy = jasmine.createSpyObj('PaymentService', [
      'processPayment'
    ]);

    TestBed.configureTestingModule({
      providers: [
        OrderService,
        { provide: ProductService, useValue: productServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: PaymentService, useValue: paymentServiceSpy }
      ]
    });

    service = TestBed.inject(OrderService);
    mockProductService = TestBed.inject(ProductService) as jasmine.SpyObj<ProductService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockPaymentService = TestBed.inject(PaymentService) as jasmine.SpyObj<PaymentService>;
  });

  describe('GIVEN createOrder method', () => {
    it('WHEN user is authenticated and has valid items THEN should create order', () => {
      const orderItems: Omit<OrderItem, 'price'>[] = [
        { productId: '1', quantity: 1 },
        { productId: '2', quantity: 2 }
      ];

      // Setup mocks
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProductService.getProductById.and.callFake(id => {
        const product = mockProducts.find(p => p.id === id);
        return of(product!);
      });
      mockPaymentService.processPayment.and.returnValue(of({ success: true }));

      service.createOrder(orderItems).subscribe(order => {
        expect(order.userId).toBe(mockUser.id);
        expect(order.items.length).toBe(2);
        expect(order.items[0]).toEqual({
          productId: '1',
          quantity: 1,
          price: 999.99
        });
        expect(order.items[1]).toEqual({
          productId: '2',
          quantity: 2,
          price: 29.99
        });
        expect(order.total).toBe(1059.97); // 999.99 + (29.99 * 2)
        expect(order.status).toBe('confirmed');
      });

      expect(mockProductService.getProductById).toHaveBeenCalledTimes(2);
      expect(mockProductService.getProductById).toHaveBeenCalledWith('1');
      expect(mockProductService.getProductById).toHaveBeenCalledWith('2');
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith('1', 1059.97);
    });

    it('WHEN user is not authenticated THEN should throw error', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);

      expect(() => {
        service.createOrder([{ productId: '1', quantity: 1 }]);
      }).toThrowError('User must be authenticated to create order');
    });

    it('WHEN product fetch fails THEN should propagate error', () => {
      const orderItems: Omit<OrderItem, 'price'>[] = [
        { productId: 'invalid', quantity: 1 }
      ];

      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProductService.getProductById.and.returnValue(
        throwError(() => new Error('Product not found'))
      );

      service.createOrder(orderItems).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toBe('Product not found');
        }
      });
    });

    it('WHEN payment fails THEN should propagate error', () => {
      const orderItems: Omit<OrderItem, 'price'>[] = [
        { productId: '1', quantity: 1 }
      ];

      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockProductService.getProductById.and.returnValue(of(mockProducts[0]));
      mockPaymentService.processPayment.and.returnValue(
        throwError(() => new Error('Payment failed'))
      );

      service.createOrder(orderItems).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toBe('Payment failed');
        }
      });
    });
  });

  describe('GIVEN getUserOrders method', () => {
    it('WHEN user is authenticated THEN should return orders', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);

      service.getUserOrders().subscribe(orders => {
        // Implementation would test actual orders
        expect(orders).toBeDefined();
      });
    });

    it('WHEN user is not authenticated THEN should return empty array', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);

      service.getUserOrders().subscribe(orders => {
        expect(orders).toEqual([]);
      });
    });
  });
});
```

## MockProvider for Simplified Mocking

### Using ng-mocks for Advanced Mocking
```typescript
// npm install ng-mocks
import { MockProvider } from 'ng-mocks';

describe('GIVEN OrderService with MockProvider', () => {
  let service: OrderService;
  let productService: ProductService;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrderService,
        MockProvider(ProductService, {
          getProductById: () => of(mockProducts[0])
        }),
        MockProvider(AuthService, {
          getCurrentUser: () => mockUser
        }),
        MockProvider(PaymentService, {
          processPayment: () => of({ success: true })
        })
      ]
    });

    service = TestBed.inject(OrderService);
    productService = TestBed.inject(ProductService);
    authService = TestBed.inject(AuthService);
  });

  it('WHEN creating order THEN should use mocked services', () => {
    const orderItems: Omit<OrderItem, 'price'>[] = [
      { productId: '1', quantity: 1 }
    ];

    service.createOrder(orderItems).subscribe(order => {
      expect(order.userId).toBe(mockUser.id);
      expect(order.total).toBe(999.99);
    });
  });
});
```

## Testing with Observables and Async Operations

### Mocking Complex Observable Chains
```typescript
// services/data-sync.service.ts
import { Injectable } from '@angular/core';
import { Observable, timer, merge } from 'rxjs';
import { switchMap, retry, shareReplay, filter } from 'rxjs/operators';
import { WebSocketService } from './websocket.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class DataSyncService {
  constructor(
    private websocket: WebSocketService,
    private api: ApiService
  ) {}

  syncData(): Observable<any> {
    // Combine real-time updates with periodic polling
    const realTimeUpdates = this.websocket.connect().pipe(
      filter(message => message.type === 'data-update')
    );

    const periodicSync = timer(0, 30000).pipe(
      switchMap(() => this.api.getData()),
      retry(3)
    );

    return merge(realTimeUpdates, periodicSync).pipe(
      shareReplay(1)
    );
  }
}
```

```typescript
// services/data-sync.service.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { DataSyncService } from './data-sync.service';
import { WebSocketService } from './websocket.service';
import { ApiService } from './api.service';

describe('GIVEN DataSyncService', () => {
  let service: DataSyncService;
  let mockWebSocket: jasmine.SpyObj<WebSocketService>;
  let mockApi: jasmine.SpyObj<ApiService>;
  let websocketSubject: Subject<any>;

  beforeEach(() => {
    websocketSubject = new Subject();
    
    const websocketSpy = jasmine.createSpyObj('WebSocketService', ['connect']);
    const apiSpy = jasmine.createSpyObj('ApiService', ['getData']);

    TestBed.configureTestingModule({
      providers: [
        DataSyncService,
        { provide: WebSocketService, useValue: websocketSpy },
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(DataSyncService);
    mockWebSocket = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
    mockApi = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    mockWebSocket.connect.and.returnValue(websocketSubject.asObservable());
    mockApi.getData.and.returnValue(of({ data: 'test' }));
  });

  it('WHEN websocket emits data update THEN should emit value', fakeAsync(() => {
    let lastValue: any;
    
    service.syncData().subscribe(value => {
      lastValue = value;
    });

    // Simulate websocket message
    websocketSubject.next({ type: 'data-update', data: 'websocket-data' });
    tick();

    expect(lastValue).toEqual({ type: 'data-update', data: 'websocket-data' });
  }));

  it('WHEN timer triggers THEN should call API', fakeAsync(() => {
    service.syncData().subscribe();
    
    // Initial call
    expect(mockApi.getData).toHaveBeenCalledTimes(1);
    
    // After 30 seconds
    tick(30000);
    expect(mockApi.getData).toHaveBeenCalledTimes(2);
    
    // After another 30 seconds
    tick(30000);
    expect(mockApi.getData).toHaveBeenCalledTimes(3);
  }));

  it('WHEN filtering websocket messages THEN should only emit data-update types', fakeAsync(() => {
    const emittedValues: any[] = [];
    
    service.syncData().subscribe(value => {
      emittedValues.push(value);
    });

    websocketSubject.next({ type: 'other-type', data: 'should-be-filtered' });
    websocketSubject.next({ type: 'data-update', data: 'should-pass' });
    tick();

    expect(emittedValues.some(v => v.type === 'other-type')).toBe(false);
    expect(emittedValues.some(v => v.type === 'data-update')).toBe(true);
  }));
});
```

## Global Mock Configuration

### Setting up Test Environment with Global Mocks
```typescript
// test-setup.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Global test configuration
export function configureTestBed(config: any = {}) {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        ...(config.imports || [])
      ],
      declarations: config.declarations || [],
      providers: [
        // Global mock providers
        ...getGlobalMockProviders(),
        ...(config.providers || [])
      ]
    }).compileComponents();
  });
}

function getGlobalMockProviders() {
  return [
    {
      provide: 'GLOBAL_CONFIG',
      useValue: { apiUrl: 'http://localhost:3000/api' }
    },
    // Add other global mocks here
  ];
}

// Mock implementations for commonly used services
export const createMockLocalStorage = () => {
  let store: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

// Usage in tests
describe('GIVEN Component with global setup', () => {
  configureTestBed({
    declarations: [MyComponent],
    providers: [
      { provide: Storage, useValue: createMockLocalStorage() }
    ]
  });

  // Tests here will have the global configuration
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Service Testing](./service-testing.md)
- [Integration Testing](./integration.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)
