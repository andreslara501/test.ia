# Angular Integration Testing

This guide covers integration testing in Angular applications, including component-service integration, routing, and module testing.

## Component-Service Integration

### Testing Component with Service Dependencies
```typescript
// components/user-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UserManagerService } from '../services/user-manager.service';
import { NotificationService } from '../services/notification.service';
import { User, CreateUserRequest } from '../services/api.service';

@Component({
  selector: 'app-user-list',
  template: `
    <div class="user-list">
      <div class="header">
        <h2>Users</h2>
        <button 
          class="refresh-btn" 
          (click)="refreshUsers()" 
          [disabled]="isLoading"
          data-testid="refresh-button">
          {{ isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div class="user-form" *ngIf="showForm">
        <h3>Add New User</h3>
        <form (ngSubmit)="addUser()" #userForm="ngForm">
          <input 
            type="text" 
            name="name" 
            [(ngModel)]="newUser.name" 
            placeholder="Name"
            required
            data-testid="name-input">
          <input 
            type="email" 
            name="email" 
            [(ngModel)]="newUser.email" 
            placeholder="Email"
            required
            data-testid="email-input">
          <button 
            type="submit" 
            [disabled]="!userForm.valid || isLoading"
            data-testid="add-user-button">
            Add User
          </button>
          <button 
            type="button" 
            (click)="cancelForm()"
            data-testid="cancel-button">
            Cancel
          </button>
        </form>
      </div>

      <div class="user-list-content">
        <div *ngIf="isLoading" class="loading" data-testid="loading-indicator">
          Loading users...
        </div>

        <div *ngIf="!isLoading && users.length === 0" class="empty-state" data-testid="empty-state">
          No users found. <button (click)="showAddForm()" data-testid="show-form-button">Add one?</button>
        </div>

        <div *ngIf="!isLoading && users.length > 0" class="users">
          <div 
            *ngFor="let user of users; trackBy: trackByUserId" 
            class="user-item"
            [attr.data-testid]="'user-' + user.id">
            <div class="user-info">
              <h4>{{ user.name }}</h4>
              <p>{{ user.email }}</p>
              <small>Created: {{ user.createdAt | date }}</small>
            </div>
            <button 
              (click)="viewUser(user)"
              [attr.data-testid]="'view-user-' + user.id">
              View
            </button>
          </div>
        </div>
      </div>

      <button 
        *ngIf="!showForm && users.length > 0" 
        class="add-button" 
        (click)="showAddForm()"
        data-testid="add-button">
        Add User
      </button>
    </div>
  `,
  styles: [`
    .user-list { padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .user-form { margin: 20px 0; padding: 20px; border: 1px solid #ddd; }
    .user-form form { display: flex; gap: 10px; flex-wrap: wrap; }
    .user-form input { padding: 8px; border: 1px solid #ccc; }
    .user-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
    .loading, .empty-state { text-align: center; padding: 40px; color: #666; }
    .refresh-btn:disabled, .add-button:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  isLoading = false;
  showForm = false;
  newUser: CreateUserRequest = { name: '', email: '' };
  private destroy$ = new Subject<void>();

  constructor(
    private userManager: UserManagerService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userManager.loadUsers()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (users) => {
          this.users = users;
        },
        error: (error) => {
          this.notifications.error('Failed to load users');
          console.error('Error loading users:', error);
        }
      });
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  showAddForm(): void {
    this.showForm = true;
    this.newUser = { name: '', email: '' };
  }

  cancelForm(): void {
    this.showForm = false;
    this.newUser = { name: '', email: '' };
  }

  addUser(): void {
    if (!this.newUser.name || !this.newUser.email) {
      return;
    }

    this.isLoading = true;
    this.userManager.createUser(this.newUser)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (user) => {
          this.users = [...this.users, user];
          this.notifications.success(`User ${user.name} created successfully`);
          this.cancelForm();
        },
        error: (error) => {
          this.notifications.error('Failed to create user');
          console.error('Error creating user:', error);
        }
      });
  }

  viewUser(user: User): void {
    this.notifications.info(`Viewing user: ${user.name}`);
    // Navigate to user detail or show modal
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
```

```typescript
// components/user-list.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { UserListComponent } from './user-list.component';
import { UserManagerService } from '../services/user-manager.service';
import { NotificationService } from '../services/notification.service';
import { User, CreateUserRequest } from '../services/api.service';

describe('GIVEN UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;
  let mockUserManager: jasmine.SpyObj<UserManagerService>;
  let mockNotifications: jasmine.SpyObj<NotificationService>;

  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2023-01-01' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: '2023-01-02' }
  ];

  beforeEach(async () => {
    const userManagerSpy = jasmine.createSpyObj('UserManagerService', [
      'loadUsers', 'createUser'
    ]);
    const notificationsSpy = jasmine.createSpyObj('NotificationService', [
      'success', 'error', 'info'
    ]);

    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      imports: [FormsModule],
      providers: [
        { provide: UserManagerService, useValue: userManagerSpy },
        { provide: NotificationService, useValue: notificationsSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    mockUserManager = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
    mockNotifications = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  describe('WHEN component initializes', () => {
    it('THEN should load users on init', () => {
      mockUserManager.loadUsers.and.returnValue(of(mockUsers));

      fixture.detectChanges(); // triggers ngOnInit

      expect(mockUserManager.loadUsers).toHaveBeenCalled();
      expect(component.users).toEqual(mockUsers);
      expect(component.isLoading).toBe(false);
    });

    it('THEN should show loading state initially', () => {
      mockUserManager.loadUsers.and.returnValue(of(mockUsers));
      component.isLoading = true;

      fixture.detectChanges();

      const loadingElement = fixture.debugElement.query(
        By.css('[data-testid="loading-indicator"]')
      );
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.nativeElement.textContent).toContain('Loading users...');
    });

    it('THEN should show empty state when no users', () => {
      mockUserManager.loadUsers.and.returnValue(of([]));

      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(
        By.css('[data-testid="empty-state"]')
      );
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No users found');
    });

    it('THEN should handle load users error', () => {
      const error = new Error('Load failed');
      mockUserManager.loadUsers.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(mockNotifications.error).toHaveBeenCalledWith('Failed to load users');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('WHEN users are loaded', () => {
    beforeEach(() => {
      mockUserManager.loadUsers.and.returnValue(of(mockUsers));
      fixture.detectChanges();
    });

    it('THEN should display user list', () => {
      const userElements = fixture.debugElement.queryAll(
        By.css('[data-testid^="user-"]')
      );
      
      expect(userElements.length).toBe(2);
      expect(userElements[0].nativeElement.textContent).toContain('John Doe');
      expect(userElements[0].nativeElement.textContent).toContain('john@example.com');
      expect(userElements[1].nativeElement.textContent).toContain('Jane Smith');
    });

    it('THEN should show add button', () => {
      const addButton = fixture.debugElement.query(
        By.css('[data-testid="add-button"]')
      );
      
      expect(addButton).toBeTruthy();
      expect(addButton.nativeElement.textContent).toBe('Add User');
    });

    it('THEN should allow viewing individual users', () => {
      const viewButton = fixture.debugElement.query(
        By.css('[data-testid="view-user-1"]')
      );
      
      viewButton.nativeElement.click();
      
      expect(mockNotifications.info).toHaveBeenCalledWith('Viewing user: John Doe');
    });
  });

  describe('WHEN refresh button is clicked', () => {
    it('THEN should reload users', fakeAsync(() => {
      mockUserManager.loadUsers.and.returnValue(of(mockUsers));
      fixture.detectChanges();
      
      // Reset spy to track subsequent calls
      mockUserManager.loadUsers.calls.reset();
      mockUserManager.loadUsers.and.returnValue(of([...mockUsers, {
        id: '3', 
        name: 'New User', 
        email: 'new@example.com', 
        createdAt: '2023-01-03'
      }]));

      const refreshButton = fixture.debugElement.query(
        By.css('[data-testid="refresh-button"]')
      );
      refreshButton.nativeElement.click();
      tick();
      fixture.detectChanges();

      expect(mockUserManager.loadUsers).toHaveBeenCalled();
      expect(component.users.length).toBe(3);
    }));

    it('THEN should disable button while loading', fakeAsync(() => {
      mockUserManager.loadUsers.and.returnValue(of(mockUsers));
      fixture.detectChanges();
      
      // Create a delayed observable to simulate loading
      mockUserManager.loadUsers.and.returnValue(of(mockUsers));
      component.isLoading = true;
      fixture.detectChanges();

      const refreshButton = fixture.debugElement.query(
        By.css('[data-testid="refresh-button"]')
      );
      
      expect(refreshButton.nativeElement.disabled).toBe(true);
      expect(refreshButton.nativeElement.textContent).toBe('Loading...');
    }));
  });

  describe('WHEN adding a new user', () => {
    beforeEach(() => {
      mockUserManager.loadUsers.and.returnValue(of(mockUsers));
      fixture.detectChanges();
    });

    it('THEN should show form when add button clicked', () => {
      const addButton = fixture.debugElement.query(
        By.css('[data-testid="add-button"]')
      );
      
      addButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.showForm).toBe(true);
      
      const nameInput = fixture.debugElement.query(
        By.css('[data-testid="name-input"]')
      );
      const emailInput = fixture.debugElement.query(
        By.css('[data-testid="email-input"]')
      );
      
      expect(nameInput).toBeTruthy();
      expect(emailInput).toBeTruthy();
    });

    it('THEN should create user when form submitted with valid data', fakeAsync(() => {
      const newUser: CreateUserRequest = { name: 'Test User', email: 'test@example.com' };
      const createdUser: User = { id: '3', ...newUser, createdAt: '2023-01-03' };
      
      mockUserManager.createUser.and.returnValue(of(createdUser));
      
      // Show form
      component.showAddForm();
      fixture.detectChanges();

      // Fill form
      const nameInput = fixture.debugElement.query(
        By.css('[data-testid="name-input"]')
      ).nativeElement;
      const emailInput = fixture.debugElement.query(
        By.css('[data-testid="email-input"]')
      ).nativeElement;

      nameInput.value = newUser.name;
      nameInput.dispatchEvent(new Event('input'));
      emailInput.value = newUser.email;
      emailInput.dispatchEvent(new Event('input'));
      
      fixture.detectChanges();
      tick();

      // Submit form
      const addUserButton = fixture.debugElement.query(
        By.css('[data-testid="add-user-button"]')
      );
      addUserButton.nativeElement.click();
      tick();
      fixture.detectChanges();

      expect(mockUserManager.createUser).toHaveBeenCalledWith(
        jasmine.objectContaining(newUser)
      );
      expect(mockNotifications.success).toHaveBeenCalledWith(
        'User Test User created successfully'
      );
      expect(component.showForm).toBe(false);
      expect(component.users).toContain(createdUser);
    }));

    it('THEN should handle create user error', fakeAsync(() => {
      const error = new Error('Creation failed');
      mockUserManager.createUser.and.returnValue(throwError(() => error));
      
      component.showAddForm();
      component.newUser = { name: 'Test', email: 'test@example.com' };
      
      component.addUser();
      tick();

      expect(mockNotifications.error).toHaveBeenCalledWith('Failed to create user');
      expect(component.showForm).toBe(true); // Form should remain open
    }));

    it('THEN should cancel form when cancel button clicked', () => {
      component.showAddForm();
      component.newUser = { name: 'Test', email: 'test@example.com' };
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(
        By.css('[data-testid="cancel-button"]')
      );
      cancelButton.nativeElement.click();
      fixture.detectChanges();

      expect(component.showForm).toBe(false);
      expect(component.newUser).toEqual({ name: '', email: '' });
    });

    it('THEN should disable submit button when form invalid', () => {
      component.showAddForm();
      fixture.detectChanges();

      const addUserButton = fixture.debugElement.query(
        By.css('[data-testid="add-user-button"]')
      );
      
      expect(addUserButton.nativeElement.disabled).toBe(true);
    });
  });

  describe('WHEN component is destroyed', () => {
    it('THEN should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
```

## Router Integration Testing

### Testing Component with Router
```typescript
// components/user-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { UserManagerService } from '../services/user-manager.service';
import { NotificationService } from '../services/notification.service';
import { User } from '../services/api.service';

@Component({
  selector: 'app-user-detail',
  template: `
    <div class="user-detail" *ngIf="user; else notFound">
      <div class="header">
        <button (click)="goBack()" class="back-button" data-testid="back-button">
          ← Back to Users
        </button>
        <h2 data-testid="user-name">{{ user.name }}</h2>
      </div>
      
      <div class="user-info">
        <div class="info-item">
          <label>Email:</label>
          <span data-testid="user-email">{{ user.email }}</span>
        </div>
        <div class="info-item">
          <label>Created:</label>
          <span data-testid="user-created">{{ user.createdAt | date }}</span>
        </div>
        <div class="info-item">
          <label>ID:</label>
          <span data-testid="user-id">{{ user.id }}</span>
        </div>
      </div>

      <div class="actions">
        <button (click)="editUser()" class="edit-button" data-testid="edit-button">
          Edit User
        </button>
        <button (click)="deleteUser()" class="delete-button" data-testid="delete-button">
          Delete User
        </button>
      </div>
    </div>

    <ng-template #notFound>
      <div class="not-found" data-testid="not-found">
        <h2>User Not Found</h2>
        <p>The user you're looking for doesn't exist.</p>
        <button (click)="goBack()" data-testid="back-button-not-found">
          Back to Users
        </button>
      </div>
    </ng-template>

    <div *ngIf="isLoading" class="loading" data-testid="loading">
      Loading user details...
    </div>
  `,
  styles: [`
    .user-detail { padding: 20px; max-width: 600px; margin: 0 auto; }
    .header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
    .back-button { background: none; border: 1px solid #ddd; padding: 8px 16px; cursor: pointer; }
    .user-info { margin-bottom: 30px; }
    .info-item { display: flex; margin-bottom: 15px; }
    .info-item label { font-weight: bold; min-width: 100px; }
    .actions { display: flex; gap: 10px; }
    .edit-button { background: #007bff; color: white; border: none; padding: 10px 20px; cursor: pointer; }
    .delete-button { background: #dc3545; color: white; border: none; padding: 10px 20px; cursor: pointer; }
    .not-found, .loading { text-align: center; padding: 40px; }
  `]
})
export class UserDetailComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userManager: UserManagerService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(params => {
          const userId = params.get('id');
          if (!userId) {
            throw new Error('No user ID provided');
          }
          return this.userManager.getUserById(userId);
        })
      )
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
          
          if (!user) {
            this.notifications.error('User not found');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.notifications.error('Failed to load user details');
          console.error('Error loading user:', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  editUser(): void {
    if (this.user) {
      this.router.navigate(['/users', this.user.id, 'edit']);
    }
  }

  deleteUser(): void {
    if (this.user && confirm(`Are you sure you want to delete ${this.user.name}?`)) {
      // Implementation would call delete service
      this.notifications.success(`User ${this.user.name} deleted successfully`);
      this.goBack();
    }
  }
}
```

```typescript
// components/user-detail.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { UserDetailComponent } from './user-detail.component';
import { UserManagerService } from '../services/user-manager.service';
import { NotificationService } from '../services/notification.service';
import { User } from '../services/api.service';

describe('GIVEN UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockUserManager: jasmine.SpyObj<UserManagerService>;
  let mockNotifications: jasmine.SpyObj<NotificationService>;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: '2023-01-01'
  };

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const userManagerSpy = jasmine.createSpyObj('UserManagerService', ['getUserById']);
    const notificationsSpy = jasmine.createSpyObj('NotificationService', [
      'success', 'error', 'info'
    ]);

    mockActivatedRoute = {
      paramMap: of(new Map([['id', '1']]))
    };

    await TestBed.configureTestingModule({
      declarations: [UserDetailComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: UserManagerService, useValue: userManagerSpy },
        { provide: NotificationService, useValue: notificationsSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockUserManager = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
    mockNotifications = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  describe('WHEN component initializes with valid user ID', () => {
    it('THEN should load and display user details', () => {
      mockUserManager.getUserById.and.returnValue(of(mockUser));

      fixture.detectChanges();

      expect(mockUserManager.getUserById).toHaveBeenCalledWith('1');
      expect(component.user).toEqual(mockUser);
      expect(component.isLoading).toBe(false);

      const userName = fixture.debugElement.query(By.css('[data-testid="user-name"]'));
      const userEmail = fixture.debugElement.query(By.css('[data-testid="user-email"]'));
      const userId = fixture.debugElement.query(By.css('[data-testid="user-id"]'));

      expect(userName.nativeElement.textContent).toBe('John Doe');
      expect(userEmail.nativeElement.textContent).toBe('john@example.com');
      expect(userId.nativeElement.textContent).toBe('1');
    });

    it('THEN should show loading state initially', () => {
      mockUserManager.getUserById.and.returnValue(of(mockUser));
      component.isLoading = true;

      fixture.detectChanges();

      const loadingElement = fixture.debugElement.query(By.css('[data-testid="loading"]'));
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.nativeElement.textContent).toContain('Loading user details...');
    });
  });

  describe('WHEN user is not found', () => {
    it('THEN should show not found message', () => {
      mockUserManager.getUserById.and.returnValue(of(null));

      fixture.detectChanges();

      expect(mockNotifications.error).toHaveBeenCalledWith('User not found');
      
      const notFoundElement = fixture.debugElement.query(By.css('[data-testid="not-found"]'));
      expect(notFoundElement).toBeTruthy();
      expect(notFoundElement.nativeElement.textContent).toContain('User Not Found');
    });
  });

  describe('WHEN API call fails', () => {
    it('THEN should handle error and show notification', () => {
      const error = new Error('API Error');
      mockUserManager.getUserById.and.returnValue(throwError(() => error));

      fixture.detectChanges();

      expect(mockNotifications.error).toHaveBeenCalledWith('Failed to load user details');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('WHEN route param is missing', () => {
    it('THEN should handle missing user ID', () => {
      mockActivatedRoute.paramMap = of(new Map());

      fixture.detectChanges();

      expect(mockNotifications.error).toHaveBeenCalledWith('Failed to load user details');
    });
  });

  describe('WHEN navigation actions are triggered', () => {
    beforeEach(() => {
      mockUserManager.getUserById.and.returnValue(of(mockUser));
      fixture.detectChanges();
    });

    it('THEN should navigate back when back button clicked', () => {
      const backButton = fixture.debugElement.query(By.css('[data-testid="back-button"]'));
      
      backButton.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    });

    it('THEN should navigate to edit when edit button clicked', () => {
      const editButton = fixture.debugElement.query(By.css('[data-testid="edit-button"]'));
      
      editButton.nativeElement.click();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users', '1', 'edit']);
    });

    it('THEN should handle delete confirmation and navigate back', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      
      const deleteButton = fixture.debugElement.query(By.css('[data-testid="delete-button"]'));
      deleteButton.nativeElement.click();

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete John Doe?');
      expect(mockNotifications.success).toHaveBeenCalledWith('User John Doe deleted successfully');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/users']);
    });

    it('THEN should not delete when confirmation cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      const deleteButton = fixture.debugElement.query(By.css('[data-testid="delete-button"]'));
      deleteButton.nativeElement.click();

      expect(mockNotifications.success).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/users']);
    });
  });

  describe('WHEN component is destroyed', () => {
    it('THEN should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
```

## Module Integration Testing

### Testing Feature Module
```typescript
// user.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { UserListComponent } from './components/user-list.component';
import { UserDetailComponent } from './components/user-detail.component';
import { UserManagerService } from './services/user-manager.service';
import { ApiService } from './services/api.service';

@NgModule({
  declarations: [
    UserListComponent,
    UserDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild([
      { path: '', component: UserListComponent },
      { path: ':id', component: UserDetailComponent }
    ])
  ],
  providers: [
    UserManagerService,
    ApiService
  ]
})
export class UserModule {}
```

```typescript
// user.module.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { UserModule } from './user.module';
import { UserListComponent } from './components/user-list.component';
import { UserDetailComponent } from './components/user-detail.component';
import { UserManagerService } from './services/user-manager.service';
import { NotificationService } from './services/notification.service';

// Mock component for testing routing
@Component({
  template: ''
})
class MockComponent {}

describe('GIVEN UserModule', () => {
  let router: Router;
  let location: Location;
  let mockUserManager: jasmine.SpyObj<UserManagerService>;
  let mockNotifications: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const userManagerSpy = jasmine.createSpyObj('UserManagerService', [
      'loadUsers', 'getUserById', 'createUser'
    ]);
    const notificationsSpy = jasmine.createSpyObj('NotificationService', [
      'success', 'error', 'info'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        UserModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'users', loadChildren: () => UserModule },
          { path: '', redirectTo: '/users', pathMatch: 'full' },
          { path: '**', component: MockComponent }
        ])
      ],
      declarations: [MockComponent],
      providers: [
        { provide: UserManagerService, useValue: userManagerSpy },
        { provide: NotificationService, useValue: notificationsSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    mockUserManager = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
    mockNotifications = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  describe('WHEN module is imported', () => {
    it('THEN should provide all required services', () => {
      const userManagerService = TestBed.inject(UserManagerService);
      const apiService = TestBed.inject(ApiService);

      expect(userManagerService).toBeTruthy();
      expect(apiService).toBeTruthy();
    });

    it('THEN should declare all components', () => {
      const moduleMetadata = UserModule;
      expect(moduleMetadata).toBeTruthy();
    });
  });

  describe('WHEN routing is configured', () => {
    it('THEN should navigate to user list', async () => {
      mockUserManager.loadUsers.and.returnValue(of([]));

      await router.navigate(['/users']);

      expect(location.path()).toBe('/users');
    });

    it('THEN should navigate to user detail', async () => {
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2023-01-01'
      };
      mockUserManager.getUserById.and.returnValue(of(mockUser));

      await router.navigate(['/users', '1']);

      expect(location.path()).toBe('/users/1');
    });

    it('THEN should redirect root to users', async () => {
      mockUserManager.loadUsers.and.returnValue(of([]));

      await router.navigate(['']);

      expect(location.path()).toBe('/users');
    });
  });
});
```

## E2E-Style Integration Testing

### Testing Complete User Flow
```typescript
// integration/user-workflow.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { UserListComponent } from '../components/user-list.component';
import { UserDetailComponent } from '../components/user-detail.component';
import { UserManagerService } from '../services/user-manager.service';
import { NotificationService } from '../services/notification.service';
import { ApiService, User, CreateUserRequest } from '../services/api.service';

@Component({
  template: '<router-outlet></router-outlet>'
})
class TestHostComponent {}

describe('GIVEN User Management Workflow', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let router: Router;
  let location: Location;
  let httpMock: HttpTestingController;
  
  const mockUsers: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: '2023-01-01' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: '2023-01-02' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TestHostComponent,
        UserListComponent,
        UserDetailComponent
      ],
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'users', component: UserListComponent },
          { path: 'users/:id', component: UserDetailComponent },
          { path: '', redirectTo: '/users', pathMatch: 'full' }
        ])
      ],
      providers: [
        UserManagerService,
        ApiService,
        NotificationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('WHEN user navigates through complete workflow', () => {
    it('THEN should load users, create new user, and view details', fakeAsync(() => {
      // Navigate to users list
      router.navigate(['/users']);
      tick();
      fixture.detectChanges();

      // Mock initial users load
      const usersReq = httpMock.expectOne('https://api.example.com/users');
      usersReq.flush({ data: mockUsers, message: 'Success', status: 'ok' });
      tick();
      fixture.detectChanges();

      // Verify users are displayed
      const userElements = fixture.debugElement.queryAll(
        By.css('[data-testid^="user-"]')
      );
      expect(userElements.length).toBe(2);
      expect(location.path()).toBe('/users');

      // Click add user button
      const addButton = fixture.debugElement.query(
        By.css('[data-testid="add-button"]')
      );
      addButton.nativeElement.click();
      fixture.detectChanges();

      // Fill in new user form
      const nameInput = fixture.debugElement.query(
        By.css('[data-testid="name-input"]')
      ).nativeElement;
      const emailInput = fixture.debugElement.query(
        By.css('[data-testid="email-input"]')
      ).nativeElement;

      nameInput.value = 'New User';
      nameInput.dispatchEvent(new Event('input'));
      emailInput.value = 'new@example.com';
      emailInput.dispatchEvent(new Event('input'));
      
      fixture.detectChanges();
      tick();

      // Submit form
      const addUserButton = fixture.debugElement.query(
        By.css('[data-testid="add-user-button"]')
      );
      addUserButton.nativeElement.click();
      tick();

      // Mock create user API call
      const createReq = httpMock.expectOne('https://api.example.com/users');
      expect(createReq.request.method).toBe('POST');
      expect(createReq.request.body).toEqual({ name: 'New User', email: 'new@example.com' });
      
      const newUser: User = { 
        id: '3', 
        name: 'New User', 
        email: 'new@example.com', 
        createdAt: '2023-01-03' 
      };
      createReq.flush({ data: newUser, message: 'User created', status: 'ok' });
      tick();
      fixture.detectChanges();

      // Verify new user appears in list
      const updatedUserElements = fixture.debugElement.queryAll(
        By.css('[data-testid^="user-"]')
      );
      expect(updatedUserElements.length).toBe(3);

      // Click view button for new user
      const viewButton = fixture.debugElement.query(
        By.css('[data-testid="view-user-3"]')
      );
      viewButton.nativeElement.click();
      tick();
      fixture.detectChanges();

      // Mock get user by ID call
      const getUserReq = httpMock.expectOne('https://api.example.com/users/3');
      getUserReq.flush({ data: newUser, message: 'Success', status: 'ok' });
      tick();
      fixture.detectChanges();

      // Verify navigation to user detail
      expect(location.path()).toBe('/users/3');

      // Verify user details are displayed
      const userName = fixture.debugElement.query(
        By.css('[data-testid="user-name"]')
      );
      const userEmail = fixture.debugElement.query(
        By.css('[data-testid="user-email"]')
      );
      
      expect(userName.nativeElement.textContent).toBe('New User');
      expect(userEmail.nativeElement.textContent).toBe('new@example.com');

      // Click back button
      const backButton = fixture.debugElement.query(
        By.css('[data-testid="back-button"]')
      );
      backButton.nativeElement.click();
      tick();
      fixture.detectChanges();

      // Verify navigation back to users list
      expect(location.path()).toBe('/users');
    }));

    it('THEN should handle error states gracefully', fakeAsync(() => {
      // Navigate to users list
      router.navigate(['/users']);
      tick();
      fixture.detectChanges();

      // Mock API error
      const usersReq = httpMock.expectOne('https://api.example.com/users');
      usersReq.flush(
        { message: 'Server error' }, 
        { status: 500, statusText: 'Server Error' }
      );
      tick();
      fixture.detectChanges();

      // Verify error handling
      const emptyState = fixture.debugElement.query(
        By.css('[data-testid="empty-state"]')
      );
      expect(emptyState).toBeTruthy();

      // Navigate to non-existent user
      router.navigate(['/users', '999']);
      tick();
      fixture.detectChanges();

      // Mock user not found
      const getUserReq = httpMock.expectOne('https://api.example.com/users/999');
      getUserReq.flush(
        { message: 'User not found' }, 
        { status: 404, statusText: 'Not Found' }
      );
      tick();
      fixture.detectChanges();

      // Verify not found state
      const notFound = fixture.debugElement.query(
        By.css('[data-testid="not-found"]')
      );
      expect(notFound).toBeTruthy();
    }));
  });
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Service Testing](./service-testing.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)