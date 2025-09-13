# Integration Testing Patterns

This guide covers comprehensive integration testing patterns that apply across all JavaScript/TypeScript frameworks. Integration tests verify that multiple components, services, or modules work together correctly.

## Integration Testing Principles

### Component Integration Testing
```javascript
// Example: Testing form submission workflow
describe('GIVEN UserRegistrationFlow integration', () => {
  let mockApiService;
  let mockNotificationService;
  let mockValidationService;

  beforeEach(() => {
    mockApiService = {
      createUser: vi.fn(),
      checkEmailExists: vi.fn()
    };
    
    mockNotificationService = {
      showSuccess: vi.fn(),
      showError: vi.fn()
    };
    
    mockValidationService = {
      validateForm: vi.fn()
    };
  });

  describe('WHEN user submits valid registration form', () => {
    it('THEN should complete full registration workflow', async () => {
      // Arrange
      const formData = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Test User'
      };

      mockValidationService.validateForm.mockReturnValue({ isValid: true, errors: {} });
      mockApiService.checkEmailExists.mockResolvedValue(false);
      mockApiService.createUser.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User'
      });

      // Act
      const registrationFlow = new UserRegistrationFlow(
        mockApiService,
        mockNotificationService,
        mockValidationService
      );
      
      const result = await registrationFlow.register(formData);

      // Assert
      expect(mockValidationService.validateForm).toHaveBeenCalledWith(formData);
      expect(mockApiService.checkEmailExists).toHaveBeenCalledWith('test@example.com');
      expect(mockApiService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      expect(mockNotificationService.showSuccess).toHaveBeenCalledWith(
        'Registration successful! Welcome, Test User!'
      );
      expect(result.success).toBe(true);
    });

    it('THEN should handle email already exists scenario', async () => {
      const formData = {
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'Test User'
      };

      mockValidationService.validateForm.mockReturnValue({ isValid: true, errors: {} });
      mockApiService.checkEmailExists.mockResolvedValue(true);

      const registrationFlow = new UserRegistrationFlow(
        mockApiService,
        mockNotificationService,
        mockValidationService
      );
      
      const result = await registrationFlow.register(formData);

      expect(mockApiService.createUser).not.toHaveBeenCalled();
      expect(mockNotificationService.showError).toHaveBeenCalledWith(
        'Email already exists. Please use a different email.'
      );
      expect(result.success).toBe(false);
    });
  });
});
```

