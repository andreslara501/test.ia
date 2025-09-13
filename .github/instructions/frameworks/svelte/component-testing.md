# Svelte Component Testing

This guide covers comprehensive testing strategies for Svelte components, including props, events, slots, lifecycle methods, and complex component interactions.

## Basic Component Testing

### Testing Component Props
```svelte
<!-- src/components/UserCard.svelte -->
<script>
  export let user = null;
  export let showEmail = true;
  export let showActions = false;
  export let size = 'medium';
  
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  function handleEdit() {
    dispatch('edit', user);
  }
  
  function handleDelete() {
    dispatch('delete', user);
  }
  
  $: initials = user ? 
    user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
    '';
  
  $: sizeClass = `size-${size}`;
</script>

<div class="user-card {sizeClass}" data-testid="user-card">
  {#if user}
    <div class="avatar" data-testid="avatar">
      {#if user.avatar}
        <img src={user.avatar} alt="{user.name}'s avatar" />
      {:else}
        <div class="initials" data-testid="initials">{initials}</div>
      {/if}
    </div>
    
    <div class="info">
      <h3 class="name" data-testid="name">{user.name}</h3>
      
      {#if showEmail && user.email}
        <p class="email" data-testid="email">{user.email}</p>
      {/if}
      
      {#if user.role}
        <span class="role" data-testid="role">{user.role}</span>
      {/if}
      
      {#if user.lastActive}
        <p class="last-active" data-testid="last-active">
          Last active: {new Date(user.lastActive).toLocaleDateString()}
        </p>
      {/if}
    </div>
    
    {#if showActions}
      <div class="actions" data-testid="actions">
        <button 
          on:click={handleEdit} 
          class="edit-btn"
          data-testid="edit-button"
        >
          Edit
        </button>
        <button 
          on:click={handleDelete} 
          class="delete-btn"
          data-testid="delete-button"
        >
          Delete
        </button>
      </div>
    {/if}
  {:else}
    <div class="empty-state" data-testid="empty-state">
      <p>No user data available</p>
    </div>
  {/if}
</div>

<style>
  .user-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background: white;
    gap: 1rem;
  }
  
  .size-small {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .size-large {
    padding: 1.5rem;
    gap: 1.5rem;
  }
  
  .avatar {
    flex-shrink: 0;
  }
  
  .avatar img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }
  
  .initials {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #4f46e5;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .info {
    flex: 1;
  }
  
  .name {
    margin: 0 0 0.25rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .email {
    margin: 0 0 0.25rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .role {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .last-active {
    margin: 0.25rem 0 0 0;
    color: #9ca3af;
    font-size: 0.75rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .actions button {
    padding: 0.375rem 0.75rem;
    border: 1px solid;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    cursor: pointer;
  }
  
  .edit-btn {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }
  
  .delete-btn {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
  }
  
  .empty-state {
    text-align: center;
    color: #6b7280;
    font-style: italic;
  }
</style>
```

