# Svelte Integration Testing

This guide covers integration testing strategies for Svelte applications, including testing component interactions, route navigation, store integration, and end-to-end workflows.

## Component Integration Testing

### Testing Parent-Child Component Interactions
```svelte
<!-- src/components/TaskManager.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import TaskList from './TaskList.svelte';
  import TaskForm from './TaskForm.svelte';
  import TaskFilter from './TaskFilter.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let tasks = [];
  export let loading = false;
  
  let filter = 'all';
  
  $: filteredTasks = filterTasks(tasks, filter);
  
  function filterTasks(tasks, filter) {
    switch (filter) {
      case 'active':
        return tasks.filter(task => !task.completed);
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  }
  
  function handleTaskCreate(event) {
    dispatch('task-create', event.detail);
  }
  
  function handleTaskUpdate(event) {
    dispatch('task-update', event.detail);
  }
  
  function handleTaskDelete(event) {
    dispatch('task-delete', event.detail);
  }
  
  function handleFilterChange(event) {
    filter = event.detail.filter;
  }
</script>

<div class="task-manager" data-testid="task-manager">
  <header>
    <h1>Task Manager</h1>
    <TaskFilter
      {filter}
      on:filter-change={handleFilterChange}
    />
  </header>
  
  <main>
    <TaskForm
      {loading}
      on:task-create={handleTaskCreate}
    />
    
    <TaskList
      tasks={filteredTasks}
      {loading}
      on:task-update={handleTaskUpdate}
      on:task-delete={handleTaskDelete}
    />
    
    {#if filteredTasks.length === 0 && !loading}
      <div class="empty-state" data-testid="empty-state">
        {#if filter === 'all'}
          No tasks yet. Create your first task above!
        {:else if filter === 'active'}
          No active tasks. Great job!
        {:else}
          No completed tasks yet.
        {/if}
      </div>
    {/if}
  </main>
</div>
```

```svelte
<!-- src/components/TaskList.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import TaskItem from './TaskItem.svelte';
  
  const dispatch = createEventDispatcher();
  
  export let tasks = [];
  export let loading = false;
  
  function handleTaskUpdate(event) {
    dispatch('task-update', event.detail);
  }
  
  function handleTaskDelete(event) {
    dispatch('task-delete', event.detail);
  }
</script>

<div class="task-list" data-testid="task-list">
  {#if loading}
    <div class="loading" data-testid="loading">Loading tasks...</div>
  {:else if tasks.length === 0}
    <div class="no-tasks" data-testid="no-tasks">No tasks to display</div>
  {:else}
    <ul class="tasks">
      {#each tasks as task (task.id)}
        <li>
          <TaskItem
            {task}
            on:task-update={handleTaskUpdate}
            on:task-delete={handleTaskDelete}
          />
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

```svelte
<!-- src/components/TaskItem.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let task;
  
  let editing = false;
  let editText = task.text;
  
  function handleToggleComplete() {
    dispatch('task-update', {
      ...task,
      completed: !task.completed,
      updatedAt: new Date()
    });
  }
  
  function handleEdit() {
    editing = true;
    editText = task.text;
  }
  
  function handleSaveEdit() {
    if (editText.trim()) {
      dispatch('task-update', {
        ...task,
        text: editText.trim(),
        updatedAt: new Date()
      });
      editing = false;
    }
  }
  
  function handleCancelEdit() {
    editing = false;
    editText = task.text;
  }
  
  function handleDelete() {
    dispatch('task-delete', task);
  }
  
  function handleKeydown(event) {
    if (event.key === 'Enter') {
      handleSaveEdit();
    } else if (event.key === 'Escape') {
      handleCancelEdit();
    }
  }
</script>