### Service Layer Integration
```javascript
// Example: Testing service dependencies
describe('GIVEN OrderService integration', () => {
  let orderService;
  let mockPaymentService;
  let mockInventoryService;
  let mockEmailService;
  let mockDatabase;

  beforeEach(() => {
    mockPaymentService = {
      processPayment: vi.fn(),
      refundPayment: vi.fn()
    };
    
    mockInventoryService = {
      reserveItems: vi.fn(),
      releaseItems: vi.fn(),
      checkAvailability: vi.fn()
    };
    
    mockEmailService = {
      sendOrderConfirmation: vi.fn(),
      sendOrderFailure: vi.fn()
    };
    
    mockDatabase = {
      createOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
      getOrder: vi.fn()
    };

    orderService = new OrderService(
      mockPaymentService,
      mockInventoryService,
      mockEmailService,
      mockDatabase
    );
  });

  describe('WHEN processing a complete order', () => {
    const orderData = {
      items: [
        { productId: '1', quantity: 2, price: 25.00 },
        { productId: '2', quantity: 1, price: 15.00 }
      ],
      customer: {
        id: 'customer-1',
        email: 'customer@example.com',
        name: 'John Doe'
      },
      payment: {
        method: 'credit_card',
        token: 'payment-token-123'
      }
    };

    it('THEN should complete successful order workflow', async () => {
      // Setup mocks for successful flow
      mockInventoryService.checkAvailability.mockResolvedValue(true);
      mockInventoryService.reserveItems.mockResolvedValue(['res-1', 'res-2']);
      mockDatabase.createOrder.mockResolvedValue({ id: 'order-123', status: 'pending' });
      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        transactionId: 'txn-456'
      });
      mockDatabase.updateOrderStatus.mockResolvedValue(true);
      mockEmailService.sendOrderConfirmation.mockResolvedValue(true);

      const result = await orderService.processOrder(orderData);

      // Verify the complete workflow
      expect(mockInventoryService.checkAvailability).toHaveBeenCalledWith(orderData.items);
      expect(mockInventoryService.reserveItems).toHaveBeenCalledWith(orderData.items);
      expect(mockDatabase.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          items: orderData.items,
          customer: orderData.customer,
          status: 'pending',
          total: 65.00
        })
      );
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith({
        amount: 65.00,
        method: 'credit_card',
        token: 'payment-token-123'
      });
      expect(mockDatabase.updateOrderStatus).toHaveBeenCalledWith('order-123', 'completed');
      expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
        'customer@example.com',
        expect.objectContaining({ orderId: 'order-123' })
      );

      expect(result).toEqual({
        success: true,
        orderId: 'order-123',
        transactionId: 'txn-456'
      });
    });

    it('THEN should handle payment failure and rollback', async () => {
      // Setup mocks for payment failure
      mockInventoryService.checkAvailability.mockResolvedValue(true);
      mockInventoryService.reserveItems.mockResolvedValue(['res-1', 'res-2']);
      mockDatabase.createOrder.mockResolvedValue({ id: 'order-123', status: 'pending' });
      mockPaymentService.processPayment.mockResolvedValue({
        success: false,
        error: 'Insufficient funds'
      });

      const result = await orderService.processOrder(orderData);

      // Verify rollback actions
      expect(mockInventoryService.releaseItems).toHaveBeenCalledWith(['res-1', 'res-2']);
      expect(mockDatabase.updateOrderStatus).toHaveBeenCalledWith('order-123', 'failed');
      expect(mockEmailService.sendOrderFailure).toHaveBeenCalledWith(
        'customer@example.com',
        expect.objectContaining({
          orderId: 'order-123',
          reason: 'Payment failed: Insufficient funds'
        })
      );

      expect(result).toEqual({
        success: false,
        error: 'Payment failed: Insufficient funds',
        orderId: 'order-123'
      });
    });

    it('THEN should handle inventory unavailability', async () => {
      mockInventoryService.checkAvailability.mockResolvedValue(false);

      const result = await orderService.processOrder(orderData);

      // Should not proceed with order creation
      expect(mockDatabase.createOrder).not.toHaveBeenCalled();
      expect(mockPaymentService.processPayment).not.toHaveBeenCalled();
      
      expect(result).toEqual({
        success: false,
        error: 'Some items are not available'
      });
    });
  });
});
```

## API Integration Testing

### REST API Integration
```javascript
// Example: Testing API client integration
describe('GIVEN UserApiClient integration', () => {
  let apiClient;
  let mockHttpClient;
  let mockAuthService;
  let mockCacheService;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    mockAuthService = {
      getAuthToken: vi.fn(),
      refreshToken: vi.fn(),
      isTokenExpired: vi.fn()
    };
    
    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };

    apiClient = new UserApiClient(mockHttpClient, mockAuthService, mockCacheService);
  });

  describe('WHEN fetching user with authentication and caching', () => {
    it('THEN should handle complete authenticated request flow', async () => {
      const userId = 'user-123';
      const mockUser = { id: userId, name: 'John Doe', email: 'john@example.com' };
      const authToken = 'valid-token-123';

      // Setup mocks
      mockCacheService.get.mockResolvedValue(null); // Not in cache
      mockAuthService.isTokenExpired.mockReturnValue(false);
      mockAuthService.getAuthToken.mockReturnValue(authToken);
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: mockUser
      });

      const result = await apiClient.getUser(userId);

      // Verify complete flow
      expect(mockCacheService.get).toHaveBeenCalledWith(`user:${userId}`);
      expect(mockAuthService.isTokenExpired).toHaveBeenCalled();
      expect(mockAuthService.getAuthToken).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(`user:${userId}`, mockUser, 300);

      expect(result).toEqual(mockUser);
    });

    it('THEN should refresh token when expired', async () => {
      const userId = 'user-123';
      const mockUser = { id: userId, name: 'John Doe' };
      const expiredToken = 'expired-token';
      const newToken = 'refreshed-token';

      mockCacheService.get.mockResolvedValue(null);
      mockAuthService.isTokenExpired.mockReturnValue(true);
      mockAuthService.getAuthToken.mockReturnValueOnce(expiredToken);
      mockAuthService.refreshToken.mockResolvedValue(newToken);
      mockAuthService.getAuthToken.mockReturnValueOnce(newToken);
      mockHttpClient.get.mockResolvedValue({ status: 200, data: mockUser });

      const result = await apiClient.getUser(userId);

      expect(mockAuthService.refreshToken).toHaveBeenCalled();
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });
    });

    it('THEN should return cached user when available', async () => {
      const userId = 'user-123';
      const cachedUser = { id: userId, name: 'Cached User' };

      mockCacheService.get.mockResolvedValue(cachedUser);

      const result = await apiClient.getUser(userId);

      expect(result).toEqual(cachedUser);
      expect(mockHttpClient.get).not.toHaveBeenCalled();
      expect(mockAuthService.getAuthToken).not.toHaveBeenCalled();
    });
  });
});
```