```javascript
// src/components/UserCard.test.js
import { render, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import UserCard from './UserCard.svelte';

describe('GIVEN UserCard component', () => {
  const user = userEvent.setup();
  
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    avatar: 'https://example.com/avatar.jpg',
    lastActive: '2023-12-01T10:00:00Z'
  };

  describe('WHEN rendered without user', () => {
    it('THEN should show empty state', () => {
      const { getByTestId } = render(UserCard);
      
      const emptyState = getByTestId('empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('No user data available');
    });
  });

  describe('WHEN rendered with user data', () => {
    it('THEN should display user information', () => {
      const { getByTestId } = render(UserCard, { user: mockUser });
      
      expect(getByTestId('name')).toHaveTextContent('John Doe');
      expect(getByTestId('email')).toHaveTextContent('john@example.com');
      expect(getByTestId('role')).toHaveTextContent('admin');
      
      const avatar = getByTestId('avatar').querySelector('img');
      expect(avatar).toHaveAttribute('src', mockUser.avatar);
      expect(avatar).toHaveAttribute('alt', "John Doe's avatar");
    });

    it('THEN should show initials when no avatar', () => {
      const userWithoutAvatar = { ...mockUser };
      delete userWithoutAvatar.avatar;
      
      const { getByTestId } = render(UserCard, { user: userWithoutAvatar });
      
      const initials = getByTestId('initials');
      expect(initials).toBeInTheDocument();
      expect(initials).toHaveTextContent('JD');
    });

    it('THEN should format last active date', () => {
      const { getByTestId } = render(UserCard, { user: mockUser });
      
      const lastActive = getByTestId('last-active');
      expect(lastActive).toHaveTextContent('Last active: 12/1/2023');
    });
  });

  describe('WHEN showEmail prop changes', () => {
    it('THEN should hide email when showEmail is false', () => {
      const { queryByTestId } = render(UserCard, { 
        user: mockUser, 
        showEmail: false 
      });
      
      expect(queryByTestId('email')).not.toBeInTheDocument();
    });

    it('THEN should show email when showEmail is true', () => {
      const { getByTestId } = render(UserCard, { 
        user: mockUser, 
        showEmail: true 
      });
      
      expect(getByTestId('email')).toBeInTheDocument();
    });
  });

  describe('WHEN showActions prop changes', () => {
    it('THEN should show actions when showActions is true', () => {
      const { getByTestId } = render(UserCard, { 
        user: mockUser, 
        showActions: true 
      });
      
      const actions = getByTestId('actions');
      expect(actions).toBeInTheDocument();
      expect(getByTestId('edit-button')).toBeInTheDocument();
      expect(getByTestId('delete-button')).toBeInTheDocument();
    });

    it('THEN should hide actions when showActions is false', () => {
      const { queryByTestId } = render(UserCard, { 
        user: mockUser, 
        showActions: false 
      });
      
      expect(queryByTestId('actions')).not.toBeInTheDocument();
    });
  });

  describe('WHEN size prop changes', () => {
    it('THEN should apply small size class', () => {
      const { getByTestId } = render(UserCard, { 
        user: mockUser, 
        size: 'small' 
      });
      
      const card = getByTestId('user-card');
      expect(card).toHaveClass('size-small');
    });

    it('THEN should apply large size class', () => {
      const { getByTestId } = render(UserCard, { 
        user: mockUser, 
        size: 'large' 
      });
      
      const card = getByTestId('user-card');
      expect(card).toHaveClass('size-large');
    });

    it('THEN should apply medium size class by default', () => {
      const { getByTestId } = render(UserCard, { user: mockUser });
      
      const card = getByTestId('user-card');
      expect(card).toHaveClass('size-medium');
    });
  });

  describe('WHEN user interacts with actions', () => {
    it('THEN should dispatch edit event', async () => {
      const mockEdit = vi.fn();
      const { getByTestId, component } = render(UserCard, { 
        user: mockUser, 
        showActions: true 
      });
      
      component.$on('edit', mockEdit);
      
      const editButton = getByTestId('edit-button');
      await user.click(editButton);
      
      expect(mockEdit).toHaveBeenCalledTimes(1);
      expect(mockEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: mockUser
        })
      );
    });

    it('THEN should dispatch delete event', async () => {
      const mockDelete = vi.fn();
      const { getByTestId, component } = render(UserCard, { 
        user: mockUser, 
        showActions: true 
      });
      
      component.$on('delete', mockDelete);
      
      const deleteButton = getByTestId('delete-button');
      await user.click(deleteButton);
      
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: mockUser
        })
      );
    });
  });

  describe('WHEN testing reactive statements', () => {
    it('THEN should calculate initials correctly', () => {
      const userWithLongName = {
        ...mockUser,
        name: 'Alexander Benjamin Christopher'
      };
      delete userWithLongName.avatar;
      
      const { getByTestId } = render(UserCard, { user: userWithLongName });
      
      const initials = getByTestId('initials');
      expect(initials).toHaveTextContent('ABC');
    });

    it('THEN should handle single name', () => {
      const userWithSingleName = {
        ...mockUser,
        name: 'Cher'
      };
      delete userWithSingleName.avatar;
      
      const { getByTestId } = render(UserCard, { user: userWithSingleName });
      
      const initials = getByTestId('initials');
      expect(initials).toHaveTextContent('C');
    });
  });
});
```

## Testing Forms and Input Components

