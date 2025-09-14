# Common Angular Testing Errors & Solutions

This document catalogs real-world errors encountered during Angular testing and their proven solutions.

## 🚨 Injection Context Errors

### Error: "NG0203: inject() must be called from an injection context"

**Root Cause**: Using Angular injection functions outside constructor or property initialization.

```typescript
// ❌ WRONG: Using toObservable() in method
@Injectable()
export class RoleGuard {
  canActivate(): Observable<boolean> {
    // This will fail - inject context error
    const currentUser$ = toObservable(this.authService.currentUser);
    return currentUser$.pipe(/* ... */);
  }
}

// ✅ SOLUTION 1: Move to constructor
@Injectable()
export class RoleGuard {
  private currentUser$: Observable<User | null>;
  
  constructor(private authService: AuthService) {
    this.currentUser$ = toObservable(this.authService.currentUser);
  }
  
  canActivate(): Observable<boolean> {
    return this.currentUser$.pipe(/* ... */);
  }
}

// ✅ SOLUTION 2: Property initialization
@Injectable()
export class RoleGuard {
  private currentUser$ = toObservable(this.authService.currentUser);
  
  canActivate(): Observable<boolean> {
    return this.currentUser$.pipe(/* ... */);
  }
}
```

## 🚨 DOM Element Access Errors

### Error: "Cannot read properties of null (reading 'nativeElement')"

**Root Cause**: Child components not included in test configuration.

```typescript
// ❌ WRONG: Missing child component dependencies
@Component({
  template: `
    <app-input formControlName="correo" data-testid="email-input"></app-input>
    <app-button data-testid="submit-btn">Submit</app-button>
  `
})
export class LoginComponent { }

// Test fails - child components not found
describe('LoginComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoginComponent] // ← Missing child components
    });
  });
  
  it('should click button', () => {
    const button = fixture.debugElement.query(By.css('[data-testid="submit-btn"]'));
    button.nativeElement.click(); // ← NULL REFERENCE ERROR
  });
});

// ✅ SOLUTION: Include ALL child components
describe('LoginComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        InputComponent,   // ← app-input
        ButtonComponent   // ← app-button
      ]
    });
  });
});
```

## 🚨 Field Name Mismatches

### Error: Form control name mismatches

**Root Cause**: Assuming English field names in Spanish applications.

```typescript
// ❌ WRONG: Assuming English field names
it('should validate email', () => {
  component.form.get('email')?.setValue('invalid'); // ← Field doesn't exist
  expect(component.form.get('password')?.valid).toBeFalsy(); // ← Wrong field name
});

// ✅ SOLUTION: Use actual field names from component
@Component({
  template: `
    <form [formGroup]="loginForm">
      <input formControlName="correo" />  <!-- ← correo, not email -->
      <input formControlName="clave" />   <!-- ← clave, not password -->
    </form>
  `
})
export class LoginComponent {
  loginForm = this.fb.group({
    correo: ['', [Validators.required, Validators.email]],
    clave: ['', [Validators.required, Validators.minLength(6)]]
  });
}

it('should validate correo', () => {
  component.loginForm.get('correo')?.setValue('invalid');
  expect(component.loginForm.get('clave')?.valid).toBeFalsy();
});
```

## 🚨 Service Method Missing Errors

### Error: "serviceSpy.methodName is not a function"

**Root Cause**: Service spy missing methods used by component.

```typescript
// ❌ WRONG: Incomplete service spy
const serviceSpy = jasmine.createSpyObj('UbicacionService', ['getAll']);

// Component also calls searchUbicaciones() method
class PropertiesComponent {
  ngOnInit() {
    this.ubicacionService.getAll().subscribe(/* ... */);
    this.ubicacionService.searchUbicaciones('query').subscribe(/* ... */); // ← NOT MOCKED
  }
}

// ✅ SOLUTION: Include ALL methods used by component
const serviceSpy = jasmine.createSpyObj('UbicacionService', [
  'getAll',
  'searchUbicaciones',  // ← Add this
  'getById',           // ← And any other methods
  'create',
  'update'
]);

// ✅ Configure return values with correct types
serviceSpy.searchUbicaciones.and.returnValue(of({
  ubicaciones: [],
  total: 0
} as SearchUbicacionResponse));
```

## 🚨 Template Structure Mismatches

### Error: Data-testid attributes not found

**Root Cause**: Tests expect data-testid attributes that don't exist in template.

```typescript
// ❌ WRONG: Assuming data-testid exists
it('should find email input', () => {
  const input = fixture.debugElement.query(By.css('[data-testid="email-input"]'));
  expect(input).toBeTruthy(); // ← FAILS - attribute doesn't exist
});

// Template doesn't have data-testid
@Component({
  template: `<input formControlName="correo" />`  // ← No data-testid
})

// ✅ SOLUTION 1: Add data-testid to template
@Component({
  template: `<input formControlName="correo" data-testid="email-input" />`
})

// ✅ SOLUTION 2: Use existing selectors
it('should find email input', () => {
  const input = fixture.debugElement.query(By.css('input[formControlName="correo"]'));
  expect(input).toBeTruthy();
});
```