### GraphQL Integration Testing
```javascript
// Example: Testing GraphQL client integration
describe('GIVEN GraphQLClient integration', () => {
  let graphqlClient;
  let mockTransport;
  let mockCacheManager;
  let mockErrorHandler;

  beforeEach(() => {
    mockTransport = {
      request: vi.fn()
    };
    
    mockCacheManager = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn()
    };
    
    mockErrorHandler = {
      handleGraphQLErrors: vi.fn(),
      handleNetworkError: vi.fn()
    };

    graphqlClient = new GraphQLClient(mockTransport, mockCacheManager, mockErrorHandler);
  });

  describe('WHEN executing queries with caching', () => {
    const GET_USER_QUERY = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
          posts {
            id
            title
            publishedAt
          }
        }
      }
    `;

    it('THEN should handle successful query with cache miss', async () => {
      const variables = { id: 'user-1' };
      const mockResponse = {
        data: {
          user: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            posts: [
              { id: 'post-1', title: 'First Post', publishedAt: '2023-01-01' }
            ]
          }
        }
      };

      mockCacheManager.get.mockReturnValue(null);
      mockTransport.request.mockResolvedValue(mockResponse);

      const result = await graphqlClient.query(GET_USER_QUERY, variables);

      expect(mockCacheManager.get).toHaveBeenCalledWith(
        expect.stringContaining('GetUser')
      );
      expect(mockTransport.request).toHaveBeenCalledWith({
        query: GET_USER_QUERY,
        variables
      });
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('GetUser'),
        mockResponse.data,
        expect.any(Number)
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('THEN should handle GraphQL errors', async () => {
      const variables = { id: 'invalid-user' };
      const errorResponse = {
        errors: [
          {
            message: 'User not found',
            path: ['user'],
            extensions: { code: 'USER_NOT_FOUND' }
          }
        ],
        data: null
      };

      mockCacheManager.get.mockReturnValue(null);
      mockTransport.request.mockResolvedValue(errorResponse);
      mockErrorHandler.handleGraphQLErrors.mockReturnValue(
        new Error('User not found')
      );

      await expect(graphqlClient.query(GET_USER_QUERY, variables))
        .rejects.toThrow('User not found');

      expect(mockErrorHandler.handleGraphQLErrors).toHaveBeenCalledWith(
        errorResponse.errors
      );
    });
  });

  describe('WHEN executing mutations with cache invalidation', () => {
    const CREATE_POST_MUTATION = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          id
          title
          content
          author {
            id
            name
          }
        }
      }
    `;

    it('THEN should invalidate related cache entries', async () => {
      const variables = {
        input: {
          title: 'New Post',
          content: 'Post content',
          authorId: 'user-1'
        }
      };
      
      const mockResponse = {
        data: {
          createPost: {
            id: 'post-2',
            title: 'New Post',
            content: 'Post content',
            author: { id: 'user-1', name: 'John Doe' }
          }
        }
      };

      mockTransport.request.mockResolvedValue(mockResponse);

      const result = await graphqlClient.mutate(CREATE_POST_MUTATION, variables);

      expect(mockTransport.request).toHaveBeenCalledWith({
        query: CREATE_POST_MUTATION,
        variables
      });
      
      // Should invalidate user queries since user's posts changed
      expect(mockCacheManager.invalidate).toHaveBeenCalledWith(
        expect.stringMatching(/GetUser.*user-1/)
      );

      expect(result).toEqual(mockResponse.data);
    });
  });
});
```

