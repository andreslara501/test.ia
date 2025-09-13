# Vue Mocking Strategies

This guide covers comprehensive mocking strategies for Vue applications using Vue Test Utils, Vitest, and Jest.

## Component Mocking

### Mocking Child Components
```vue
<!-- components/UserDashboard.vue -->
<template>
  <div data-testid="user-dashboard">
    <UserHeader :user="user" @settings="openSettings" />
    <UserStats :stats="userStats" />
    <UserActions 
      :user="user" 
      @edit="editUser" 
      @delete="deleteUser" 
    />
    <UserModal 
      v-if="showModal" 
      :user="editingUser"
      @save="saveUser"
      @cancel="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UserHeader from './UserHeader.vue'
import UserStats from './UserStats.vue'
import UserActions from './UserActions.vue'
import UserModal from './UserModal.vue'

interface User {
  id: string
  name: string
  email: string
  loginCount: number
  lastLogin: Date
}

interface Props {
  user: User
}

const props = defineProps<Props>()

const showModal = ref(false)
const editingUser = ref<User | null>(null)

const userStats = computed(() => ({
  loginCount: props.user.loginCount,
  lastLogin: props.user.lastLogin,
  isActive: props.user.loginCount > 0
}))

const openSettings = () => {
  console.log('Opening settings')
}

const editUser = (user: User) => {
  editingUser.value = { ...user }
  showModal.value = true
}

const deleteUser = (userId: string) => {
  console.log('Deleting user:', userId)
}

const saveUser = (user: User) => {
  console.log('Saving user:', user)
  showModal.value = false
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
}
</script>
```

```typescript
// components/UserDashboard.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect, vi } from 'vitest'
import UserDashboard from './UserDashboard.vue'

// Mock child components
const UserHeaderMock = {
  name: 'UserHeader',
  props: ['user'],
  emits: ['settings'],
  template: `
    <div data-testid="user-header">
      <span>{{ user.name }}</span>
      <button @click="$emit('settings')" data-testid="settings-btn">Settings</button>
    </div>
  `
}

const UserStatsMock = {
  name: 'UserStats',
  props: ['stats'],
  template: `
    <div data-testid="user-stats">
      <span data-testid="login-count">{{ stats.loginCount }}</span>
      <span data-testid="active-status">{{ stats.isActive ? 'Active' : 'Inactive' }}</span>
    </div>
  `
}

const UserActionsMock = {
  name: 'UserActions',
  props: ['user'],
  emits: ['edit', 'delete'],
  template: `
    <div data-testid="user-actions">
      <button @click="$emit('edit', user)" data-testid="edit-btn">Edit</button>
      <button @click="$emit('delete', user.id)" data-testid="delete-btn">Delete</button>
    </div>
  `
}

const UserModalMock = {
  name: 'UserModal',
  props: ['user'],
  emits: ['save', 'cancel'],
  template: `
    <div data-testid="user-modal">
      <button @click="$emit('save', user)" data-testid="save-btn">Save</button>
      <button @click="$emit('cancel')" data-testid="cancel-btn">Cancel</button>
    </div>
  `
}

describe('GIVEN UserDashboard component', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    loginCount: 5,
    lastLogin: new Date('2023-01-15')
  }

  function mountWithMocks(props = {}) {
    return mount(UserDashboard, {
      props: {
        user: mockUser,
        ...props
      },
      global: {
        components: {
          UserHeader: UserHeaderMock,
          UserStats: UserStatsMock,
          UserActions: UserActionsMock,
          UserModal: UserModalMock
        }
      }
    })
  }

  test('WHEN rendered THEN should display user information through child components', () => {
    const wrapper = mountWithMocks()

    expect(wrapper.find('[data-testid="user-header"]').text()).toContain('John Doe')
    expect(wrapper.find('[data-testid="login-count"]').text()).toBe('5')
    expect(wrapper.find('[data-testid="active-status"]').text()).toBe('Active')
  })

  test('WHEN settings button is clicked THEN should handle settings event', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const wrapper = mountWithMocks()

    await wrapper.find('[data-testid="settings-btn"]').trigger('click')

    expect(consoleSpy).toHaveBeenCalledWith('Opening settings')
    consoleSpy.mockRestore()
  })

  test('WHEN edit button is clicked THEN should show modal', async () => {
    const wrapper = mountWithMocks()

    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(false)

    await wrapper.find('[data-testid="edit-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(true)
  })

  test('WHEN modal save is clicked THEN should close modal', async () => {
    const wrapper = mountWithMocks()

    // Open modal
    await wrapper.find('[data-testid="edit-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(true)

    // Save and close
    await wrapper.find('[data-testid="save-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(false)
  })

  test('WHEN delete button is clicked THEN should handle delete', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const wrapper = mountWithMocks()

    await wrapper.find('[data-testid="delete-btn"]').trigger('click')

    expect(consoleSpy).toHaveBeenCalledWith('Deleting user:', '1')
    consoleSpy.mockRestore()
  })
})
```

