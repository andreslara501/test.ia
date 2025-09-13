# Vue Integration Testing

This guide covers integration testing for Vue applications including Vue Router, Pinia, and multi-component interactions.

## Vue Router Integration

### Testing Router Navigation
```vue
<!-- components/Navigation.vue -->
<template>
  <nav data-testid="navigation">
    <router-link to="/" data-testid="home-link" active-class="active">
      Home
    </router-link>
    <router-link to="/users" data-testid="users-link" active-class="active">
      Users
    </router-link>
    <router-link to="/settings" data-testid="settings-link" active-class="active">
      Settings
    </router-link>
  </nav>
</template>
```

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <Navigation />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navigation from './components/Navigation.vue'
</script>
```

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import UsersPage from '../views/UsersPage.vue'
import SettingsPage from '../views/SettingsPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: HomePage },
    { path: '/users', name: 'Users', component: UsersPage },
    { path: '/settings', name: 'Settings', component: SettingsPage }
  ]
})
```

```typescript
// components/Navigation.spec.ts
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { describe, test, expect } from 'vitest'
import Navigation from './Navigation.vue'

// Create mock components for testing
const HomePage = { template: '<div data-testid="home-page">Home</div>' }
const UsersPage = { template: '<div data-testid="users-page">Users</div>' }
const SettingsPage = { template: '<div data-testid="settings-page">Settings</div>' }

function createTestRouter(initialRoute = '/') {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: HomePage },
      { path: '/users', component: UsersPage },
      { path: '/settings', component: SettingsPage }
    ]
  })
  
  router.push(initialRoute)
  
  return router
}

describe('GIVEN Navigation component', () => {
  test('WHEN on home page THEN home link should be active', async () => {
    const router = createTestRouter('/')
    await router.isReady()
    
    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    })
    
    expect(wrapper.find('[data-testid="home-link"]').classes()).toContain('active')
    expect(wrapper.find('[data-testid="users-link"]').classes()).not.toContain('active')
  })

  test('WHEN navigation link is clicked THEN should navigate to page', async () => {
    const router = createTestRouter('/')
    await router.isReady()
    
    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    })
    
    await wrapper.find('[data-testid="users-link"]').trigger('click')
    await router.isReady()
    
    expect(router.currentRoute.value.path).toBe('/users')
  })

  test('WHEN starting on different route THEN correct link should be active', async () => {
    const router = createTestRouter('/settings')
    await router.isReady()
    
    const wrapper = mount(Navigation, {
      global: {
        plugins: [router]
      }
    })
    
    expect(wrapper.find('[data-testid="settings-link"]').classes()).toContain('active')
    expect(wrapper.find('[data-testid="home-link"]').classes()).not.toContain('active')
  })
})
```

### Testing Route Guards
```typescript
// router/guards.ts
import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated) {
    next()
  } else {
    next('/login')
  }
}

export function requireAdmin(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore()
  
  if (authStore.isAuthenticated && authStore.user?.role === 'admin') {
    next()
  } else {
    next('/unauthorized')
  }
}
```

```typescript
// router/guards.spec.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { requireAuth, requireAdmin } from './guards'

// Mock the auth store
vi.mock('../stores/auth', () => ({
  useAuthStore: vi.fn()
}))

import { useAuthStore } from '../stores/auth'

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('GIVEN route guards', () => {
  const mockTo = {} as any
  const mockFrom = {} as any
  const mockNext = vi.fn()

  beforeEach(() => {
    mockNext.mockClear()
  })

  describe('WHEN requireAuth is called', () => {
    test('AND user is authenticated THEN should call next()', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: null
      } as any)

      requireAuth(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    test('AND user is not authenticated THEN should redirect to login', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null
      } as any)

      requireAuth(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/login')
    })
  })

  describe('WHEN requireAdmin is called', () => {
    test('AND user is admin THEN should call next()', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { role: 'admin' }
      } as any)

      requireAdmin(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith()
    })

    test('AND user is not admin THEN should redirect to unauthorized', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        user: { role: 'user' }
      } as any)

      requireAdmin(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/unauthorized')
    })

    test('AND user is not authenticated THEN should redirect to unauthorized', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: false,
        user: null
      } as any)

      requireAdmin(mockTo, mockFrom, mockNext)

      expect(mockNext).toHaveBeenCalledWith('/unauthorized')
    })
  })
})
```

## Pinia Store Integration