### Complex Form Component
```svelte
<!-- src/components/ContactForm.svelte -->
<script>
  export let initialValues = {};
  export let disabled = false;
  export let loading = false;
  
  import { createEventDispatcher } from 'svelte';
  import { createForm } from './form-utils.js';
  
  const dispatch = createEventDispatcher();
  
  const { form, errors, isValid, reset } = createForm({
    name: initialValues.name || '',
    email: initialValues.email || '',
    message: initialValues.message || '',
    subscribe: initialValues.subscribe || false,
    category: initialValues.category || 'general'
  }, {
    name: (value) => {
      if (!value.trim()) return 'Name is required';
      if (value.length < 2) return 'Name must be at least 2 characters';
      return null;
    },
    email: (value) => {
      if (!value.trim()) return 'Email is required';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return 'Please enter a valid email';
      return null;
    },
    message: (value) => {
      if (!value.trim()) return 'Message is required';
      if (value.length < 10) return 'Message must be at least 10 characters';
      if (value.length > 500) return 'Message must be less than 500 characters';
      return null;
    }
  });
  
  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'sales', label: 'Sales Question' },
    { value: 'feedback', label: 'Feedback' }
  ];
  
  async function handleSubmit() {
    if (!$isValid || disabled || loading) return;
    
    dispatch('submit', {
      formData: $form,
      reset: () => reset()
    });
  }
  
  function handleReset() {
    reset();
    dispatch('reset');
  }
  
  $: submitDisabled = !$isValid || disabled || loading;
</script>

<form on:submit|preventDefault={handleSubmit} data-testid="contact-form">
  <div class="form-group">
    <label for="name">Name *</label>
    <input
      id="name"
      type="text"
      bind:value={$form.name}
      {disabled}
      class:error={$errors.name}
      data-testid="name-input"
    />
    {#if $errors.name}
      <span class="error-message" data-testid="name-error">{$errors.name}</span>
    {/if}
  </div>

  <div class="form-group">
    <label for="email">Email *</label>
    <input
      id="email"
      type="email"
      bind:value={$form.email}
      {disabled}
      class:error={$errors.email}
      data-testid="email-input"
    />
    {#if $errors.email}
      <span class="error-message" data-testid="email-error">{$errors.email}</span>
    {/if}
  </div>

  <div class="form-group">
    <label for="category">Category</label>
    <select
      id="category"
      bind:value={$form.category}
      {disabled}
      data-testid="category-select"
    >
      {#each categories as category}
        <option value={category.value}>{category.label}</option>
      {/each}
    </select>
  </div>

  <div class="form-group">
    <label for="message">Message *</label>
    <textarea
      id="message"
      bind:value={$form.message}
      {disabled}
      rows="4"
      placeholder="Please describe your inquiry..."
      class:error={$errors.message}
      data-testid="message-textarea"
    ></textarea>
    {#if $errors.message}
      <span class="error-message" data-testid="message-error">{$errors.message}</span>
    {/if}
    <small class="char-count" data-testid="char-count">
      {$form.message.length}/500 characters
    </small>
  </div>

  <div class="form-group checkbox-group">
    <label class="checkbox-label">
      <input
        type="checkbox"
        bind:checked={$form.subscribe}
        {disabled}
        data-testid="subscribe-checkbox"
      />
      Subscribe to newsletter
    </label>
  </div>

  <div class="form-actions">
    <button
      type="button"
      on:click={handleReset}
      {disabled}
      data-testid="reset-button"
    >
      Reset
    </button>
    
    <button
      type="submit"
      disabled={submitDisabled}
      data-testid="submit-button"
    >
      {#if loading}
        <span class="spinner"></span>
        Sending...
      {:else}
        Send Message
      {/if}
    </button>
  </div>
</form>

<style>
  form {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 1rem;
  }
  
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  input.error, textarea.error {
    border-color: #ef4444;
  }
  
  .error-message {
    display: block;
    margin-top: 0.25rem;
    color: #ef4444;
    font-size: 0.875rem;
  }
  
  .char-count {
    display: block;
    margin-top: 0.25rem;
    color: #6b7280;
    font-size: 0.75rem;
  }
  
  .checkbox-group {
    margin-top: 1rem;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    font-weight: normal;
    cursor: pointer;
  }
  
  .checkbox-label input[type="checkbox"] {
    width: auto;
    margin-right: 0.5rem;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    border: 1px solid;
    border-radius: 0.375rem;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button[type="button"] {
    background: white;
    border-color: #d1d5db;
    color: #374151;
  }
  
  button[type="submit"] {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
```