## Module Mocking

### Mocking External Libraries
```typescript
// services/notificationService.ts
export interface NotificationService {
  success(message: string): void
  error(message: string): void
  warning(message: string): void
}

export const notificationService: NotificationService = {
  success: (message: string) => {
    // Real implementation would show toast/notification
    console.log('Success:', message)
  },
  error: (message: string) => {
    console.error('Error:', message)
  },
  warning: (message: string) => {
    console.warn('Warning:', message)
  }
}
```

```vue
<!-- components/FileUploader.vue -->
<template>
  <div data-testid="file-uploader">
    <input
      type="file"
      @change="handleFileChange"
      :disabled="uploading"
      data-testid="file-input"
    />
    <div v-if="uploading" data-testid="uploading">
      Uploading... {{ uploadProgress }}%
    </div>
    <div v-if="uploadedFile" data-testid="success">
      File uploaded: {{ uploadedFile.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadFile } from '../services/fileService'
import { notificationService } from '../services/notificationService'

interface UploadedFile {
  name: string
  url: string
  size: number
}

const emit = defineEmits<{
  uploaded: [file: UploadedFile]
}>()

const uploading = ref(false)
const uploadProgress = ref(0)
const uploadedFile = ref<UploadedFile | null>(null)

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  uploading.value = true
  uploadProgress.value = 0
  uploadedFile.value = null

  try {
    const result = await uploadFile(file, (progress) => {
      uploadProgress.value = progress
    })
    
    uploadedFile.value = result
    emit('uploaded', result)
    notificationService.success(`File "${file.name}" uploaded successfully!`)
  } catch (error) {
    notificationService.error('Failed to upload file')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}
</script>
```