### Testing Pinia Stores
```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../services/authApi'

interface User {
  id: string
  name: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(email, password)
      user.value = response.user
      token.value = response.token
      localStorage.setItem('auth_token', response.token)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    error.value = null
    localStorage.removeItem('auth_token')
  }

  const loadUserFromToken = async () => {
    const savedToken = localStorage.getItem('auth_token')
    if (!savedToken) return

    loading.value = true

    try {
      token.value = savedToken
      const userData = await authApi.getMe()
      user.value = userData
    } catch (err) {
      logout() // Clear invalid token
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    if (!user.value) throw new Error('No user logged in')

    loading.value = true

    try {
      const updatedUser = await authApi.updateProfile(profileData)
      user.value = { ...user.value, ...updatedUser }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Update failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    isAdmin,
    login,
    logout,
    loadUserFromToken,
    updateProfile
  }
})
```

```typescript
// stores/auth.spec.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'

// Mock the auth API
vi.mock('../services/authApi', () => ({
  authApi: {
    login: vi.fn(),
    getMe: vi.fn(),
    updateProfile: vi.fn()
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

import { authApi } from '../services/authApi'

const mockAuthApi = vi.mocked(authApi)

describe('GIVEN auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('WHEN initialized THEN should have default state', () => {
    const store = useAuthStore()

    expect(store.user).toBe(null)
    expect(store.token).toBe(null)
    expect(store.loading).toBe(false)
    expect(store.error).toBe(null)
    expect(store.isAuthenticated).toBe(false)
    expect(store.isAdmin).toBe(false)
  })

  test('WHEN login succeeds THEN should set user and token', async () => {
    const mockResponse = {
      user: { id: '1', name: 'John', email: 'john@example.com', role: 'user' },
      token: 'abc123'
    }
    mockAuthApi.login.mockResolvedValue(mockResponse)

    const store = useAuthStore()

    await store.login('john@example.com', 'password')

    expect(store.user).toEqual(mockResponse.user)
    expect(store.token).toBe(mockResponse.token)
    expect(store.isAuthenticated).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'abc123')
  })

  test('WHEN login fails THEN should set error', async () => {
    mockAuthApi.login.mockRejectedValue(new Error('Invalid credentials'))

    const store = useAuthStore()

    await expect(store.login('john@example.com', 'wrong')).rejects.toThrow('Invalid credentials')

    expect(store.user).toBe(null)
    expect(store.token).toBe(null)
    expect(store.error).toBe('Invalid credentials')
    expect(store.isAuthenticated).toBe(false)
  })

  test('WHEN logout is called THEN should clear all state', async () => {
    // Setup authenticated state
    const mockResponse = {
      user: { id: '1', name: 'John', email: 'john@example.com', role: 'user' },
      token: 'abc123'
    }
    mockAuthApi.login.mockResolvedValue(mockResponse)

    const store = useAuthStore()
    await store.login('john@example.com', 'password')

    // Logout
    store.logout()

    expect(store.user).toBe(null)
    expect(store.token).toBe(null)
    expect(store.error).toBe(null)
    expect(store.isAuthenticated).toBe(false)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
  })

  test('WHEN loadUserFromToken with valid token THEN should load user', async () => {
    const mockUser = { id: '1', name: 'John', email: 'john@example.com', role: 'admin' }
    localStorageMock.getItem.mockReturnValue('saved_token')
    mockAuthApi.getMe.mockResolvedValue(mockUser)

    const store = useAuthStore()

    await store.loadUserFromToken()

    expect(store.token).toBe('saved_token')
    expect(store.user).toEqual(mockUser)
    expect(store.isAdmin).toBe(true)
  })

  test('WHEN loadUserFromToken with invalid token THEN should logout', async () => {
    localStorageMock.getItem.mockReturnValue('invalid_token')
    mockAuthApi.getMe.mockRejectedValue(new Error('Invalid token'))

    const store = useAuthStore()

    await store.loadUserFromToken()

    expect(store.token).toBe(null)
    expect(store.user).toBe(null)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token')
  })

  test('WHEN updateProfile succeeds THEN should update user data', async () => {
    // Setup authenticated state
    const initialUser = { id: '1', name: 'John', email: 'john@example.com', role: 'user' }
    const mockResponse = { user: initialUser, token: 'abc123' }
    mockAuthApi.login.mockResolvedValue(mockResponse)

    const store = useAuthStore()
    await store.login('john@example.com', 'password')

    // Update profile
    const updatedData = { name: 'John Doe' }
    mockAuthApi.updateProfile.mockResolvedValue(updatedData)

    await store.updateProfile(updatedData)

    expect(store.user).toEqual({ ...initialUser, ...updatedData })
  })

  test('WHEN updateProfile without user THEN should throw error', async () => {
    const store = useAuthStore()

    await expect(store.updateProfile({ name: 'John' })).rejects.toThrow('No user logged in')
  })
})
```