```javascript
// src/components/ContactForm.test.js
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm.svelte';

describe('GIVEN ContactForm component', () => {
  const user = userEvent.setup();

  describe('WHEN rendered with default props', () => {
    it('THEN should display all form fields', () => {
      const { getByTestId } = render(ContactForm);
      
      expect(getByTestId('name-input')).toBeInTheDocument();
      expect(getByTestId('email-input')).toBeInTheDocument();
      expect(getByTestId('category-select')).toBeInTheDocument();
      expect(getByTestId('message-textarea')).toBeInTheDocument();
      expect(getByTestId('subscribe-checkbox')).toBeInTheDocument();
      expect(getByTestId('submit-button')).toBeInTheDocument();
      expect(getByTestId('reset-button')).toBeInTheDocument();
    });

    it('THEN should have submit button disabled initially', () => {
      const { getByTestId } = render(ContactForm);
      
      const submitButton = getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('THEN should show character count', () => {
      const { getByTestId } = render(ContactForm);
      
      const charCount = getByTestId('char-count');
      expect(charCount).toHaveTextContent('0/500 characters');
    });
  });

  describe('WHEN rendered with initial values', () => {
    const initialValues = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello world',
      subscribe: true,
      category: 'support'
    };

    it('THEN should populate fields with initial values', () => {
      const { getByTestId } = render(ContactForm, { initialValues });
      
      expect(getByTestId('name-input')).toHaveValue('John Doe');
      expect(getByTestId('email-input')).toHaveValue('john@example.com');
      expect(getByTestId('message-textarea')).toHaveValue('Hello world');
      expect(getByTestId('subscribe-checkbox')).toBeChecked();
      expect(getByTestId('category-select')).toHaveValue('support');
    });
  });

  describe('WHEN user fills out the form', () => {
    it('THEN should update character count', async () => {
      const { getByTestId } = render(ContactForm);
      
      const messageInput = getByTestId('message-textarea');
      const charCount = getByTestId('char-count');
      
      await user.type(messageInput, 'Hello');
      
      expect(charCount).toHaveTextContent('5/500 characters');
    });

    it('THEN should enable submit button when form is valid', async () => {
      const { getByTestId } = render(ContactForm);
      
      const nameInput = getByTestId('name-input');
      const emailInput = getByTestId('email-input');
      const messageInput = getByTestId('message-textarea');
      const submitButton = getByTestId('submit-button');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(messageInput, 'This is a test message');
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('THEN should toggle checkbox state', async () => {
      const { getByTestId } = render(ContactForm);
      
      const checkbox = getByTestId('subscribe-checkbox');
      
      expect(checkbox).not.toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).toBeChecked();
      
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('THEN should change category selection', async () => {
      const { getByTestId } = render(ContactForm);
      
      const categorySelect = getByTestId('category-select');
      
      await user.selectOptions(categorySelect, 'sales');
      expect(categorySelect).toHaveValue('sales');
    });
  });

  describe('WHEN form validation occurs', () => {
    it('THEN should show error for empty name', async () => {
      const { getByTestId } = render(ContactForm);
      
      const nameInput = getByTestId('name-input');
      
      await user.type(nameInput, 'A');
      await user.clear(nameInput);
      
      await waitFor(() => {
        expect(getByTestId('name-error')).toHaveTextContent('Name is required');
      });
    });

    it('THEN should show error for short name', async () => {
      const { getByTestId } = render(ContactForm);
      
      const nameInput = getByTestId('name-input');
      
      await user.type(nameInput, 'A');
      
      await waitFor(() => {
        expect(getByTestId('name-error')).toHaveTextContent('Name must be at least 2 characters');
      });
    });

    it('THEN should show error for invalid email', async () => {
      const { getByTestId } = render(ContactForm);
      
      const emailInput = getByTestId('email-input');
      
      await user.type(emailInput, 'invalid-email');
      
      await waitFor(() => {
        expect(getByTestId('email-error')).toHaveTextContent('Please enter a valid email');
      });
    });

    it('THEN should show error for short message', async () => {
      const { getByTestId } = render(ContactForm);
      
      const messageInput = getByTestId('message-textarea');
      
      await user.type(messageInput, 'Short');
      
      await waitFor(() => {
        expect(getByTestId('message-error')).toHaveTextContent('Message must be at least 10 characters');
      });
    });

    it('THEN should show error for long message', async () => {
      const { getByTestId } = render(ContactForm);
      
      const messageInput = getByTestId('message-textarea');
      const longMessage = 'A'.repeat(501);
      
      await user.type(messageInput, longMessage);
      
      await waitFor(() => {
        expect(getByTestId('message-error')).toHaveTextContent('Message must be less than 500 characters');
      });
    });
  });

  describe('WHEN form is submitted', () => {
    it('THEN should dispatch submit event with form data', async () => {
      const mockSubmit = vi.fn();
      const { getByTestId, component } = render(ContactForm);
      
      component.$on('submit', mockSubmit);
      
      const nameInput = getByTestId('name-input');
      const emailInput = getByTestId('email-input');
      const messageInput = getByTestId('message-textarea');
      const submitButton = getByTestId('submit-button');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(messageInput, 'This is a test message');
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      await user.click(submitButton);
      
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            formData: expect.objectContaining({
              name: 'John Doe',
              email: 'john@example.com',
              message: 'This is a test message',
              subscribe: false,
              category: 'general'
            }),
            reset: expect.any(Function)
          })
        })
      );
    });

    it('THEN should not submit when form is invalid', async () => {
      const mockSubmit = vi.fn();
      const { getByTestId, component } = render(ContactForm);
      
      component.$on('submit', mockSubmit);
      
      const submitButton = getByTestId('submit-button');
      
      await user.click(submitButton);
      
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('WHEN form is reset', () => {
    it('THEN should clear all fields and dispatch reset event', async () => {
      const mockReset = vi.fn();
      const { getByTestId, component } = render(ContactForm);
      
      component.$on('reset', mockReset);
      
      const nameInput = getByTestId('name-input');
      const emailInput = getByTestId('email-input');
      const messageInput = getByTestId('message-textarea');
      const subscribeCheckbox = getByTestId('subscribe-checkbox');
      const resetButton = getByTestId('reset-button');
      
      // Fill form
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(messageInput, 'Test message');
      await user.click(subscribeCheckbox);
      
      // Reset form
      await user.click(resetButton);
      
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(messageInput).toHaveValue('');
      expect(subscribeCheckbox).not.toBeChecked();
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('WHEN component is disabled or loading', () => {
    it('THEN should disable all inputs when disabled prop is true', () => {
      const { getByTestId } = render(ContactForm, { disabled: true });
      
      expect(getByTestId('name-input')).toBeDisabled();
      expect(getByTestId('email-input')).toBeDisabled();
      expect(getByTestId('message-textarea')).toBeDisabled();
      expect(getByTestId('subscribe-checkbox')).toBeDisabled();
      expect(getByTestId('category-select')).toBeDisabled();
      expect(getByTestId('submit-button')).toBeDisabled();
      expect(getByTestId('reset-button')).toBeDisabled();
    });

    it('THEN should show loading state when loading prop is true', () => {
      const { getByTestId } = render(ContactForm, { loading: true });
      
      const submitButton = getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('Sending...');
      expect(submitButton).toBeDisabled();
    });
  });
});
```