```typescript
// components/FileUploader.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import FileUploader from './FileUploader.vue'

// Mock external dependencies
vi.mock('../services/fileService', () => ({
  uploadFile: vi.fn()
}))

vi.mock('../services/notificationService', () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}))

import { uploadFile } from '../services/fileService'
import { notificationService } from '../services/notificationService'

const mockUploadFile = vi.mocked(uploadFile)
const mockNotificationService = vi.mocked(notificationService)

describe('GIVEN FileUploader component', () => {
  beforeEach(() => {
    mockUploadFile.mockClear()
    mockNotificationService.success.mockClear()
    mockNotificationService.error.mockClear()
  })

  test('WHEN file is selected and upload succeeds THEN should show success', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    const mockResult = { name: 'test.txt', url: 'https://example.com/file.txt', size: 7 }
    
    // Mock successful upload with progress
    mockUploadFile.mockImplementation((file, onProgress) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          onProgress?.(50)
          setTimeout(() => {
            onProgress?.(100)
            resolve(mockResult)
          }, 50)
        }, 50)
      })
    })

    const wrapper = mount(FileUploader)

    // Simulate file selection
    const fileInput = wrapper.find('[data-testid="file-input"]')
    Object.defineProperty(fileInput.element, 'files', {
      value: [mockFile],
      configurable: true
    })
    
    await fileInput.trigger('change')

    // Should show uploading state
    expect(wrapper.find('[data-testid="uploading"]').exists()).toBe(true)

    // Wait for upload completion
    await new Promise(resolve => setTimeout(resolve, 150))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="success"]').text()).toContain('test.txt')
    expect(wrapper.emitted('uploaded')).toBeTruthy()
    expect(wrapper.emitted('uploaded')?.[0]).toEqual([mockResult])
    expect(mockNotificationService.success).toHaveBeenCalledWith('File "test.txt" uploaded successfully!')
  })

  test('WHEN upload fails THEN should show error notification', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    
    mockUploadFile.mockRejectedValue(new Error('Upload failed'))

    const wrapper = mount(FileUploader)

    const fileInput = wrapper.find('[data-testid="file-input"]')
    Object.defineProperty(fileInput.element, 'files', {
      value: [mockFile],
      configurable: true
    })
    
    await fileInput.trigger('change')
    await wrapper.vm.$nextTick()

    expect(mockNotificationService.error).toHaveBeenCalledWith('Failed to upload file')
    expect(wrapper.find('[data-testid="success"]').exists()).toBe(false)
  })

  test('WHEN uploading THEN file input should be disabled', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
    
    mockUploadFile.mockImplementation(() => new Promise(() => {})) // Never resolves

    const wrapper = mount(FileUploader)

    const fileInput = wrapper.find('[data-testid="file-input"]')
    Object.defineProperty(fileInput.element, 'files', {
      value: [mockFile],
      configurable: true
    })
    
    await fileInput.trigger('change')

    expect(fileInput.attributes('disabled')).toBeDefined()
  })
})
```

## Mocking Composables

### Mocking Custom Composables
```typescript
// composables/useAuth.ts
import { ref, computed } from 'vue'

interface User {
  id: string
  name: string
  email: string
}

const user = ref<User | null>(null)
const token = ref<string | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value)
  
  const login = async (email: string, password: string) => {
    // Authentication logic
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    if (response.ok) {
      const data = await response.json()
      user.value = data.user
      token.value = data.token
      return data
    }
    
    throw new Error('Authentication failed')
  }
  
  const logout = () => {
    user.value = null
    token.value = null
  }
  
  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    login,
    logout
  }
}
```

```vue
<!-- components/LoginForm.vue -->
<template>
  <form @submit.prevent="handleLogin" data-testid="login-form">
    <div v-if="authStore.isAuthenticated" data-testid="authenticated">
      Welcome, {{ authStore.user.name }}!
      <button @click="authStore.logout" data-testid="logout-btn">Logout</button>
    </div>
    
    <div v-else data-testid="login-fields">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        data-testid="email-input"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        data-testid="password-input"
      />
      <button type="submit" :disabled="loading" data-testid="login-btn">
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </div>
    
    <div v-if="error" data-testid="error">{{ error }}</div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const authStore = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async () => {
  loading.value = true
  error.value = null
  
  try {
    await authStore.login(email.value, password.value)
    email.value = ''
    password.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
```