## Component-Store Integration

### Testing Components with Pinia
```vue
<!-- components/UserProfile.vue -->
<template>
  <div data-testid="user-profile">
    <div v-if="authStore.loading" data-testid="loading">
      Loading...
    </div>
    
    <div v-else-if="!authStore.isAuthenticated" data-testid="not-authenticated">
      Please log in
    </div>
    
    <div v-else data-testid="user-info">
      <h2>{{ authStore.user.name }}</h2>
      <p>{{ authStore.user.email }}</p>
      <p v-if="authStore.isAdmin" data-testid="admin-badge">Admin</p>
      
      <form @submit.prevent="handleUpdateProfile" data-testid="profile-form">
        <input
          v-model="profileForm.name"
          placeholder="Name"
          data-testid="name-input"
        />
        <button type="submit" :disabled="updating" data-testid="update-btn">
          {{ updating ? 'Updating...' : 'Update' }}
        </button>
      </form>
      
      <div v-if="updateError" data-testid="update-error">
        {{ updateError }}
      </div>
      
      <button @click="authStore.logout" data-testid="logout-btn">
        Logout
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const updating = ref(false)
const updateError = ref<string | null>(null)

const profileForm = reactive({
  name: authStore.user?.name || ''
})

const handleUpdateProfile = async () => {
  updating.value = true
  updateError.value = null
  
  try {
    await authStore.updateProfile({ name: profileForm.name })
  } catch (err) {
    updateError.value = err instanceof Error ? err.message : 'Update failed'
  } finally {
    updating.value = false
  }
}
</script>
```

```typescript
// components/UserProfile.spec.ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import UserProfile from './UserProfile.vue'
import { useAuthStore } from '../stores/auth'

vi.mock('../stores/auth')

const mockUseAuthStore = vi.mocked(useAuthStore)

describe('GIVEN UserProfile component', () => {
  let mockStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    
    mockStore = {
      user: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      logout: vi.fn(),
      updateProfile: vi.fn()
    }
    
    mockUseAuthStore.mockReturnValue(mockStore)
  })

  test('WHEN loading THEN should show loading state', () => {
    mockStore.loading = true
    
    const wrapper = mount(UserProfile)
    
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
  })

  test('WHEN not authenticated THEN should show login prompt', () => {
    mockStore.isAuthenticated = false
    
    const wrapper = mount(UserProfile)
    
    expect(wrapper.find('[data-testid="not-authenticated"]').exists()).toBe(true)
  })

  test('WHEN authenticated THEN should show user info', () => {
    mockStore.isAuthenticated = true
    mockStore.user = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' }
    
    const wrapper = mount(UserProfile)
    
    expect(wrapper.find('[data-testid="user-info"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
  })

  test('WHEN user is admin THEN should show admin badge', () => {
    mockStore.isAuthenticated = true
    mockStore.isAdmin = true
    mockStore.user = { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' }
    
    const wrapper = mount(UserProfile)
    
    expect(wrapper.find('[data-testid="admin-badge"]').exists()).toBe(true)
  })

  test('WHEN profile form is submitted THEN should call updateProfile', async () => {
    mockStore.isAuthenticated = true
    mockStore.user = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' }
    mockStore.updateProfile.mockResolvedValue({})
    
    const wrapper = mount(UserProfile)
    
    await wrapper.find('[data-testid="name-input"]').setValue('Jane Doe')
    await wrapper.find('[data-testid="profile-form"]').trigger('submit')
    
    expect(mockStore.updateProfile).toHaveBeenCalledWith({ name: 'Jane Doe' })
  })

  test('WHEN update fails THEN should show error', async () => {
    mockStore.isAuthenticated = true
    mockStore.user = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' }
    mockStore.updateProfile.mockRejectedValue(new Error('Update failed'))
    
    const wrapper = mount(UserProfile)
    
    await wrapper.find('[data-testid="profile-form"]').trigger('submit')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('[data-testid="update-error"]').text()).toBe('Update failed')
  })

  test('WHEN logout button is clicked THEN should call logout', async () => {
    mockStore.isAuthenticated = true
    mockStore.user = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user' }
    
    const wrapper = mount(UserProfile)
    
    await wrapper.find('[data-testid="logout-btn"]').trigger('click')
    
    expect(mockStore.logout).toHaveBeenCalled()
  })
})
```

