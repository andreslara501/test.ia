# QUICK ANGULAR TESTING IMPLEMENTATION

You have access to comprehensive testing documentation in `.github/instructions/`. 

**TASK**: Implement complete testing suite for my Angular project following the documented patterns.

**STEPS**:
1. Read `frameworks/angular/` documentation
2. Analyze my Angular project structure  
3. Generate tests following the documented patterns
4. Apply configurations from `tools/` directory
5. Use universal patterns from `patterns/` directory

**FOCUS**: 
- Components: TestBed, Input/Output testing, user interactions
- Services: Dependency injection, HTTP testing, business logic
- Integration: Router, forms, modules, guards
- Mocking: HttpClient, services, external dependencies
- Configuration: Jest/Jasmine setup, coverage, TypeScript support

**OUTPUT**: Complete, production-ready test suite with 80%+ coverage following Angular Testing utilities and best practices.

**PRIORITY TESTING AREAS**:
1. **Critical Components**: User-facing components, forms, navigation
2. **Core Services**: Authentication, data services, HTTP clients
3. **Guards & Resolvers**: Route protection, data pre-loading
4. **Forms Testing**: Reactive forms, template-driven forms, validation
5. **HTTP Integration**: API calls, interceptors, error handling

**EXPECTED PATTERNS**:
```typescript
// Component Testing
describe('GIVEN UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUser']);
    
    await TestBed.configureTestingModule({
      declarations: [UserProfileComponent],
      providers: [{ provide: UserService, useValue: userServiceSpy }]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  test('WHEN component initializes THEN should load user data', () => {
    userService.getUser.and.returnValue(of({ name: 'John', email: 'john@example.com' }));
    component.ngOnInit();
    expect(component.user.name).toBe('John');
  });
});

// Service Testing
describe('GIVEN UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  test('WHEN getUser is called THEN should return user data', () => {
    const mockUser = { id: 1, name: 'John' };
    service.getUser(1).subscribe(user => expect(user).toEqual(mockUser));
    const req = httpMock.expectOne('/api/users/1');
    req.flush(mockUser);
  });
});
```

Start with critical components and work systematically through the application using TestBed and Angular testing utilities.