<div class="task-item {task.completed ? 'completed' : ''}" data-testid="task-item">
  <input
    type="checkbox"
    checked={task.completed}
    on:change={handleToggleComplete}
    data-testid="task-checkbox"
  />
  
  {#if editing}
    <input
      type="text"
      bind:value={editText}
      on:keydown={handleKeydown}
      on:blur={handleSaveEdit}
      data-testid="task-edit-input"
      class="edit-input"
      autofocus
    />
  {:else}
    <span
      class="task-text"
      on:dblclick={handleEdit}
      data-testid="task-text"
    >
      {task.text}
    </span>
  {/if}
  
  <div class="task-actions">
    {#if !editing}
      <button
        on:click={handleEdit}
        data-testid="edit-button"
        aria-label="Edit task"
      >
        ✏️
      </button>
    {/if}
    
    <button
      on:click={handleDelete}
      data-testid="delete-button"
      aria-label="Delete task"
    >
      🗑️
    </button>
  </div>
  
  <div class="task-meta">
    <small>Created: {task.createdAt.toLocaleDateString()}</small>
    {#if task.updatedAt && task.updatedAt !== task.createdAt}
      <small>Updated: {task.updatedAt.toLocaleDateString()}</small>
    {/if}
  </div>
</div>
```

```javascript
// src/components/TaskManager.integration.test.js
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import TaskManager from './TaskManager.svelte';

describe('GIVEN TaskManager integration', () => {
  const userSetup = userEvent.setup();
  
  const mockTasks = [
    {
      id: '1',
      text: 'Complete project',
      completed: false,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      id: '2',
      text: 'Review code',
      completed: true,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    },
    {
      id: '3',
      text: 'Deploy application',
      completed: false,
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-03')
    }
  ];

  describe('WHEN rendering with tasks', () => {
    it('THEN should display all tasks by default', () => {
      const { getByTestId, getAllByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      expect(getByTestId('task-manager')).toBeInTheDocument();
      expect(getAllByTestId('task-item')).toHaveLength(3);
    });

    it('THEN should display task details correctly', () => {
      const { getAllByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      const taskItems = getAllByTestId('task-item');
      const taskTexts = getAllByTestId('task-text');
      
      expect(taskTexts[0]).toHaveTextContent('Complete project');
      expect(taskTexts[1]).toHaveTextContent('Review code');
      expect(taskTexts[2]).toHaveTextContent('Deploy application');
      
      // Check completed state
      expect(taskItems[1]).toHaveClass('completed');
      expect(taskItems[0]).not.toHaveClass('completed');
    });
  });

  describe('WHEN filtering tasks', () => {
    it('THEN should show only active tasks when active filter selected', async () => {
      const { getByRole, getAllByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      const activeFilter = getByRole('button', { name: /active/i });
      await userSetup.click(activeFilter);
      
      const taskItems = getAllByTestId('task-item');
      expect(taskItems).toHaveLength(2); // Only non-completed tasks
      
      const taskTexts = getAllByTestId('task-text');
      expect(taskTexts[0]).toHaveTextContent('Complete project');
      expect(taskTexts[1]).toHaveTextContent('Deploy application');
    });

    it('THEN should show only completed tasks when completed filter selected', async () => {
      const { getByRole, getAllByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      const completedFilter = getByRole('button', { name: /completed/i });
      await userSetup.click(completedFilter);
      
      const taskItems = getAllByTestId('task-item');
      expect(taskItems).toHaveLength(1); // Only completed tasks
      
      const taskText = getAllByTestId('task-text')[0];
      expect(taskText).toHaveTextContent('Review code');
    });

    it('THEN should show appropriate empty state messages', async () => {
      const { getByRole, getByTestId } = render(TaskManager, {
        props: { tasks: [mockTasks[1]] } // Only completed task
      });
      
      const activeFilter = getByRole('button', { name: /active/i });
      await userSetup.click(activeFilter);
      
      const emptyState = getByTestId('empty-state');
      expect(emptyState).toHaveTextContent('No active tasks. Great job!');
    });
  });

  describe('WHEN interacting with tasks', () => {
    it('THEN should toggle task completion', async () => {
      const handleTaskUpdate = vi.fn();
      
      const { getAllByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      // Listen for task update events
      const taskManager = getAllByTestId('task-manager')[0];
      taskManager.addEventListener('task-update', handleTaskUpdate);
      
      const firstCheckbox = getAllByTestId('task-checkbox')[0];
      await userSetup.click(firstCheckbox);
      
      await waitFor(() => {
        expect(handleTaskUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              id: '1',
              completed: true,
              updatedAt: expect.any(Date)
            })
          })
        );
      });
    });

    it('THEN should edit task text', async () => {
      const handleTaskUpdate = vi.fn();
      
      const { getAllByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      const taskManager = getAllByTestId('task-manager')[0];
      taskManager.addEventListener('task-update', handleTaskUpdate);
      
      // Double-click to edit
      const firstTaskText = getAllByTestId('task-text')[0];
      await userSetup.dblClick(firstTaskText);
      
      // Find edit input
      const editInput = getAllByTestId('task-edit-input')[0];
      expect(editInput).toBeInTheDocument();
      expect(editInput.value).toBe('Complete project');
      
      // Edit the text
      await userSetup.clear(editInput);
      await userSetup.type(editInput, 'Complete project documentation');
      await userSetup.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(handleTaskUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              id: '1',
              text: 'Complete project documentation',
              updatedAt: expect.any(Date)
            })
          })
        );
      });
    });

    it('THEN should delete task', async () => {
      const handleTaskDelete = vi.fn();
      
      const { getAllByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      const taskManager = getAllByTestId('task-manager')[0];
      taskManager.addEventListener('task-delete', handleTaskDelete);
      
      const firstDeleteButton = getAllByTestId('delete-button')[0];
      await userSetup.click(firstDeleteButton);
      
      await waitFor(() => {
        expect(handleTaskDelete).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: mockTasks[0]
          })
        );
      });
    });

    it('THEN should cancel edit on Escape', async () => {
      const { getAllByTestId, queryByTestId } = render(TaskManager, {
        props: { tasks: mockTasks }
      });
      
      // Start editing
      const firstTaskText = getAllByTestId('task-text')[0];
      await userSetup.dblClick(firstTaskText);
      
      const editInput = getAllByTestId('task-edit-input')[0];
      await userSetup.clear(editInput);
      await userSetup.type(editInput, 'Changed text');
      
      // Cancel with Escape
      await userSetup.keyboard('{Escape}');
      
      // Should exit edit mode without saving
      expect(queryByTestId('task-edit-input')).not.toBeInTheDocument();
      expect(getAllByTestId('task-text')[0]).toHaveTextContent('Complete project');
    });
  });

  describe('WHEN creating new tasks', () => {
    it('THEN should emit task-create event', async () => {
      const handleTaskCreate = vi.fn();
      
      const { getByTestId } = render(TaskManager, {
        props: { tasks: [] }
      });
      
      const taskManager = getByTestId('task-manager');
      taskManager.addEventListener('task-create', handleTaskCreate);
      
      // Find and fill task form (assuming it exists in TaskForm component)
      const taskInput = getByTestId('task-input');
      const submitButton = getByTestId('submit-button');
      
      await userSetup.type(taskInput, 'New task');
      await userSetup.click(submitButton);
      
      await waitFor(() => {
        expect(handleTaskCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              text: 'New task',
              completed: false,
              createdAt: expect.any(Date)
            })
          })
        );
      });
    });
  });

  describe('WHEN loading state changes', () => {
    it('THEN should show loading state in task list', () => {
      const { getByTestId } = render(TaskManager, {
        props: { tasks: mockTasks, loading: true }
      });
      
      expect(getByTestId('loading')).toBeInTheDocument();
      expect(getByTestId('loading')).toHaveTextContent('Loading tasks...');
    });

    it('THEN should disable form when loading', () => {
      const { getByTestId } = render(TaskManager, {
        props: { tasks: [], loading: true }
      });
      
      // Assuming TaskForm disables inputs when loading
      const taskInput = getByTestId('task-input');
      const submitButton = getByTestId('submit-button');
      
      expect(taskInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('WHEN tasks list is empty', () => {
    it('THEN should show appropriate empty state for each filter', async () => {
      const { getByTestId, getByRole } = render(TaskManager, {
        props: { tasks: [] }
      });
      
      // All filter (default)
      expect(getByTestId('empty-state')).toHaveTextContent(
        'No tasks yet. Create your first task above!'
      );
      
      // Active filter
      const activeFilter = getByRole('button', { name: /active/i });
      await userSetup.click(activeFilter);
      
      expect(getByTestId('empty-state')).toHaveTextContent(
        'No active tasks. Great job!'
      );
      
      // Completed filter
      const completedFilter = getByRole('button', { name: /completed/i });
      await userSetup.click(completedFilter);
      
      expect(getByTestId('empty-state')).toHaveTextContent(
        'No completed tasks yet.'
      );
    });
  });
});
```

## Router Integration Testing

### Testing SvelteKit Route Navigation
```javascript
// src/routes/+layout.svelte
<script>
  import { page } from '$app/stores';
  import { user, isAuthenticated } from '../stores/user.js';
  import Navigation from '../components/Navigation.svelte';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Try to restore user session
    const token = localStorage.getItem('authToken');
    if (token) {
      user.fetchProfile();
    }
  });
</script>

<div class="app">
  <Navigation />
  
  <main class="main-content">
    <slot />
  </main>
  
  {#if $page.error}
    <div class="error-page" data-testid="error-page">
      <h1>Error {$page.error.status}</h1>
      <p>{$page.error.message}</p>
    </div>
  {/if}
</div>
```

```svelte
<!-- src/components/Navigation.svelte -->
<script>
  import { page } from '$app/stores';
  import { isAuthenticated, userProfile } from '../stores/user.js';
  import { goto } from '$app/navigation';
  
  $: currentPath = $page.url.pathname;
  
  function handleLogout() {
    user.logout().then(() => {
      goto('/');
    });
  }
</script>

<nav class="navigation" data-testid="navigation">
  <div class="nav-brand">
    <a href="/" data-testid="home-link">MyApp</a>
  </div>
  
  <ul class="nav-links">
    <li>
      <a 
        href="/tasks" 
        data-testid="tasks-link"
        class:active={currentPath === '/tasks'}
      >
        Tasks
      </a>
    </li>
    
    {#if $isAuthenticated}
      <li>
        <a 
          href="/profile" 
          data-testid="profile-link"
          class:active={currentPath === '/profile'}
        >
          Profile ({$userProfile?.name || 'User'})
        </a>
      </li>
      <li>
        <button on:click={handleLogout} data-testid="logout-button">
          Logout
        </button>
      </li>
    {:else}
      <li>
        <a 
          href="/login" 
          data-testid="login-link"
          class:active={currentPath === '/login'}
        >
          Login
        </a>
      </li>
      <li>
        <a 
          href="/register" 
          data-testid="register-link"
          class:active={currentPath === '/register'}
        >
          Register
        </a>
      </li>
    {/if}
  </ul>
</nav>
```

```javascript
// src/routes/tasks/+page.svelte
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { isAuthenticated } from '../../stores/user.js';
  import { tasks, taskActions, isLoading } from '../../stores/tasks.js';
  import TaskManager from '../../components/TaskManager.svelte';
  
  onMount(() => {
    if (!$isAuthenticated) {
      goto('/login');
      return;
    }
    
    taskActions.fetchTasks();
  });
  
  function handleTaskCreate(event) {
    taskActions.createTask(event.detail);
  }
  
  function handleTaskUpdate(event) {
    taskActions.updateTask(event.detail);
  }
  
  function handleTaskDelete(event) {
    taskActions.deleteTask(event.detail.id);
  }
</script>

<svelte:head>
  <title>Tasks - MyApp</title>
  <meta name="description" content="Manage your tasks" />
</svelte:head>

<div class="tasks-page" data-testid="tasks-page">
  <TaskManager
    tasks={$tasks}
    loading={$isLoading}
    on:task-create={handleTaskCreate}
    on:task-update={handleTaskUpdate}
    on:task-delete={handleTaskDelete}
  />
</div>
```

```javascript
// src/routes/tasks/+page.test.js
import { render, waitFor } from '@testing-library/svelte';
import { goto } from '$app/navigation';
import TasksPage from './+page.svelte';
import { isAuthenticated } from '../../stores/user.js';
import { taskActions } from '../../stores/tasks.js';

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(() => () => {}),
    url: { pathname: '/tasks' }
  }
}));