## Multi-Component Integration

### Testing Parent-Child Communication
```vue
<!-- components/UserList.vue -->
<template>
  <div data-testid="user-list">
    <UserCard
      v-for="user in users"
      :key="user.id"
      :user="user"
      @edit="handleEditUser"
      @delete="handleDeleteUser"
      data-testid="user-card"
    />
    
    <UserModal
      v-if="editingUser"
      :user="editingUser"
      @save="handleSaveUser"
      @cancel="handleCancelEdit"
      data-testid="user-modal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserCard from './UserCard.vue'
import UserModal from './UserModal.vue'

interface User {
  id: string
  name: string
  email: string
}

interface Props {
  users: User[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  userUpdated: [user: User]
  userDeleted: [userId: string]
}>()

const editingUser = ref<User | null>(null)

const handleEditUser = (user: User) => {
  editingUser.value = { ...user }
}

const handleDeleteUser = (userId: string) => {
  emit('userDeleted', userId)
}

const handleSaveUser = (user: User) => {
  emit('userUpdated', user)
  editingUser.value = null
}

const handleCancelEdit = () => {
  editingUser.value = null
}
</script>
```

```typescript
// components/UserList.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect, vi } from 'vitest'
import UserList from './UserList.vue'

// Mock child components
vi.mock('./UserCard.vue', () => ({
  default: {
    name: 'UserCard',
    props: ['user'],
    emits: ['edit', 'delete'],
    template: `
      <div data-testid="user-card">
        <span>{{ user.name }}</span>
        <button @click="$emit('edit', user)" data-testid="edit-btn">Edit</button>
        <button @click="$emit('delete', user.id)" data-testid="delete-btn">Delete</button>
      </div>
    `
  }
}))

vi.mock('./UserModal.vue', () => ({
  default: {
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
}))

describe('GIVEN UserList component', () => {
  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
  ]

  test('WHEN rendered with users THEN should display user cards', () => {
    const wrapper = mount(UserList, {
      props: { users: mockUsers }
    })

    const userCards = wrapper.findAll('[data-testid="user-card"]')
    expect(userCards).toHaveLength(2)
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Jane Smith')
  })

  test('WHEN edit button is clicked THEN should show modal', async () => {
    const wrapper = mount(UserList, {
      props: { users: mockUsers }
    })

    const firstEditBtn = wrapper.find('[data-testid="edit-btn"]')
    await firstEditBtn.trigger('click')

    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(true)
  })

  test('WHEN delete button is clicked THEN should emit userDeleted', async () => {
    const wrapper = mount(UserList, {
      props: { users: mockUsers }
    })

    const firstDeleteBtn = wrapper.find('[data-testid="delete-btn"]')
    await firstDeleteBtn.trigger('click')

    expect(wrapper.emitted('userDeleted')).toBeTruthy()
    expect(wrapper.emitted('userDeleted')?.[0]).toEqual(['1'])
  })

  test('WHEN modal save is clicked THEN should emit userUpdated and close modal', async () => {
    const wrapper = mount(UserList, {
      props: { users: mockUsers }
    })

    // Open modal
    await wrapper.find('[data-testid="edit-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(true)

    // Save user
    await wrapper.find('[data-testid="save-btn"]').trigger('click')

    expect(wrapper.emitted('userUpdated')).toBeTruthy()
    expect(wrapper.emitted('userUpdated')?.[0]).toEqual([mockUsers[0]])
    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(false)
  })

  test('WHEN modal cancel is clicked THEN should close modal without emitting', async () => {
    const wrapper = mount(UserList, {
      props: { users: mockUsers }
    })

    // Open modal
    await wrapper.find('[data-testid="edit-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(true)

    // Cancel edit
    await wrapper.find('[data-testid="cancel-btn"]').trigger('click')

    expect(wrapper.emitted('userUpdated')).toBeFalsy()
    expect(wrapper.find('[data-testid="user-modal"]').exists()).toBe(false)
  })
})
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Composition API Testing](./composition-api.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)