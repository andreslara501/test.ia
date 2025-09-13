# Angular Component Testing

This guide covers comprehensive Angular component testing using TestBed, ComponentFixture, and Angular testing utilities.

## Basic Component Testing

### Simple Component Testing
```typescript
// components/user-greeting.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-user-greeting',
  template: `
    <div data-testid="user-greeting">
      <h1>Hello, {{ name }}!</h1>
      <p *ngIf="showWelcome">Welcome to our application</p>
      <button 
        (click)="onGreet()" 
        data-testid="greet-button"
        [disabled]="disabled"
      >
        Say Hello
      </button>
    </div>
  `
})
export class UserGreetingComponent {
  @Input() name: string = '';
  @Input() showWelcome: boolean = false;
  @Input() disabled: boolean = false;
  @Output() greet = new EventEmitter<void>();

  onGreet(): void {
    this.greet.emit();
  }
}
```

```typescript
// components/user-greeting.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { UserGreetingComponent } from './user-greeting.component';

describe('GIVEN UserGreetingComponent', () => {
  let component: UserGreetingComponent;
  let fixture: ComponentFixture<UserGreetingComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserGreetingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserGreetingComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  it('WHEN rendered with name THEN should display greeting', () => {
    component.name = 'John Doe';
    fixture.detectChanges();

    const greeting = debugElement.query(By.css('h1'));
    expect(greeting.nativeElement.textContent).toBe('Hello, John Doe!');
  });

  it('WHEN showWelcome is true THEN should display welcome message', () => {
    component.name = 'John';
    component.showWelcome = true;
    fixture.detectChanges();

    const welcomeElement = debugElement.query(By.css('p'));
    expect(welcomeElement).toBeTruthy();
    expect(welcomeElement.nativeElement.textContent).toBe('Welcome to our application');
  });

  it('WHEN showWelcome is false THEN should not display welcome message', () => {
    component.name = 'John';
    component.showWelcome = false;
    fixture.detectChanges();

    const welcomeElement = debugElement.query(By.css('p'));
    expect(welcomeElement).toBeFalsy();
  });

  it('WHEN greet button is clicked THEN should emit greet event', () => {
    spyOn(component.greet, 'emit');
    
    const button = debugElement.query(By.css('[data-testid="greet-button"]'));
    button.nativeElement.click();

    expect(component.greet.emit).toHaveBeenCalled();
  });

  it('WHEN disabled is true THEN button should be disabled', () => {
    component.disabled = true;
    fixture.detectChanges();

    const button = debugElement.query(By.css('[data-testid="greet-button"]'));
    expect(button.nativeElement.disabled).toBe(true);
  });
});
```

## Testing Component State

### Component with Reactive Forms
```typescript
// components/user-form.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface UserFormData {
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-user-form',
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()" data-testid="user-form">
      <div>
        <label for="name">Name:</label>
        <input
          id="name"
          formControlName="name"
          data-testid="name-input"
          [class.error]="isFieldInvalid('name')"
        />
        <div *ngIf="isFieldInvalid('name')" data-testid="name-error">
          Name is required
        </div>
      </div>

      <div>
        <label for="email">Email:</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          data-testid="email-input"
          [class.error]="isFieldInvalid('email')"
        />
        <div *ngIf="isFieldInvalid('email')" data-testid="email-error">
          <span *ngIf="userForm.get('email')?.errors?.['required']">Email is required</span>
          <span *ngIf="userForm.get('email')?.errors?.['email']">Email format is invalid</span>
        </div>
      </div>

      <div>
        <label for="age">Age:</label>
        <input
          id="age"
          type="number"
          formControlName="age"
          data-testid="age-input"
          [class.error]="isFieldInvalid('age')"
        />
        <div *ngIf="isFieldInvalid('age')" data-testid="age-error">
          <span *ngIf="userForm.get('age')?.errors?.['required']">Age is required</span>
          <span *ngIf="userForm.get('age')?.errors?.['min']">Age must be at least 1</span>
          <span *ngIf="userForm.get('age')?.errors?.['max']">Age must be at most 120</span>
        </div>
      </div>

      <button
        type="submit"
        [disabled]="userForm.invalid || isSubmitting"
        data-testid="submit-btn"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
      </button>
    </form>
  `
})
export class UserFormComponent implements OnInit {
  @Output() formSubmit = new EventEmitter<UserFormData>();

  userForm!: FormGroup;
  isSubmitting = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.userForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      age: ['', [Validators.required, Validators.min(1), Validators.max(120)]]
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      const formData: UserFormData = this.userForm.value;
      this.formSubmit.emit(formData);
      