// Mock stores
vi.mock('../../stores/user.js', () => ({
  isAuthenticated: { subscribe: vi.fn() }
}));

vi.mock('../../stores/tasks.js', () => ({
  tasks: { subscribe: vi.fn() },
  isLoading: { subscribe: vi.fn() },
  taskActions: {
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn()
  }
}));

describe('GIVEN TasksPage route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WHEN user is not authenticated', () => {
    beforeEach(() => {
      isAuthenticated.subscribe.mockImplementation(callback => {
        callback(false);
        return () => {};
      });
    });

    it('THEN should redirect to login', async () => {
      render(TasksPage);
      
      await waitFor(() => {
        expect(goto).toHaveBeenCalledWith('/login');
      });
    });

    it('THEN should not fetch tasks', () => {
      render(TasksPage);
      
      expect(taskActions.fetchTasks).not.toHaveBeenCalled();
    });
  });

  describe('WHEN user is authenticated', () => {
    beforeEach(() => {
      isAuthenticated.subscribe.mockImplementation(callback => {
        callback(true);
        return () => {};
      });
    });

    it('THEN should not redirect', () => {
      render(TasksPage);
      
      expect(goto).not.toHaveBeenCalled();
    });

    it('THEN should fetch tasks on mount', () => {
      render(TasksPage);
      
      expect(taskActions.fetchTasks).toHaveBeenCalledTimes(1);
    });

    it('THEN should render tasks page', () => {
      const { getByTestId } = render(TasksPage);
      
      expect(getByTestId('tasks-page')).toBeInTheDocument();
    });
  });

  describe('WHEN task events are triggered', () => {
    beforeEach(() => {
      isAuthenticated.subscribe.mockImplementation(callback => {
        callback(true);
        return () => {};
      });
    });

    it('THEN should handle task creation', async () => {
      const { getByTestId } = render(TasksPage);
      
      const taskManager = getByTestId('task-manager');
      const createEvent = new CustomEvent('task-create', {
        detail: { text: 'New task', completed: false }
      });
      
      taskManager.dispatchEvent(createEvent);
      
      await waitFor(() => {
        expect(taskActions.createTask).toHaveBeenCalledWith({
          text: 'New task',
          completed: false
        });
      });
    });

    it('THEN should handle task updates', async () => {
      const { getByTestId } = render(TasksPage);
      
      const taskManager = getByTestId('task-manager');
      const updateEvent = new CustomEvent('task-update', {
        detail: { id: '1', text: 'Updated task', completed: true }
      });
      
      taskManager.dispatchEvent(updateEvent);
      
      await waitFor(() => {
        expect(taskActions.updateTask).toHaveBeenCalledWith({
          id: '1',
          text: 'Updated task',
          completed: true
        });
      });
    });

    it('THEN should handle task deletion', async () => {
      const { getByTestId } = render(TasksPage);
      
      const taskManager = getByTestId('task-manager');
      const deleteEvent = new CustomEvent('task-delete', {
        detail: { id: '1' }
      });
      
      taskManager.dispatchEvent(deleteEvent);
      
      await waitFor(() => {
        expect(taskActions.deleteTask).toHaveBeenCalledWith('1');
      });
    });
  });
});
```

## Store-Component Integration

### Testing Multiple Store Interactions
```javascript
// src/components/AppShell.integration.test.js
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';