```typescript
// components/LoginForm.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import LoginForm from './LoginForm.vue'

// Mock the useAuth composable
vi.mock('../composables/useAuth', () => ({
  useAuth: vi.fn()
}))

import { useAuth } from '../composables/useAuth'

const mockUseAuth = vi.mocked(useAuth)

describe('GIVEN LoginForm component', () => {
  let mockAuthStore: any

  beforeEach(() => {
    mockAuthStore = {
      user: null,
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn()
    }
    
    mockUseAuth.mockReturnValue(mockAuthStore)
  })

  test('WHEN not authenticated THEN should show login fields', () => {
    const wrapper = mount(LoginForm)

    expect(wrapper.find('[data-testid="login-fields"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="authenticated"]').exists()).toBe(false)
  })

  test('WHEN authenticated THEN should show welcome message', () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: '1', name: 'John Doe', email: 'john@example.com' }

    const wrapper = mount(LoginForm)

    expect(wrapper.find('[data-testid="authenticated"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="login-fields"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Welcome, John Doe!')
  })

  test('WHEN login form is submitted THEN should call auth login', async () => {
    mockAuthStore.login.mockResolvedValue({ user: {}, token: 'abc123' })

    const wrapper = mount(LoginForm)

    await wrapper.find('[data-testid="email-input"]').setValue('john@example.com')
    await wrapper.find('[data-testid="password-input"]').setValue('password123')
    await wrapper.find('[data-testid="login-form"]').trigger('submit')

    expect(mockAuthStore.login).toHaveBeenCalledWith('john@example.com', 'password123')
  })

  test('WHEN login fails THEN should show error message', async () => {
    mockAuthStore.login.mockRejectedValue(new Error('Invalid credentials'))

    const wrapper = mount(LoginForm)

    await wrapper.find('[data-testid="email-input"]').setValue('john@example.com')
    await wrapper.find('[data-testid="password-input"]').setValue('wrong')
    await wrapper.find('[data-testid="login-form"]').trigger('submit')

    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="error"]').text()).toBe('Invalid credentials')
  })

  test('WHEN logout button is clicked THEN should call auth logout', async () => {
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { id: '1', name: 'John Doe', email: 'john@example.com' }

    const wrapper = mount(LoginForm)

    await wrapper.find('[data-testid="logout-btn"]').trigger('click')

    expect(mockAuthStore.logout).toHaveBeenCalled()
  })
})
```

## Mocking Global Properties

### Mocking Vue Router
```vue
<!-- components/NavigationMenu.vue -->
<template>
  <nav data-testid="navigation-menu">
    <button 
      @click="navigateToHome" 
      :class="{ active: isCurrentRoute('/') }"
      data-testid="home-btn"
    >
      Home
    </button>
    <button 
      @click="navigateToProfile" 
      :class="{ active: isCurrentRoute('/profile') }"
      data-testid="profile-btn"
    >
      Profile
    </button>
    <button 
      @click="goBack" 
      data-testid="back-btn"
    >
      Back
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navigateToHome = () => {
  router.push('/')
}

const navigateToProfile = () => {
  router.push('/profile')
}

const goBack = () => {
  router.go(-1)
}

const isCurrentRoute = (path: string) => {
  return route.path === path
}
</script>
```

```typescript
// components/NavigationMenu.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import NavigationMenu from './NavigationMenu.vue'

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn()
}))

import { useRouter, useRoute } from 'vue-router'

const mockUseRouter = vi.mocked(useRouter)
const mockUseRoute = vi.mocked(useRoute)

describe('GIVEN NavigationMenu component', () => {
  let mockRouter: any
  let mockRoute: any

  beforeEach(() => {
    mockRouter = {
      push: vi.fn(),
      go: vi.fn()
    }
    
    mockRoute = {
      path: '/'
    }
    
    mockUseRouter.mockReturnValue(mockRouter)
    mockUseRoute.mockReturnValue(mockRoute)
  })

  test('WHEN home button is clicked THEN should navigate to home', async () => {
    const wrapper = mount(NavigationMenu)

    await wrapper.find('[data-testid="home-btn"]').trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith('/')
  })

  test('WHEN profile button is clicked THEN should navigate to profile', async () => {
    const wrapper = mount(NavigationMenu)

    await wrapper.find('[data-testid="profile-btn"]').trigger('click')

    expect(mockRouter.push).toHaveBeenCalledWith('/profile')
  })

  test('WHEN back button is clicked THEN should go back', async () => {
    const wrapper = mount(NavigationMenu)

    await wrapper.find('[data-testid="back-btn"]').trigger('click')

    expect(mockRouter.go).toHaveBeenCalledWith(-1)
  })

  test('WHEN on home route THEN home button should be active', () => {
    mockRoute.path = '/'
    
    const wrapper = mount(NavigationMenu)

    expect(wrapper.find('[data-testid="home-btn"]').classes()).toContain('active')
    expect(wrapper.find('[data-testid="profile-btn"]').classes()).not.toContain('active')
  })

  test('WHEN on profile route THEN profile button should be active', () => {
    mockRoute.path = '/profile'
    
    const wrapper = mount(NavigationMenu)

    expect(wrapper.find('[data-testid="profile-btn"]').classes()).toContain('active')
    expect(wrapper.find('[data-testid="home-btn"]').classes()).not.toContain('active')
  })
})
```