## Testing Component Lifecycle

### Component with Lifecycle Methods
```svelte
<!-- src/components/Timer.svelte -->
<script>
  import { onMount, onDestroy, beforeUpdate, afterUpdate } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let duration = 60; // seconds
  export let autoStart = false;
  export let interval = 1000; // milliseconds
  
  const dispatch = createEventDispatcher();
  
  let timeLeft = duration;
  let isRunning = false;
  let intervalId = null;
  let startTime = null;
  let pausedTime = 0;
  
  // Reactive statements
  $: progress = ((duration - timeLeft) / duration) * 100;
  $: isFinished = timeLeft <= 0;
  $: displayTime = formatTime(timeLeft);
  
  // Lifecycle hooks
  onMount(() => {
    dispatch('mounted');
    
    if (autoStart) {
      start();
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  });
  
  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    dispatch('destroyed');
  });
  
  beforeUpdate(() => {
    if (isFinished && isRunning) {
      stop();
      dispatch('finished', { duration, actualTime: Date.now() - startTime });
    }
  });
  
  afterUpdate(() => {
    dispatch('updated', { timeLeft, progress, isRunning });
  });
  
  function start() {
    if (isRunning || isFinished) return;
    
    isRunning = true;
    startTime = Date.now() - pausedTime;
    
    intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      timeLeft = Math.max(0, duration - Math.floor(elapsed / 1000));
    }, interval);
    
    dispatch('started', { timeLeft });
  }
  
  function pause() {
    if (!isRunning) return;
    
    isRunning = false;
    pausedTime = Date.now() - startTime;
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    dispatch('paused', { timeLeft, pausedTime });
  }
  
  function stop() {
    isRunning = false;
    pausedTime = 0;
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    dispatch('stopped', { timeLeft });
  }
  
  function reset() {
    stop();
    timeLeft = duration;
    dispatch('reset', { duration });
  }
  
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div class="timer" data-testid="timer">
  <div class="display">
    <div class="time" data-testid="time-display">{displayTime}</div>
    <div class="progress-bar" data-testid="progress-bar">
      <div 
        class="progress-fill" 
        style="width: {progress}%"
        data-testid="progress-fill"
      ></div>
    </div>
  </div>
  
  <div class="controls">
    {#if !isRunning && !isFinished}
      <button 
        on:click={start} 
        data-testid="start-button"
      >
        {timeLeft === duration ? 'Start' : 'Resume'}
      </button>
    {/if}
    
    {#if isRunning}
      <button 
        on:click={pause} 
        data-testid="pause-button"
      >
        Pause
      </button>
    {/if}
    
    <button 
      on:click={reset} 
      data-testid="reset-button"
      disabled={timeLeft === duration && !isRunning}
    >
      Reset
    </button>
    
    <button 
      on:click={stop} 
      data-testid="stop-button"
      disabled={!isRunning && timeLeft === duration}
    >
      Stop
    </button>
  </div>
  
  {#if isFinished}
    <div class="finished-message" data-testid="finished-message">
      Time's up!
    </div>
  {/if}
</div>

<style>
  .timer {
    max-width: 300px;
    margin: 0 auto;
    padding: 2rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    text-align: center;
  }
  
  .time {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    font-family: 'Courier New', monospace;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  
  .progress-fill {
    height: 100%;
    background: #3b82f6;
    transition: width 0.3s ease;
  }
  
  .controls {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    background: white;
    cursor: pointer;
    font-size: 0.875rem;
  }
  
  button:hover:not(:disabled) {
    background: #f9fafb;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .finished-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 0.25rem;
    color: #92400e;
    font-weight: 500;
  }
</style>
```