import AppShell from './AppShell.svelte';
import { user, isAuthenticated } from '../stores/user.js';
import { notifications } from '../stores/notifications.js';
import { cartActions, cartSummary } from '../stores/shopping-cart.js';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('GIVEN AppShell integration with multiple stores', () => {
  const userSetup = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset stores
    user.logout();
    notifications.clear();
    cartActions.clear();
    
    // Setup fetch mock
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });
  });

  describe('WHEN user logs in successfully', () => {
    const mockUserData = {
      token: 'mock-token',
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      }
    };

    it('THEN should update user state and show success notification', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });

      const { getByTestId } = render(AppShell);
      
      // Simulate login
      await user.login({
        email: 'john@example.com',
        password: 'password'
      });
      
      await waitFor(() => {
        expect(get(isAuthenticated)).toBe(true);
      });
      
      // Check that notification was added
      const notificationsList = get(notifications);
      expect(notificationsList).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'success',
            message: expect.stringContaining('Welcome')
          })
        ])
      );
    });
  });

  describe('WHEN user performs multiple actions', () => {
    beforeEach(async () => {
      // Login user first
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'mock-token',
          user: { id: '1', name: 'John', email: 'john@example.com' }
        })
      });
      
      await user.login({
        email: 'john@example.com',
        password: 'password'
      });
    });

    it('THEN should handle cart updates and show appropriate notifications', async () => {
      const { getByTestId } = render(AppShell);
      
      // Add items to cart
      cartActions.addItem({
        id: '1',
        name: 'Product 1',
        price: 10
      }, 2);
      
      cartActions.addItem({
        id: '2',
        name: 'Product 2',
        price: 25
      }, 1);
      
      // Check cart summary is updated
      const summary = get(cartSummary);
      expect(summary.itemCount).toBe(3);
      expect(summary.subtotal).toBe(45);
      
      // Apply discount
      cartActions.applyDiscount({
        type: 'percentage',
        value: 10,
        code: 'SAVE10'
      });
      
      const updatedSummary = get(cartSummary);
      expect(updatedSummary.discount).toBe(4.5);
      expect(updatedSummary.savings).toBe(4.5);
      
      // Check discount notification
      const notificationsList = get(notifications);
      expect(notificationsList).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'success',
            message: expect.stringContaining('Discount applied')
          })
        ])
      );
    });

    it('THEN should handle errors gracefully across stores', async () => {
      // Mock API failure
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const { getByTestId } = render(AppShell);
      
      // Try to fetch profile (which will fail)
      try {
        await user.fetchProfile();
      } catch {}
      
      // Check error notification was added
      const notificationsList = get(notifications);
      expect(notificationsList).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('Failed to fetch profile')
          })
        ])
      );
      
      // User should still be authenticated despite profile fetch failure
      expect(get(isAuthenticated)).toBe(true);
    });
  });

  describe('WHEN user logs out', () => {
    beforeEach(async () => {
      // Login and add cart items first
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'mock-token',
          user: { id: '1', name: 'John', email: 'john@example.com' }
        })
      });
      
      await user.login({
        email: 'john@example.com',
        password: 'password'
      });
      
      cartActions.addItem({ id: '1', name: 'Product', price: 10 }, 1);
    });

    it('THEN should clear user data but preserve cart', async () => {
      const { getByTestId } = render(AppShell);
      
      // Mock logout API
      fetch.mockResolvedValueOnce({ ok: true });
      
      await user.logout();
      
      // User should be logged out
      expect(get(isAuthenticated)).toBe(false);
      
      // Cart should be preserved
      const summary = get(cartSummary);
      expect(summary.itemCount).toBe(1);
      
      // Logout notification should be shown
      const notificationsList = get(notifications);
      expect(notificationsList).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'success',
            message: expect.stringContaining('logged out')
          })
        ])
      );
    });
  });

  describe('WHEN multiple store subscriptions are active', () => {
    it('THEN should not cause memory leaks', async () => {
      const { component } = render(AppShell);
      
      // Simulate multiple state changes
      cartActions.addItem({ id: '1', name: 'Product', price: 10 }, 1);
      notifications.add({ type: 'info', message: 'Test' });
      
      // Login
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          token: 'token',
          user: { id: '1', name: 'User', email: 'user@example.com' }
        })
      });
      
      await user.login({ email: 'user@example.com', password: 'pass' });
      
      // Destroy component
      component.$destroy();
      
      // Further store changes should not affect the destroyed component
      cartActions.addItem({ id: '2', name: 'Another Product', price: 5 }, 1);
      notifications.add({ type: 'error', message: 'Error after destroy' });
      
      // No errors should be thrown
      expect(true).toBe(true);
    });
  });

  describe('WHEN testing store reactivity chains', () => {
    it('THEN should update derived stores correctly', async () => {
      const { getByTestId } = render(AppShell);
      
      // Track all cart summary updates
      const summaryUpdates = [];
      const unsubscribe = cartSummary.subscribe(summary => {
        summaryUpdates.push(summary);
      });
      
      // Add item
      cartActions.addItem({ id: '1', name: 'Product', price: 10 }, 1);
      
      // Apply discount
      cartActions.applyDiscount({
        type: 'fixed',
        value: 2,
        code: 'SAVE2'
      });
      
      // Update quantity
      cartActions.updateQuantity('1', 3);
      
      expect(summaryUpdates).toHaveLength(4); // Initial + 3 updates
      
      const finalSummary = summaryUpdates[summaryUpdates.length - 1];
      expect(finalSummary.itemCount).toBe(3);
      expect(finalSummary.subtotal).toBe(30);
      expect(finalSummary.discount).toBe(2);
      expect(finalSummary.total).toBe(30.24); // (30 - 2) * 1.08
      
      unsubscribe();
    });
  });
});
```

## API Integration Testing

### Testing with Mock Service Worker
```javascript
// src/tests/api-integration.test.js
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { render, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

import App from '../App.svelte';
import { user } from '../stores/user.js';
import { taskActions } from '../stores/tasks.js';

// Create MSW server
const server = setupServer(
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body;
    
    if (email === 'test@example.com' && password === 'password') {
      return res(
        ctx.json({
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    );
  }),
  
  rest.post('/api/auth/logout', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
  
  rest.get('/api/user/profile', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader?.includes('mock-jwt-token')) {
      return res(
        ctx.json({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          avatar: 'avatar-url'
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: 'Unauthorized' })
    );
  }),
  
  // Tasks endpoints
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: '1',
          text: 'Complete project',
          completed: false,
          createdAt: '2023-01-01T00:00:00Z'
        },
        {
          id: '2',
          text: 'Review code',
          completed: true,
          createdAt: '2023-01-02T00:00:00Z'
        }
      ])
    );
  }),
  
  rest.post('/api/tasks', (req, res, ctx) => {
    const task = req.body;
    return res(
      ctx.json({
        id: Date.now().toString(),
        ...task,
        createdAt: new Date().toISOString()
      })
    );
  }),
  
  rest.patch('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const updates = req.body;
    
    return res(
      ctx.json({
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      })
    );
  }),
  
  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    return res(ctx.status(204));
  })
);