## Database Integration Testing

### Repository Pattern Integration
```javascript
// Example: Testing repository with database
describe('GIVEN UserRepository integration', () => {
  let userRepository;
  let mockDatabase;
  let mockQueryBuilder;
  let mockTransaction;

  beforeEach(() => {
    mockTransaction = {
      commit: vi.fn(),
      rollback: vi.fn(),
      query: vi.fn()
    };
    
    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      join: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      execute: vi.fn()
    };
    
    mockDatabase = {
      query: vi.fn(),
      transaction: vi.fn().mockReturnValue(mockTransaction),
      createQueryBuilder: vi.fn().mockReturnValue(mockQueryBuilder)
    };

    userRepository = new UserRepository(mockDatabase);
  });

  describe('WHEN creating user with profile in transaction', () => {
    it('THEN should create user and profile atomically', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        profile: {
          bio: 'Test bio',
          location: 'Test City'
        }
      };

      const mockUserId = 'user-123';
      mockTransaction.query
        .mockResolvedValueOnce({ insertId: mockUserId }) // User insert
        .mockResolvedValueOnce({ insertId: 'profile-456' }); // Profile insert

      const result = await userRepository.createUserWithProfile(userData);

      expect(mockDatabase.transaction).toHaveBeenCalled();
      expect(mockTransaction.query).toHaveBeenCalledWith(
        'INSERT INTO users (email, name) VALUES (?, ?)',
        [userData.email, userData.name]
      );
      expect(mockTransaction.query).toHaveBeenCalledWith(
        'INSERT INTO user_profiles (user_id, bio, location) VALUES (?, ?, ?)',
        [mockUserId, userData.profile.bio, userData.profile.location]
      );
      expect(mockTransaction.commit).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockUserId,
        email: userData.email,
        name: userData.name,
        profile: {
          id: 'profile-456',
          bio: userData.profile.bio,
          location: userData.profile.location
        }
      });
    });

    it('THEN should rollback transaction on failure', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        profile: { bio: 'Test bio' }
      };

      mockTransaction.query
        .mockResolvedValueOnce({ insertId: 'user-123' })
        .mockRejectedValueOnce(new Error('Profile creation failed'));

      await expect(userRepository.createUserWithProfile(userData))
        .rejects.toThrow('Profile creation failed');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });

  describe('WHEN searching users with complex queries', () => {
    it('THEN should build and execute complex query', async () => {
      const searchCriteria = {
        namePattern: 'John',
        location: 'New York',
        minAge: 25,
        hasProfilePicture: true,
        orderBy: 'created_at',
        order: 'DESC',
        limit: 10,
        offset: 20
      };

      const mockResults = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'John Smith', email: 'smith@example.com' }
      ];

      mockQueryBuilder.execute.mockResolvedValue(mockResults);

      const result = await userRepository.searchUsers(searchCriteria);

      // Verify query builder chain
      expect(mockQueryBuilder.select).toHaveBeenCalledWith([
        'u.id',
        'u.name',
        'u.email',
        'u.created_at',
        'p.bio',
        'p.location'
      ]);
      expect(mockQueryBuilder.from).toHaveBeenCalledWith('users u');
      expect(mockQueryBuilder.join).toHaveBeenCalledWith(
        'user_profiles p',
        'u.id = p.user_id'
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('u.name LIKE ?', ['%John%']);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('p.location = ?', ['New York']);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'DATEDIFF(CURDATE(), u.birth_date) / 365 >= ?',
        [25]
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('p.profile_picture IS NOT NULL');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('u.created_at DESC');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(20);

      expect(result).toEqual(mockResults);
    });
  });
});
```