```javascript
// src/components/Timer.test.js
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Timer from './Timer.svelte';

// Mock timers
vi.useFakeTimers();

describe('GIVEN Timer component', () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('WHEN component mounts', () => {
    it('THEN should dispatch mounted event', () => {
      const mockMounted = vi.fn();
      const { component } = render(Timer);
      
      component.$on('mounted', mockMounted);
      
      // Re-mount to trigger event (since component is already mounted)
      component.$destroy();
      const { component: newComponent } = render(Timer);
      newComponent.$on('mounted', mockMounted);
      
      expect(mockMounted).toHaveBeenCalledTimes(1);
    });

    it('THEN should start automatically when autoStart is true', () => {
      const mockStarted = vi.fn();
      const { component, getByTestId } = render(Timer, { 
        duration: 10, 
        autoStart: true 
      });
      
      component.$on('started', mockStarted);
      
      expect(mockStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { timeLeft: 10 }
        })
      );
    });

    it('THEN should display initial time correctly', () => {
      const { getByTestId } = render(Timer, { duration: 90 });
      
      const timeDisplay = getByTestId('time-display');
      expect(timeDisplay).toHaveTextContent('01:30');
    });
  });

  describe('WHEN timer is started', () => {
    it('THEN should update time display as time progresses', async () => {
      const { getByTestId } = render(Timer, { duration: 5 });
      
      const startButton = getByTestId('start-button');
      const timeDisplay = getByTestId('time-display');
      
      await user.click(startButton);
      
      expect(timeDisplay).toHaveTextContent('00:05');
      
      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(timeDisplay).toHaveTextContent('00:03');
      });
    });

    it('THEN should update progress bar', async () => {
      const { getByTestId } = render(Timer, { duration: 10 });
      
      const startButton = getByTestId('start-button');
      const progressFill = getByTestId('progress-fill');
      
      await user.click(startButton);
      
      // Advance time by 5 seconds (50% complete)
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(progressFill).toHaveStyle('width: 50%');
      });
    });

    it('THEN should dispatch started event', async () => {
      const mockStarted = vi.fn();
      const { getByTestId, component } = render(Timer, { duration: 10 });
      
      component.$on('started', mockStarted);
      
      const startButton = getByTestId('start-button');
      await user.click(startButton);
      
      expect(mockStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { timeLeft: 10 }
        })
      );
    });
  });

  describe('WHEN timer is paused', () => {
    it('THEN should pause timer and dispatch paused event', async () => {
      const mockPaused = vi.fn();
      const { getByTestId, component } = render(Timer, { duration: 10 });
      
      component.$on('paused', mockPaused);
      
      const startButton = getByTestId('start-button');
      await user.click(startButton);
      
      // Advance time by 3 seconds
      vi.advanceTimersByTime(3000);
      
      const pauseButton = getByTestId('pause-button');
      await user.click(pauseButton);
      
      expect(mockPaused).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { timeLeft: 7, pausedTime: expect.any(Number) }
        })
      );
    });

    it('THEN should show resume button after pause', async () => {
      const { getByTestId } = render(Timer, { duration: 10 });
      
      const startButton = getByTestId('start-button');
      await user.click(startButton);
      
      const pauseButton = getByTestId('pause-button');
      await user.click(pauseButton);
      
      const resumeButton = getByTestId('start-button');
      expect(resumeButton).toHaveTextContent('Resume');
    });
  });

  describe('WHEN timer finishes', () => {
    it('THEN should dispatch finished event and show message', async () => {
      const mockFinished = vi.fn();
      const { getByTestId, component } = render(Timer, { duration: 2 });
      
      component.$on('finished', mockFinished);
      
      const startButton = getByTestId('start-button');
      await user.click(startButton);
      
      // Advance time to finish
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(getByTestId('finished-message')).toBeInTheDocument();
        expect(getByTestId('time-display')).toHaveTextContent('00:00');
      });
      
      expect(mockFinished).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { 
            duration: 2, 
            actualTime: expect.any(Number) 
          }
        })
      );
    });
  });

  describe('WHEN timer is reset', () => {
    it('THEN should reset to initial state and dispatch reset event', async () => {
      const mockReset = vi.fn();
      const { getByTestId, component } = render(Timer, { duration: 10 });
      
      component.$on('reset', mockReset);
      
      const startButton = getByTestId('start-button');
      await user.click(startButton);
      
      // Advance time
      vi.advanceTimersByTime(5000);
      
      const resetButton = getByTestId('reset-button');
      await user.click(resetButton);
      
      expect(getByTestId('time-display')).toHaveTextContent('00:10');
      expect(getByTestId('progress-fill')).toHaveStyle('width: 0%');
      expect(mockReset).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { duration: 10 }
        })
      );
    });
  });

  describe('WHEN component is destroyed', () => {
    it('THEN should clean up intervals and dispatch destroyed event', () => {
      const mockDestroyed = vi.fn();
      const { component } = render(Timer);
      
      component.$on('destroyed', mockDestroyed);
      
      component.$destroy();
      
      expect(mockDestroyed).toHaveBeenCalledTimes(1);
    });
  });

  describe('WHEN testing lifecycle updates', () => {
    it('THEN should dispatch updated event after each update', async () => {
      const mockUpdated = vi.fn();
      const { getByTestId, component } = render(Timer, { duration: 5 });
      
      component.$on('updated', mockUpdated);
      
      const startButton = getByTestId('start-button');
      await user.click(startButton);
      
      // Should have been called for initial render and start
      expect(mockUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            timeLeft: expect.any(Number),
            progress: expect.any(Number),
            isRunning: true
          }
        })
      );
    });
  });
});
```

## Related Resources
- [Store Testing](./stores.md)
- [Integration Testing](./integration.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)