describe('GIVEN API integration tests', () => {
  const userSetup = userEvent.setup();

  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    user.logout();
  });

  afterAll(() => {
    server.close();
  });

  describe('WHEN performing full authentication flow', () => {
    it('THEN should login, fetch profile, and logout successfully', async () => {
      const { getByTestId, getByRole } = render(App);
      
      // Login
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByRole('button', { name: /login/i });
      
      await userSetup.type(emailInput, 'test@example.com');
      await userSetup.type(passwordInput, 'password');
      await userSetup.click(loginButton);
      
      // Wait for profile to be fetched
      await waitFor(() => {
        expect(getByTestId('user-profile')).toBeInTheDocument();
      });
      
      // Verify profile data
      expect(getByTestId('user-name')).toHaveTextContent('Test User');
      expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
      
      // Logout
      const logoutButton = getByTestId('logout-button');
      await userSetup.click(logoutButton);
      
      await waitFor(() => {
        expect(getByTestId('login-form')).toBeInTheDocument();
      });
    });

    it('THEN should handle login failures', async () => {
      const { getByTestId, getByRole } = render(App);
      
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByRole('button', { name: /login/i });
      
      await userSetup.type(emailInput, 'wrong@example.com');
      await userSetup.type(passwordInput, 'wrongpassword');
      await userSetup.click(loginButton);
      
      await waitFor(() => {
        expect(getByTestId('error-message')).toHaveTextContent(
          'Invalid credentials'
        );
      });
    });
  });

  describe('WHEN performing CRUD operations on tasks', () => {
    beforeEach(async () => {
      // Login first
      await user.login({
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('THEN should fetch, create, update, and delete tasks', async () => {
      const { getByTestId, getAllByTestId } = render(App);
      
      // Navigate to tasks page
      const tasksLink = getByTestId('tasks-link');
      await userSetup.click(tasksLink);
      
      // Wait for tasks to load
      await waitFor(() => {
        expect(getAllByTestId('task-item')).toHaveLength(2);
      });
      
      // Create new task
      const taskInput = getByTestId('task-input');
      const createButton = getByTestId('create-task-button');
      
      await userSetup.type(taskInput, 'New API task');
      await userSetup.click(createButton);
      
      await waitFor(() => {
        expect(getAllByTestId('task-item')).toHaveLength(3);
      });
      
      // Update task
      const firstTaskCheckbox = getAllByTestId('task-checkbox')[0];
      await userSetup.click(firstTaskCheckbox);
      
      await waitFor(() => {
        expect(firstTaskCheckbox).toBeChecked();
      });
      
      // Delete task
      const deleteButton = getAllByTestId('delete-button')[0];
      await userSetup.click(deleteButton);
      
      await waitFor(() => {
        expect(getAllByTestId('task-item')).toHaveLength(2);
      });
    });

    it('THEN should handle API errors gracefully', async () => {
      // Mock API error
      server.use(
        rest.post('/api/tasks', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Internal server error' })
          );
        })
      );
      
      const { getByTestId } = render(App);
      
      const taskInput = getByTestId('task-input');
      const createButton = getByTestId('create-task-button');
      
      await userSetup.type(taskInput, 'This will fail');
      await userSetup.click(createButton);
      
      await waitFor(() => {
        expect(getByTestId('error-notification')).toHaveTextContent(
          'Failed to create task'
        );
      });
    });
  });

  describe('WHEN testing offline scenarios', () => {
    it('THEN should handle network failures', async () => {
      // Mock network error
      server.use(
        rest.get('/api/tasks', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );
      
      const { getByTestId } = render(App);
      
      // Try to fetch tasks
      await taskActions.fetchTasks();
      
      await waitFor(() => {
        expect(getByTestId('error-notification')).toHaveTextContent(
          'Network error'
        );
      });
    });
  });

  describe('WHEN testing concurrent operations', () => {
    it('THEN should handle multiple simultaneous requests', async () => {
      const { getByTestId } = render(App);
      
      // Simulate multiple task creation requests
      const promises = [
        taskActions.createTask({ text: 'Task 1', completed: false }),
        taskActions.createTask({ text: 'Task 2', completed: false }),
        taskActions.createTask({ text: 'Task 3', completed: false })
      ];
      
      await Promise.all(promises);
      
      // All tasks should be created successfully
      await waitFor(() => {
        expect(getAllByTestId('task-item')).toHaveLength(5); // 2 existing + 3 new
      });
    });
  });
});
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Store Testing](./stores.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)