## Event-Driven Integration Testing

### Event Bus Integration
```javascript
// Example: Testing event-driven architecture
describe('GIVEN EventDrivenUserService integration', () => {
  let userService;
  let mockEventBus;
  let mockUserRepository;
  let mockEmailService;
  let mockAuditService;

  beforeEach(() => {
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
    
    mockUserRepository = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn()
    };
    
    mockEmailService = {
      sendWelcomeEmail: vi.fn(),
      sendGoodbyeEmail: vi.fn()
    };
    
    mockAuditService = {
      logUserAction: vi.fn()
    };

    userService = new EventDrivenUserService(
      mockUserRepository,
      mockEventBus
    );

    // Setup event listeners
    userService.setupEventListeners();
  });

  describe('WHEN user is created', () => {
    it('THEN should emit events and trigger side effects', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const createdUser = {
        id: 'user-123',
        ...userData,
        createdAt: new Date()
      };

      mockUserRepository.create.mockResolvedValue(createdUser);

      // Setup event listeners for this test
      mockEventBus.on.mockImplementation((event, handler) => {
        if (event === 'user.created') {
          // Simulate event handling
          setTimeout(() => handler(createdUser), 0);
        }
      });

      const result = await userService.createUser(userData);

      // Verify user creation
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(createdUser);

      // Verify event emission
      expect(mockEventBus.emit).toHaveBeenCalledWith('user.created', createdUser);

      // Wait for async event handlers
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify event listeners were registered
      expect(mockEventBus.on).toHaveBeenCalledWith(
        'user.created',
        expect.any(Function)
      );
    });
  });

  describe('WHEN testing complete event flow', () => {
    it('THEN should handle all events in user lifecycle', async () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const createdUser = { id: 'user-123', ...userData };
      const updatedUser = { ...createdUser, name: 'Updated User' };

      // Mock all repository operations
      mockUserRepository.create.mockResolvedValue(createdUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);
      mockUserRepository.delete.mockResolvedValue(true);

      // Create event handler registry
      const eventHandlers = new Map();
      mockEventBus.on.mockImplementation((event, handler) => {
        eventHandlers.set(event, handler);
      });
      
      mockEventBus.emit.mockImplementation((event, data) => {
        const handler = eventHandlers.get(event);
        if (handler) {
          setTimeout(() => handler(data), 0);
        }
      });

      // Register additional services as event listeners
      const emailService = new EmailEventHandler(mockEmailService);
      const auditService = new AuditEventHandler(mockAuditService);
      
      emailService.register(mockEventBus);
      auditService.register(mockEventBus);

      // Execute user lifecycle
      await userService.createUser(userData);
      await userService.updateUser('user-123', { name: 'Updated User' });
      await userService.deleteUser('user-123');

      // Wait for all async events
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all events were emitted
      expect(mockEventBus.emit).toHaveBeenCalledWith('user.created', createdUser);
      expect(mockEventBus.emit).toHaveBeenCalledWith('user.updated', updatedUser);
      expect(mockEventBus.emit).toHaveBeenCalledWith('user.deleted', 
        expect.objectContaining({ id: 'user-123' })
      );

      // Verify side effects
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(createdUser);
      expect(mockEmailService.sendGoodbyeEmail).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-123' })
      );
      expect(mockAuditService.logUserAction).toHaveBeenCalledTimes(3);
    });
  });
});
```

## Microservices Integration Testing