## Mocking HTTP Requests

### Mocking with MSW (Mock Service Worker)
```typescript
// services/apiClient.ts
export interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

export interface User {
  id: string
  name: string
  email: string
}

export const apiClient = {
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await fetch('/api/users')
    const data = await response.json()
    return {
      data: data.users,
      status: response.status,
      message: data.message || 'Success'
    }
  },

  async createUser(user: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    })
    const data = await response.json()
    return {
      data: data.user,
      status: response.status,
      message: data.message || 'Created'
    }
  }
}
```

```vue
<!-- components/UserManager.vue -->
<template>
  <div data-testid="user-manager">
    <form @submit.prevent="createUser" data-testid="create-form">
      <input
        v-model="newUserName"
        placeholder="Name"
        data-testid="name-input"
        required
      />
      <input
        v-model="newUserEmail"
        type="email"
        placeholder="Email"
        data-testid="email-input"
        required
      />
      <button type="submit" :disabled="creating" data-testid="create-btn">
        {{ creating ? 'Creating...' : 'Create User' }}
      </button>
    </form>

    <div v-if="loading" data-testid="loading">Loading users...</div>
    <div v-else-if="error" data-testid="error">{{ error }}</div>
    <div v-else data-testid="users-list">
      <div 
        v-for="user in users" 
        :key="user.id" 
        :data-testid="`user-${user.id}`"
        class="user-item"
      >
        {{ user.name }} - {{ user.email }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient, type User } from '../services/apiClient'

const users = ref<User[]>([])
const loading = ref(false)
const creating = ref(false)
const error = ref<string | null>(null)

const newUserName = ref('')
const newUserEmail = ref('')

const loadUsers = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await apiClient.getUsers()
    users.value = response.data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load users'
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  creating.value = true
  
  try {
    const response = await apiClient.createUser({
      name: newUserName.value,
      email: newUserEmail.value
    })
    
    users.value.push(response.data)
    newUserName.value = ''
    newUserEmail.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create user'
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>
```