## 🚨 Validation Message Mismatches

### Error: Expected validation message not found

**Root Cause**: Tests expect English messages, component shows Spanish.

```typescript
// ❌ WRONG: Expecting English messages
expect(errorElement.textContent).toContain('required'); // ← English expectation

// Component shows Spanish messages
@Component({
  template: `
    @if (form.get('correo')?.errors?.['required']) {
      El correo es requerido  <!-- ← Spanish message -->
    }
  `
})

// ✅ SOLUTION: Use actual message text or partial matches
expect(errorElement.textContent).toContain('requerido'); // ← Spanish match
expect(errorElement.textContent).toContain('válido');
expect(errorElement.textContent).toContain('caracteres');
```

## 📋 Error Prevention Checklist

### ✅ Before Writing Any Test
- [ ] Read component/service source code completely
- [ ] Document all dependencies and child components  
- [ ] Verify field names and interface definitions
- [ ] Check service method signatures and return types
- [ ] Confirm template structure and data-testid attributes
- [ ] Identify language/locale for validation messages

### ✅ Test Configuration Review
- [ ] All child components included in imports
- [ ] All service methods included in spy creation
- [ ] Return values match actual interface types
- [ ] Form field names match component implementation
- [ ] Test selectors match actual DOM structure

### ✅ Common Debugging Steps
1. **Check browser dev tools** - verify DOM structure
2. **Read error messages carefully** - they often point to exact issue
3. **Compare test expectations with actual implementation**
4. **Use console.log to debug data structures and values**
5. **Run single test in isolation** - avoid test interference

## 🎯 Success Patterns

### Minimal Working Test Template
```typescript
describe('GIVEN ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ComponentName,
        // Add ALL child components from template
        ChildComponent1,
        ChildComponent2,
        ReactiveFormsModule // If using forms
      ],
      providers: [
        // Mock only what you use
        { provide: ServiceName, useValue: jasmine.createSpyObj('ServiceName', ['method1', 'method2']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it('WHEN component initializes THEN should create', () => {
    expect(component).toBeTruthy();
  });
});
```

**Key Success Factors:**
1. **Read before writing** - understand actual implementation
2. **Start minimal** - basic creation test first
3. **Add incrementally** - one meaningful test at a time  
4. **Verify constantly** - run tests after each change
5. **Document patterns** - create templates for team

## 🚨 CRITICAL: NgRx Store Dependencies

### Error: "NullInjectorError: No provider for Store!"

**Root Cause**: Components using NgRx Store without proper test setup.

```typescript
// ❌ WRONG: Missing Store provider
@Component({
  template: `<div>{{ user$ | async }}</div>`
})
export class AppComponent {
  private store = inject(Store);
  user$ = this.store.select(selectUser);
}

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent] // ← Missing Store provider
    });
  });
  // Test fails: NullInjectorError: No provider for Store!
});

// ✅ SOLUTION: Include NgRx testing setup
import { MockStore, provideMockStore } from '@ngrx/store/testing';

describe('AppComponent', () => {
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideMockStore({
          initialState: {
            // Adapt to your app's state structure
            featureA: {
              data: null,
              loading: false,
              error: null
            },
            featureB: {
              items: [],
              selectedItem: null
            }
            // Add your app's state slices here
          }
        })
      ]
    }).compileComponents();

    store = TestBed.inject(MockStore);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Error: "Cannot read properties of undefined (reading 'subscribe')"

**Root Cause**: Facade/Service mock missing observable properties.

```typescript
// ❌ WRONG: Incomplete facade mocking
const dataFacadeSpy = jasmine.createSpyObj('DataFacade', ['loadData', 'clearData']);

// Component uses observable properties that aren't mocked
@Injectable()
export class DataFacade {
  items$ = this.store.select(selectItems);
  selectedItem$ = this.store.select(selectSelectedItem);
  isLoading$ = this.store.select(selectIsLoading);
  error$ = this.store.select(selectError);
}

// ✅ SOLUTION: Mock ALL observable properties
beforeEach(() => {
  const dataFacadeSpy = jasmine.createSpyObj('DataFacade', ['loadData', 'clearData']);
  
  // Mock ALL observable properties used by component
  dataFacadeSpy.items$ = of([]);
  dataFacadeSpy.selectedItem$ = of(null);
  dataFacadeSpy.isLoading$ = of(false);
  dataFacadeSpy.error$ = of(null);
  
  TestBed.configureTestingModule({
    providers: [{ provide: DataFacade, useValue: dataFacadeSpy }]
  });
});
```

## 🚨 CRITICAL: Form ControlValueAccessor Issues

### Error: "NG01203: No value accessor for form control name: [fieldName]"

**Root Cause**: Using mock components instead of real ones in forms.

```typescript
// ❌ WRONG: Mock components break ControlValueAccessor
const mockInput = jasmine.createSpyObj('CustomInputComponent', ['focus']);
const mockButton = jasmine.createSpyObj('CustomButtonComponent', ['click']);