### Service Communication Testing
```javascript
// Example: Testing microservice interactions
describe('GIVEN OrderOrchestrator integration', () => {
  let orderOrchestrator;
  let mockUserService;
  let mockInventoryService;
  let mockPaymentService;
  let mockShippingService;
  let mockNotificationService;

  beforeEach(() => {
    mockUserService = {
      getUser: vi.fn(),
      updateUserStats: vi.fn()
    };
    
    mockInventoryService = {
      checkStock: vi.fn(),
      reserveItems: vi.fn(),
      confirmReservation: vi.fn(),
      cancelReservation: vi.fn()
    };
    
    mockPaymentService = {
      authorizePayment: vi.fn(),
      capturePayment: vi.fn(),
      refundPayment: vi.fn()
    };
    
    mockShippingService = {
      calculateShipping: vi.fn(),
      createShipment: vi.fn(),
      schedulePickup: vi.fn()
    };
    
    mockNotificationService = {
      sendOrderConfirmation: vi.fn(),
      sendShippingNotification: vi.fn(),
      sendErrorNotification: vi.fn()
    };

    orderOrchestrator = new OrderOrchestrator({
      userService: mockUserService,
      inventoryService: mockInventoryService,
      paymentService: mockPaymentService,
      shippingService: mockShippingService,
      notificationService: mockNotificationService
    });
  });

  describe('WHEN processing distributed order', () => {
    const orderRequest = {
      userId: 'user-123',
      items: [
        { productId: 'prod-1', quantity: 2, price: 25.00 },
        { productId: 'prod-2', quantity: 1, price: 15.00 }
      ],
      shippingAddress: {
        street: '123 Main St',
        city: 'Anytown',
        zipCode: '12345'
      },
      paymentMethod: {
        type: 'credit_card',
        token: 'pay-token-456'
      }
    };

    it('THEN should coordinate all services successfully', async () => {
      // Setup successful responses from all services
      mockUserService.getUser.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe'
      });
      
      mockInventoryService.checkStock.mockResolvedValue({
        available: true,
        details: [
          { productId: 'prod-1', available: 10 },
          { productId: 'prod-2', available: 5 }
        ]
      });
      
      mockInventoryService.reserveItems.mockResolvedValue({
        reservationId: 'res-789',
        expiresAt: new Date(Date.now() + 900000) // 15 minutes
      });
      
      mockShippingService.calculateShipping.mockResolvedValue({
        cost: 9.99,
        estimatedDays: 3
      });
      
      mockPaymentService.authorizePayment.mockResolvedValue({
        authorizationId: 'auth-321',
        amount: 74.99 // 65.00 + 9.99 shipping
      });
      
      mockPaymentService.capturePayment.mockResolvedValue({
        transactionId: 'txn-654',
        status: 'completed'
      });
      
      mockShippingService.createShipment.mockResolvedValue({
        shipmentId: 'ship-987',
        trackingNumber: 'TRK123456789'
      });

      const result = await orderOrchestrator.processOrder(orderRequest);

      // Verify service orchestration
      expect(mockUserService.getUser).toHaveBeenCalledWith('user-123');
      expect(mockInventoryService.checkStock).toHaveBeenCalledWith(orderRequest.items);
      expect(mockInventoryService.reserveItems).toHaveBeenCalledWith(orderRequest.items);
      expect(mockShippingService.calculateShipping).toHaveBeenCalledWith(
        orderRequest.items,
        orderRequest.shippingAddress
      );
      expect(mockPaymentService.authorizePayment).toHaveBeenCalledWith({
        amount: 74.99,
        method: orderRequest.paymentMethod
      });
      expect(mockPaymentService.capturePayment).toHaveBeenCalledWith('auth-321');
      expect(mockInventoryService.confirmReservation).toHaveBeenCalledWith('res-789');
      expect(mockShippingService.createShipment).toHaveBeenCalledWith(
        expect.objectContaining({
          items: orderRequest.items,
          address: orderRequest.shippingAddress
        })
      );
      expect(mockNotificationService.sendOrderConfirmation).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          orderId: expect.any(String),
          trackingNumber: 'TRK123456789'
        })
      );

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(result.trackingNumber).toBe('TRK123456789');
    });

    it('THEN should handle service failures with compensation', async () => {
      // Setup failure scenario
      mockUserService.getUser.mockResolvedValue({
        id: 'user-123',
        email: 'user@example.com'
      });
      mockInventoryService.checkStock.mockResolvedValue({ available: true });
      mockInventoryService.reserveItems.mockResolvedValue({
        reservationId: 'res-789'
      });
      mockShippingService.calculateShipping.mockResolvedValue({
        cost: 9.99
      });
      mockPaymentService.authorizePayment.mockResolvedValue({
        authorizationId: 'auth-321'
      });
      
      // Payment capture fails
      mockPaymentService.capturePayment.mockRejectedValue(
        new Error('Payment processing failed')
      );

      const result = await orderOrchestrator.processOrder(orderRequest);

      // Verify compensation actions
      expect(mockInventoryService.cancelReservation).toHaveBeenCalledWith('res-789');
      expect(mockNotificationService.sendErrorNotification).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          error: 'Payment processing failed'
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment processing failed');
    });

    it('THEN should handle timeout scenarios', async () => {
      // Setup timeout scenario
      mockUserService.getUser.mockResolvedValue({ id: 'user-123', email: 'user@example.com' });
      mockInventoryService.checkStock.mockResolvedValue({ available: true });
      mockInventoryService.reserveItems.mockResolvedValue({ reservationId: 'res-789' });
      
      // Shipping service times out
      mockShippingService.calculateShipping.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 10000))
      );

      // Set orchestrator timeout to 1 second
      orderOrchestrator.setTimeout(1000);

      const result = await orderOrchestrator.processOrder(orderRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(mockInventoryService.cancelReservation).toHaveBeenCalledWith('res-789');
    });
  });
});
```