      // Simulate async operation
      setTimeout(() => {
        this.isSubmitting = false;
      }, 1000);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
```

```typescript
// components/user-form.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { UserFormComponent, UserFormData } from './user-form.component';

describe('GIVEN UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserFormComponent],
      imports: [ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('WHEN form is initialized THEN should create form with empty values', () => {
    expect(component.userForm).toBeTruthy();
    expect(component.userForm.get('name')?.value).toBe('');
    expect(component.userForm.get('email')?.value).toBe('');
    expect(component.userForm.get('age')?.value).toBe('');
  });

  it('WHEN form is empty THEN submit button should be disabled', () => {
    const submitBtn = fixture.debugElement.query(By.css('[data-testid="submit-btn"]'));
    expect(submitBtn.nativeElement.disabled).toBe(true);
  });

  it('WHEN required fields are empty and touched THEN should show validation errors', () => {
    // Touch all fields
    component.userForm.get('name')?.markAsTouched();
    component.userForm.get('email')?.markAsTouched();
    component.userForm.get('age')?.markAsTouched();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[data-testid="name-error"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-testid="email-error"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-testid="age-error"]'))).toBeTruthy();
  });

  it('WHEN invalid email is entered THEN should show email format error', () => {
    const emailInput = fixture.debugElement.query(By.css('[data-testid="email-input"]'));
    
    emailInput.nativeElement.value = 'invalid-email';
    emailInput.nativeElement.dispatchEvent(new Event('input'));
    component.userForm.get('email')?.markAsTouched();
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('[data-testid="email-error"]'));
    expect(errorElement.nativeElement.textContent.trim()).toBe('Email format is invalid');
  });

  it('WHEN age is out of range THEN should show age validation error', () => {
    const ageInput = fixture.debugElement.query(By.css('[data-testid="age-input"]'));
    
    ageInput.nativeElement.value = '150';
    ageInput.nativeElement.dispatchEvent(new Event('input'));
    component.userForm.get('age')?.markAsTouched();
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('[data-testid="age-error"]'));
    expect(errorElement.nativeElement.textContent.trim()).toBe('Age must be at most 120');
  });

  it('WHEN valid form is submitted THEN should emit form data', fakeAsync(() => {
    spyOn(component.formSubmit, 'emit');

    // Fill form with valid data
    component.userForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('[data-testid="user-form"]'));
    form.nativeElement.dispatchEvent(new Event('submit'));

    expect(component.formSubmit.emit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
  }));

  it('WHEN form is being submitted THEN should show loading state', fakeAsync(() => {
    component.userForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    });
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.css('[data-testid="user-form"]'));
    form.nativeElement.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const submitBtn = fixture.debugElement.query(By.css('[data-testid="submit-btn"]'));
    expect(submitBtn.nativeElement.textContent.trim()).toBe('Submitting...');
    expect(submitBtn.nativeElement.disabled).toBe(true);

    tick(1000);
    fixture.detectChanges();

    expect(submitBtn.nativeElement.textContent.trim()).toBe('Submit');
    expect(component.isSubmitting).toBe(false);
  }));
});
```

## Testing Component with Services

### Component with Dependency Injection
```typescript
// services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  id: string;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  getUsers(): Observable<User[]> {
    return of(this.users).pipe(delay(100));
  }

  getUserById(id: string): Observable<User> {
    const user = this.users.find(u => u.id === id);
    if (user) {
      return of(user).pipe(delay(100));
    }
    return throwError(() => new Error('User not found'));
  }

  createUser(user: Omit<User, 'id'>): Observable<User> {
    const newUser: User = {
      ...user,
      id: (this.users.length + 1).toString()
    };
    this.users.push(newUser);
    return of(newUser).pipe(delay(100));
  }
}
```

```typescript
// components/user-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService, User } from '../services/user.service';