```typescript
// components/UserManager.spec.ts
import { mount, flushPromises } from '@vue/test-utils'
import { describe, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import UserManager from './UserManager.vue'

// Setup MSW server
const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.json({
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
        ],
        message: 'Success'
      })
    )
  }),

  rest.post('/api/users', (req, res, ctx) => {
    const { name, email } = req.body as any
    return res(
      ctx.json({
        user: { id: '3', name, email },
        message: 'Created'
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('GIVEN UserManager component', () => {
  test('WHEN component mounts THEN should load users', async () => {
    const wrapper = mount(UserManager)

    // Should show loading initially
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)

    await flushPromises()

    // Should display users after loading
    expect(wrapper.find('[data-testid="users-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="user-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="user-2"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Jane Smith')
  })

  test('WHEN users API fails THEN should show error', async () => {
    server.use(
      rest.get('/api/users', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }))
      })
    )

    const wrapper = mount(UserManager)

    await flushPromises()

    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Failed to load users')
  })

  test('WHEN create user form is submitted THEN should add new user', async () => {
    const wrapper = mount(UserManager)

    // Wait for initial load
    await flushPromises()

    // Fill form
    await wrapper.find('[data-testid="name-input"]').setValue('New User')
    await wrapper.find('[data-testid="email-input"]').setValue('new@example.com')

    // Submit form
    await wrapper.find('[data-testid="create-form"]').trigger('submit')
    await flushPromises()

    // Should add new user to list
    expect(wrapper.find('[data-testid="user-3"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('New User')
    expect(wrapper.text()).toContain('new@example.com')

    // Form should be cleared
    expect(wrapper.find('[data-testid="name-input"]').element.value).toBe('')
    expect(wrapper.find('[data-testid="email-input"]').element.value).toBe('')
  })

  test('WHEN create user fails THEN should show error', async () => {
    server.use(
      rest.post('/api/users', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ message: 'Validation error' }))
      })
    )

    const wrapper = mount(UserManager)

    await flushPromises()

    await wrapper.find('[data-testid="name-input"]').setValue('Test User')
    await wrapper.find('[data-testid="email-input"]').setValue('test@example.com')
    await wrapper.find('[data-testid="create-form"]').trigger('submit')

    await flushPromises()

    expect(wrapper.find('[data-testid="error"]').text()).toContain('Failed to create user')
  })
})
```

## Mocking Browser APIs

### Mocking localStorage and sessionStorage
```typescript
// composables/useStorage.ts
import { ref, watch, Ref } from 'vue'

type StorageType = 'localStorage' | 'sessionStorage'

export function useStorage<T>(
  key: string,
  defaultValue: T,
  storageType: StorageType = 'localStorage'
) {
  const storage = storageType === 'localStorage' ? localStorage : sessionStorage
  
  const storedValue = storage.getItem(key)
  const initialValue = storedValue ? JSON.parse(storedValue) : defaultValue
  
  const value: Ref<T> = ref(initialValue)
  
  // Watch for changes and save to storage
  watch(value, (newValue) => {
    storage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })
  
  const remove = () => {
    storage.removeItem(key)
    value.value = defaultValue
  }
  
  const clear = () => {
    storage.clear()
    value.value = defaultValue
  }
  
  return {
    value,
    remove,
    clear
  }
}
```

```typescript
// composables/useStorage.spec.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useStorage } from './useStorage'

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })

describe('GIVEN useStorage composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('WHEN initialized with no stored value THEN should use default', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { value } = useStorage('test-key', { count: 0 })
    
    expect(value.value).toEqual({ count: 0 })
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  test('WHEN initialized with stored value THEN should use stored value', () => {
    const storedData = { count: 5 }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedData))
    
    const { value } = useStorage('test-key', { count: 0 })
    
    expect(value.value).toEqual(storedData)
  })

  test('WHEN value changes THEN should save to localStorage', async () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { value } = useStorage('test-key', { count: 0 })
    
    value.value = { count: 10 }
    
    await nextTick()
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify({ count: 10 })
    )
  })

  test('WHEN using sessionStorage THEN should use sessionStorage', () => {
    sessionStorageMock.getItem.mockReturnValue(null)
    
    const { value } = useStorage('test-key', { count: 0 }, 'sessionStorage')
    
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  test('WHEN remove is called THEN should remove from storage and reset value', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ count: 5 }))
    
    const { value, remove } = useStorage('test-key', { count: 0 })
    
    expect(value.value).toEqual({ count: 5 })
    
    remove()
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
    expect(value.value).toEqual({ count: 0 })
  })

  test('WHEN clear is called THEN should clear storage and reset value', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ count: 5 }))
    
    const { value, clear } = useStorage('test-key', { count: 0 })
    
    clear()
    
    expect(localStorageMock.clear).toHaveBeenCalled()
    expect(value.value).toEqual({ count: 0 })
  })
})
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Composition API Testing](./composition-api.md)
- [Integration Testing](./integration.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)