## Real Environment Integration Testing

### Database Integration with Test Containers
```javascript
// Example: Using test containers for real database testing
describe('GIVEN UserService with real database', () => {
  let userService;
  let database;
  let testContainer;

  beforeAll(async () => {
    // Start test database container
    testContainer = await new PostgreSQLContainer('postgres:13')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    // Setup database connection
    database = new DatabaseConnection({
      host: testContainer.getHost(),
      port: testContainer.getMappedPort(5432),
      database: 'test_db',
      username: 'test_user',
      password: 'test_password'
    });

    await database.connect();
    await database.migrate(); // Run migrations

    userService = new UserService(database);
  });

  afterAll(async () => {
    await database.disconnect();
    await testContainer.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await database.query('TRUNCATE TABLE users, user_profiles CASCADE');
  });

  describe('WHEN testing with real database', () => {
    it('THEN should persist and retrieve user data correctly', async () => {
      const userData = {
        email: 'integration@test.com',
        name: 'Integration Test User',
        age: 30
      };

      // Create user
      const createdUser = await userService.createUser(userData);
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(userData.email);

      // Retrieve user
      const retrievedUser = await userService.getUser(createdUser.id);
      expect(retrievedUser).toEqual(createdUser);

      // Update user
      const updatedData = { name: 'Updated Name' };
      const updatedUser = await userService.updateUser(createdUser.id, updatedData);
      expect(updatedUser.name).toBe('Updated Name');

      // Verify persistence
      const finalUser = await userService.getUser(createdUser.id);
      expect(finalUser.name).toBe('Updated Name');
    });

    it('THEN should handle database constraints', async () => {
      const userData = {
        email: 'duplicate@test.com',
        name: 'First User'
      };

      await userService.createUser(userData);

      // Try to create user with same email
      await expect(userService.createUser(userData))
        .rejects.toThrow(/duplicate.*email/i);
    });

    it('THEN should handle transactions correctly', async () => {
      const userData = {
        email: 'transaction@test.com',
        name: 'Transaction User'
      };

      // Simulate transaction failure
      const invalidProfileData = { bio: 'x'.repeat(1000) }; // Assuming bio has max length

      await expect(
        userService.createUserWithProfile(userData, invalidProfileData)
      ).rejects.toThrow();

      // Verify no user was created due to transaction rollback
      const users = await userService.searchUsers({ email: userData.email });
      expect(users).toHaveLength(0);
    });
  });
});
```

## Related Resources
- [Unit Testing Patterns](./unit-testing.md)
- [E2E Testing Patterns](./e2e-testing.md)
- [Performance Testing Patterns](./performance-testing.md)
- [Best Practices](../common/best-practices.md)
- [Testing Principles](../common/testing-principles.md)