describe('FormComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormComponent, ReactiveFormsModule],
      providers: [
        { provide: CustomInputComponent, useValue: mockInput },  // ← BREAKS FORMS
        { provide: CustomButtonComponent, useValue: mockButton }
      ]
    });
  });
  // Test fails: No value accessor for form control!
});

// ✅ SOLUTION: Use REAL components for forms
import { CustomInputComponent } from './path/to/custom-input.component';
import { CustomButtonComponent } from './path/to/custom-button.component';

describe('FormComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormComponent,
        ReactiveFormsModule,        // CRITICAL for reactive forms
        FormsModule,               // CRITICAL for template-driven forms
        CommonModule,              // CRITICAL for *ngIf, *ngFor, etc
        CustomInputComponent,      // Real component with ControlValueAccessor
        CustomButtonComponent,     // Real component
        // Add ALL child components used in your form template
      ]
    }).compileComponents();
  });
});
```

## 🚨 CRITICAL: Property Assertion Mismatches

### Error: "Expected '[ActualValue]' to equal '[AssumedValue]'"

**Root Cause**: Assuming property values without checking actual implementation.

```typescript
// ❌ WRONG: Assuming title value without checking component
expect(component.title).toBe('my-project-name');

// ✅ CHECK ACTUAL COMPONENT FIRST
// Always read the component source to see actual property values
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'My Awesome App';  // ← ACTUAL value (could be anything)
}

// ✅ CORRECT: Use actual property value from component
expect(component.title).toBe('My Awesome App');
```

### Error: "Expected undefined to contain '[AssertedText]'"

**Root Cause**: Assuming template content without checking actual template.

```typescript
// ❌ WRONG: Assuming template renders certain content
expect(compiled.textContent).toContain('Welcome to my app');

// ✅ CHECK ACTUAL TEMPLATE FIRST
// Read the actual template file to see what's rendered
// Example: app.component.html might only contain:
<router-outlet></router-outlet>
<nav>Navigation</nav>

// ✅ CORRECT: Test what actually exists in template
expect(compiled.querySelector('router-outlet')).toBeTruthy();
expect(compiled.querySelector('nav')).toBeTruthy();
```

### Generic Pattern for Field Name Mismatches

**Root Cause**: Assuming field names without checking form implementation.

```typescript
// ❌ WRONG: Assuming English field names
it('should validate email', () => {
  component.form.get('email')?.setValue('invalid');
  component.form.get('password')?.setValue('');
  expect(component.form.valid).toBeFalsy();
});

// ✅ SOLUTION: Check actual formControlName values in template
// Look at your component template to see actual field names:
// <input formControlName="userEmail" />     ← Actual field name
// <input formControlName="userPassword" />  ← Actual field name

it('should validate form fields', () => {
  component.form.get('userEmail')?.setValue('invalid');
  component.form.get('userPassword')?.setValue('');
  expect(component.form.valid).toBeFalsy();
});
```

## 📋 MANDATORY Pre-Implementation Checklist

### ✅ Before ANY Test Implementation

#### Component Analysis
- [ ] **Read component source completely** - Check actual properties and methods
- [ ] **Read template/templateUrl** - Verify actual DOM structure and child components
- [ ] **Document dependencies** - List all child components used
- [ ] **Check injection pattern** - constructor vs inject() function
- [ ] **Verify form field names** - correo vs email, clave vs password

#### State Management Analysis  
- [ ] **Detect NgRx usage** - Look for Store injection in component
- [ ] **Document facade dependencies** - List all observable properties used
- [ ] **Check service methods** - Document all methods called by component

#### Architecture Analysis
- [ ] **Standalone vs NgModule** - Affects TestBed configuration
- [ ] **Signal vs Observable** - Affects testing approach
- [ ] **Form pattern** - Reactive vs Template-driven

### ✅ Test Configuration Verification
- [ ] **All child components included** - Real components, not mocks for forms
- [ ] **All service dependencies mocked** - Include ALL methods and properties
- [ ] **NgRx Store provided** - Use provideMockStore if needed
- [ ] **Form modules included** - ReactiveFormsModule, FormsModule, CommonModule

### ✅ Assertion Verification
- [ ] **Property values verified** - Check actual vs expected
- [ ] **Template content verified** - Test what actually exists
- [ ] **Field names verified** - Use actual formControlName values
- [ ] **Error messages verified** - Check language/locale

## 🎯 Updated Success Patterns