@Component({
  selector: 'app-user-list',
  template: `
    <div data-testid="user-list">
      <div *ngIf="loading" data-testid="loading">Loading users...</div>
      <div *ngIf="error" data-testid="error">{{ error }}</div>
      <div *ngIf="!loading && !error" data-testid="users-container">
        <div 
          *ngFor="let user of users" 
          [attr.data-testid]="'user-' + user.id"
          class="user-item"
        >
          <h3>{{ user.name }}</h3>
          <p>{{ user.email }}</p>
          <button 
            (click)="selectUser(user)" 
            [attr.data-testid]="'select-user-' + user.id"
          >
            Select
          </button>
        </div>
      </div>
      <button 
        (click)="refreshUsers()" 
        data-testid="refresh-btn"
        [disabled]="loading"
      >
        Refresh
      </button>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  selectUser(user: User): void {
    console.log('Selected user:', user);
  }
}
```

```typescript
// components/user-list.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { UserListComponent } from './user-list.component';
import { UserService, User } from '../services/user.service';

describe('GIVEN UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ];

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);

    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('WHEN component initializes THEN should load users', fakeAsync(() => {
    mockUserService.getUsers.and.returnValue(of(mockUsers));

    component.ngOnInit();
    expect(component.loading).toBe(true);

    tick(100);

    expect(mockUserService.getUsers).toHaveBeenCalled();
    expect(component.users).toEqual(mockUsers);
    expect(component.loading).toBe(false);
    expect(component.error).toBe(null);
  }));

  it('WHEN users load successfully THEN should display user list', fakeAsync(() => {
    mockUserService.getUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges(); // triggers ngOnInit
    tick(100);
    fixture.detectChanges();

    const usersContainer = fixture.debugElement.query(By.css('[data-testid="users-container"]'));
    expect(usersContainer).toBeTruthy();

    const userElements = fixture.debugElement.queryAll(By.css('.user-item'));
    expect(userElements.length).toBe(2);

    expect(fixture.debugElement.query(By.css('[data-testid="user-1"]'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('[data-testid="user-2"]'))).toBeTruthy();
  }));

  it('WHEN loading users THEN should show loading indicator', () => {
    mockUserService.getUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges();

    const loadingElement = fixture.debugElement.query(By.css('[data-testid="loading"]'));
    expect(loadingElement).toBeTruthy();
    expect(loadingElement.nativeElement.textContent.trim()).toBe('Loading users...');
  });

  it('WHEN user loading fails THEN should show error message', fakeAsync(() => {
    mockUserService.getUsers.and.returnValue(throwError(() => new Error('Server error')));

    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    const errorElement = fixture.debugElement.query(By.css('[data-testid="error"]'));
    expect(errorElement).toBeTruthy();
    expect(errorElement.nativeElement.textContent.trim()).toBe('Server error');
    expect(component.loading).toBe(false);
  }));

  it('WHEN refresh button is clicked THEN should reload users', fakeAsync(() => {
    mockUserService.getUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges();
    tick(100);
    fixture.detectChanges();

    mockUserService.getUsers.calls.reset();
    const refreshBtn = fixture.debugElement.query(By.css('[data-testid="refresh-btn"]'));
    refreshBtn.nativeElement.click();

    expect(mockUserService.getUsers).toHaveBeenCalled();
    expect(component.loading).toBe(true);
  }));

  it('WHEN user is selected THEN should log selected user', () => {
    spyOn(console, 'log');
    const testUser = mockUsers[0];

    component.selectUser(testUser);

    expect(console.log).toHaveBeenCalledWith('Selected user:', testUser);
  });

  it('WHEN loading THEN refresh button should be disabled', () => {
    mockUserService.getUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges(); // component is loading

    const refreshBtn = fixture.debugElement.query(By.css('[data-testid="refresh-btn"]'));
    expect(refreshBtn.nativeElement.disabled).toBe(true);
  });
});
```

## Testing Component Lifecycle

### Component with Lifecycle Hooks
```typescript
// components/timer.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';

@Component({
  selector: 'app-timer',
  template: `
    <div data-testid="timer">
      <div data-testid="time">{{ formattedTime }}</div>
      <button 
        (click)="start()" 
        [disabled]="isRunning" 
        data-testid="start-btn"
      >
        Start
      </button>
      <button 
        (click)="pause()" 
        [disabled]="!isRunning" 
        data-testid="pause-btn"
      >
        Pause
      </button>
      <button (click)="reset()" data-testid="reset-btn">Reset</button>
    </div>
  `
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() autoStart = false;

  time = 0;
  isRunning = false;
  private intervalId: any = null;

  get formattedTime(): string {
    const minutes = Math.floor(this.time / 60);
    const seconds = this.time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    if (this.autoStart) {
      this.start();
    }
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.intervalId = setInterval(() => {
        this.time++;
      }, 1000);
    }
  }

  pause(): void {
    if (this.isRunning) {
      this.isRunning = false;
      this.clearInterval();
    }
  }

  reset(): void {
    this.pause();
    this.time = 0;
  }

  private clearInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

```typescript
// components/timer.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TimerComponent } from './timer.component';

describe('GIVEN TimerComponent', () => {
  let component: TimerComponent;
  let fixture: ComponentFixture<TimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TimerComponent);
    component = fixture.componentInstance;
  });

  it('WHEN component initializes THEN should display initial time', () => {
    fixture.detectChanges();

    const timeElement = fixture.debugElement.query(By.css('[data-testid="time"]'));
    expect(timeElement.nativeElement.textContent).toBe('00:00');
  });

  it('WHEN autoStart is true THEN should start automatically', fakeAsync(() => {
    component.autoStart = true;
    
    fixture.detectChanges(); // triggers ngOnInit

    expect(component.isRunning).toBe(true);
    
    tick(3000);
    fixture.detectChanges();

    expect(component.time).toBe(3);
    expect(component.formattedTime).toBe('00:03');
  }));

  it('WHEN start button is clicked THEN should start timer', fakeAsync(() => {
    fixture.detectChanges();

    const startBtn = fixture.debugElement.query(By.css('[data-testid="start-btn"]'));
    startBtn.nativeElement.click();
    fixture.detectChanges();

    expect(component.isRunning).toBe(true);
    expect(startBtn.nativeElement.disabled).toBe(true);
    
    const pauseBtn = fixture.debugElement.query(By.css('[data-testid="pause-btn"]'));
    expect(pauseBtn.nativeElement.disabled).toBe(false);
  }));

  it('WHEN timer is running THEN should increment time', fakeAsync(() => {
    fixture.detectChanges();

    component.start();
    
    tick(5000);
    fixture.detectChanges();

    const timeElement = fixture.debugElement.query(By.css('[data-testid="time"]'));
    expect(timeElement.nativeElement.textContent).toBe('00:05');
  }));

  it('WHEN pause button is clicked THEN should pause timer', fakeAsync(() => {
    fixture.detectChanges();

    component.start();
    tick(2000);

    const pauseBtn = fixture.debugElement.query(By.css('[data-testid="pause-btn"]'));
    pauseBtn.nativeElement.click();
    fixture.detectChanges();

    const timeBefore = component.time;
    tick(2000);

    expect(component.time).toBe(timeBefore);
    expect(component.isRunning).toBe(false);
  }));

  it('WHEN reset button is clicked THEN should reset timer', fakeAsync(() => {
    fixture.detectChanges();

    component.start();
    tick(5000);

    const resetBtn = fixture.debugElement.query(By.css('[data-testid="reset-btn"]'));
    resetBtn.nativeElement.click();
    fixture.detectChanges();

    expect(component.time).toBe(0);
    expect(component.isRunning).toBe(false);
    
    const timeElement = fixture.debugElement.query(By.css('[data-testid="time"]'));
    expect(timeElement.nativeElement.textContent).toBe('00:00');
  }));

  it('WHEN component is destroyed THEN should clear interval', fakeAsync(() => {
    spyOn(window, 'clearInterval');
    
    fixture.detectChanges();
    component.start();
    
    fixture.destroy();

    expect(clearInterval).toHaveBeenCalled();
  }));

  it('WHEN time reaches 60 seconds THEN should display as minutes', fakeAsync(() => {
    fixture.detectChanges();

    component.start();
    tick(65000); // 65 seconds
    fixture.detectChanges();

    const timeElement = fixture.debugElement.query(By.css('[data-testid="time"]'));
    expect(timeElement.nativeElement.textContent).toBe('01:05');
  }));
});
```

## Testing Directives

### Custom Directive Testing
```typescript
// directives/highlight.directive.ts
import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective implements OnChanges {
  @Input() appHighlight: string = '';
  @Input() highlightColor: string = 'yellow';

  constructor(private el: ElementRef) {}

  ngOnChanges(): void {
    this.highlight();
  }

  private highlight(): void {
    if (this.appHighlight) {
      this.el.nativeElement.style.backgroundColor = this.highlightColor;
      this.el.nativeElement.setAttribute('data-highlighted', 'true');
    } else {
      this.el.nativeElement.style.backgroundColor = '';
      this.el.nativeElement.removeAttribute('data-highlighted');
    }
  }
}
```

```typescript
// directives/highlight.directive.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HighlightDirective } from './highlight.directive';

@Component({
  template: `
    <div 
      appHighlight="test" 
      highlightColor="red"
      data-testid="highlighted-element"
    >
      Test Content
    </div>
    <div appHighlight="" data-testid="non-highlighted-element">
      Non-highlighted Content
    </div>
  `
})
class TestComponent {}

describe('GIVEN HighlightDirective', () => {
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HighlightDirective, TestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
  });

  it('WHEN directive has highlight value THEN should apply background color', () => {
    const highlightedElement = fixture.debugElement.query(
      By.css('[data-testid="highlighted-element"]')
    );

    expect(highlightedElement.nativeElement.style.backgroundColor).toBe('red');
    expect(highlightedElement.nativeElement.getAttribute('data-highlighted')).toBe('true');
  });

  it('WHEN directive has no highlight value THEN should not apply background color', () => {
    const nonHighlightedElement = fixture.debugElement.query(
      By.css('[data-testid="non-highlighted-element"]')
    );

    expect(nonHighlightedElement.nativeElement.style.backgroundColor).toBe('');
    expect(nonHighlightedElement.nativeElement.getAttribute('data-highlighted')).toBe(null);
  });
});
```

## Related Resources
- [Service Testing](./service-testing.md)
- [Integration Testing](./integration.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)