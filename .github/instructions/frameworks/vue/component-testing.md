# Vue Component Testing

This guide covers comprehensive Vue component testing using Vue Test Utils and modern testing practices.

## Basic Component Testing

### Simple Component Testing
```vue
<!-- components/UserGreeting.vue -->
<template>
  <div data-testid="user-greeting">
    <h1>Hello, {{ name }}!</h1>
    <p v-if="showWelcome">Welcome to our application</p>
    <button @click="$emit('greet')" data-testid="greet-button">
      Say Hello
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  name: string
  showWelcome?: boolean
}

defineProps<Props>()
defineEmits<{
  greet: []
}>()
</script>
```

```typescript
// components/UserGreeting.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import UserGreeting from './UserGreeting.vue'

describe('GIVEN UserGreeting component', () => {
  test('WHEN rendered with name THEN should display greeting', () => {
    const wrapper = mount(UserGreeting, {
      props: {
        name: 'John Doe'
      }
    })

    expect(wrapper.text()).toContain('Hello, John Doe!')
    expect(wrapper.findByTestId('user-greeting')).toBeTruthy()
  })

  test('WHEN showWelcome is true THEN should display welcome message', () => {
    const wrapper = mount(UserGreeting, {
      props: {
        name: 'John',
        showWelcome: true
      }
    })

    expect(wrapper.text()).toContain('Welcome to our application')
  })

  test('WHEN showWelcome is false THEN should not display welcome message', () => {
    const wrapper = mount(UserGreeting, {
      props: {
        name: 'John',
        showWelcome: false
      }
    })

    expect(wrapper.text()).not.toContain('Welcome to our application')
  })

  test('WHEN greet button is clicked THEN should emit greet event', async () => {
    const wrapper = mount(UserGreeting, {
      props: {
        name: 'John'
      }
    })

    await wrapper.find('[data-testid="greet-button"]').trigger('click')

    expect(wrapper.emitted('greet')).toBeTruthy()
    expect(wrapper.emitted('greet')).toHaveLength(1)
  })
})
```

## Testing Component State

### Component with Reactive State
```vue
<!-- components/Counter.vue -->
<template>
  <div data-testid="counter">
    <span data-testid="count">{{ count }}</span>
    <div>
      <button @click="increment" data-testid="increment-btn">+</button>
      <button @click="decrement" data-testid="decrement-btn">-</button>
      <button @click="reset" data-testid="reset-btn">Reset</button>
    </div>
    <div v-if="isEven" data-testid="even-indicator">
      Count is even
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  initialValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: 0
})

const count = ref(props.initialValue)

const isEven = computed(() => count.value % 2 === 0)

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = props.initialValue
}
</script>
```

```typescript
// components/Counter.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import Counter from './Counter.vue'

describe('GIVEN Counter component', () => {
  test('WHEN initialized THEN should show default count', () => {
    const wrapper = mount(Counter)

    expect(wrapper.find('[data-testid="count"]').text()).toBe('0')
    expect(wrapper.find('[data-testid="even-indicator"]')).toBeTruthy()
  })

  test('WHEN initialized with custom value THEN should show that value', () => {
    const wrapper = mount(Counter, {
      props: {
        initialValue: 5
      }
    })

    expect(wrapper.find('[data-testid="count"]').text()).toBe('5')
    expect(wrapper.find('[data-testid="even-indicator"]').exists()).toBe(false)
  })

  test('WHEN increment button is clicked THEN should increase count', async () => {
    const wrapper = mount(Counter)

    await wrapper.find('[data-testid="increment-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="count"]').text()).toBe('1')
    expect(wrapper.find('[data-testid="even-indicator"]').exists()).toBe(false)
  })

  test('WHEN decrement button is clicked THEN should decrease count', async () => {
    const wrapper = mount(Counter, {
      props: { initialValue: 2 }
    })

    await wrapper.find('[data-testid="decrement-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="count"]').text()).toBe('1')
  })

  test('WHEN reset button is clicked THEN should return to initial value', async () => {
    const wrapper = mount(Counter, {
      props: { initialValue: 3 }
    })

    // Change the value
    await wrapper.find('[data-testid="increment-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="count"]').text()).toBe('4')

    // Reset
    await wrapper.find('[data-testid="reset-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="count"]').text()).toBe('3')
  })

  test('WHEN count is even THEN should show even indicator', async () => {
    const wrapper = mount(Counter, {
      props: { initialValue: 1 }
    })

    // Odd number - no indicator
    expect(wrapper.find('[data-testid="even-indicator"]').exists()).toBe(false)

    // Make it even
    await wrapper.find('[data-testid="increment-btn"]').trigger('click')
    expect(wrapper.find('[data-testid="even-indicator"]').exists()).toBe(true)
  })
})
```

## Testing Forms

### Form with Validation
```vue
<!-- components/UserForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" data-testid="user-form">
    <div>
      <label for="name">Name:</label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        data-testid="name-input"
        :class="{ error: errors.name }"
      />
      <span v-if="errors.name" data-testid="name-error">{{ errors.name }}</span>
    </div>

    <div>
      <label for="email">Email:</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        data-testid="email-input"
        :class="{ error: errors.email }"
      />
      <span v-if="errors.email" data-testid="email-error">{{ errors.email }}</span>
    </div>

    <div>
      <label for="age">Age:</label>
      <input
        id="age"
        v-model.number="form.age"
        type="number"
        data-testid="age-input"
        :class="{ error: errors.age }"
      />
      <span v-if="errors.age" data-testid="age-error">{{ errors.age }}</span>
    </div>

    <button
      type="submit"
      :disabled="!isValid || isSubmitting"
      data-testid="submit-btn"
    >
      {{ isSubmitting ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'

interface UserForm {
  name: string
  email: string
  age: number | null
}

interface Errors {
  name?: string
  email?: string
  age?: string
}

const emit = defineEmits<{
  submit: [form: UserForm]
}>()

const form = reactive<UserForm>({
  name: '',
  email: '',
  age: null
})

const isSubmitting = ref(false)

const errors = computed<Errors>(() => {
  const errs: Errors = {}

  if (!form.name.trim()) {
    errs.name = 'Name is required'
  }

  if (!form.email.trim()) {
    errs.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errs.email = 'Email is invalid'
  }

  if (!form.age) {
    errs.age = 'Age is required'
  } else if (form.age < 1 || form.age > 120) {
    errs.age = 'Age must be between 1 and 120'
  }

  return errs
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

const handleSubmit = async () => {
  if (!isValid.value) return

  isSubmitting.value = true
  
  try {
    emit('submit', { ...form })
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

```typescript
// components/UserForm.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect, vi } from 'vitest'
import UserForm from './UserForm.vue'

describe('GIVEN UserForm component', () => {
  test('WHEN form is empty THEN should show validation errors', async () => {
    const wrapper = mount(UserForm)

    // Try to submit empty form
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')

    expect(wrapper.find('[data-testid="name-error"]').text()).toBe('Name is required')
    expect(wrapper.find('[data-testid="email-error"]').text()).toBe('Email is required')
    expect(wrapper.find('[data-testid="age-error"]').text()).toBe('Age is required')
  })

  test('WHEN invalid email is entered THEN should show email error', async () => {
    const wrapper = mount(UserForm)

    await wrapper.find('[data-testid="email-input"]').setValue('invalid-email')

    expect(wrapper.find('[data-testid="email-error"]').text()).toBe('Email is invalid')
  })

  test('WHEN invalid age is entered THEN should show age error', async () => {
    const wrapper = mount(UserForm)

    await wrapper.find('[data-testid="age-input"]').setValue(150)

    expect(wrapper.find('[data-testid="age-error"]').text()).toBe('Age must be between 1 and 120')
  })

  test('WHEN valid form is submitted THEN should emit submit event', async () => {
    const wrapper = mount(UserForm)

    // Fill form with valid data
    await wrapper.find('[data-testid="name-input"]').setValue('John Doe')
    await wrapper.find('[data-testid="email-input"]').setValue('john@example.com')
    await wrapper.find('[data-testid="age-input"]').setValue(30)

    // Submit form
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')?.[0]).toEqual([{
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    }])
  })

  test('WHEN form has errors THEN submit button should be disabled', async () => {
    const wrapper = mount(UserForm)

    const submitBtn = wrapper.find('[data-testid="submit-btn"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()

    // Fill form partially (still has errors)
    await wrapper.find('[data-testid="name-input"]').setValue('John')

    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  test('WHEN valid form is filled THEN submit button should be enabled', async () => {
    const wrapper = mount(UserForm)

    // Fill form completely with valid data
    await wrapper.find('[data-testid="name-input"]').setValue('John Doe')
    await wrapper.find('[data-testid="email-input"]').setValue('john@example.com')
    await wrapper.find('[data-testid="age-input"]').setValue(30)

    const submitBtn = wrapper.find('[data-testid="submit-btn"]')
    expect(submitBtn.attributes('disabled')).toBeUndefined()
  })
})
```

## Testing Slots

### Component with Slots
```vue
<!-- components/Card.vue -->
<template>
  <div class="card" data-testid="card">
    <header v-if="$slots.header" class="card-header" data-testid="card-header">
      <slot name="header" />
    </header>
    
    <main class="card-content" data-testid="card-content">
      <slot />
    </main>
    
    <footer v-if="$slots.footer" class="card-footer" data-testid="card-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
// No script needed for this example
</script>
```

```typescript
// components/Card.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import Card from './Card.vue'

describe('GIVEN Card component', () => {
  test('WHEN default slot is provided THEN should render content', () => {
    const wrapper = mount(Card, {
      slots: {
        default: '<p>Card content</p>'
      }
    })

    expect(wrapper.find('[data-testid="card-content"]').html()).toContain('<p>Card content</p>')
  })

  test('WHEN header slot is provided THEN should render header', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h2>Card Header</h2>',
        default: 'Content'
      }
    })

    expect(wrapper.find('[data-testid="card-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="card-header"]').html()).toContain('<h2>Card Header</h2>')
  })

  test('WHEN footer slot is provided THEN should render footer', () => {
    const wrapper = mount(Card, {
      slots: {
        default: 'Content',
        footer: '<button>Action</button>'
      }
    })

    expect(wrapper.find('[data-testid="card-footer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="card-footer"]').html()).toContain('<button>Action</button>')
  })

  test('WHEN no header slot provided THEN should not render header', () => {
    const wrapper = mount(Card, {
      slots: {
        default: 'Content'
      }
    })

    expect(wrapper.find('[data-testid="card-header"]').exists()).toBe(false)
  })

  test('WHEN no footer slot provided THEN should not render footer', () => {
    const wrapper = mount(Card, {
      slots: {
        default: 'Content'
      }
    })

    expect(wrapper.find('[data-testid="card-footer"]').exists()).toBe(false)
  })

  test('WHEN all slots are provided THEN should render complete card', () => {
    const wrapper = mount(Card, {
      slots: {
        header: '<h2>Header</h2>',
        default: '<p>Content</p>',
        footer: '<button>Footer</button>'
      }
    })

    expect(wrapper.find('[data-testid="card-header"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="card-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="card-footer"]').exists()).toBe(true)
  })
})
```

## Testing Async Components

### Component with Async Operations
```vue
<!-- components/UserProfile.vue -->
<template>
  <div data-testid="user-profile">
    <div v-if="loading" data-testid="loading">Loading...</div>
    <div v-else-if="error" data-testid="error">{{ error }}</div>
    <div v-else-if="user" data-testid="user-data">
      <h2>{{ user.name }}</h2>
      <p>{{ user.email }}</p>
      <button @click="refreshUser" data-testid="refresh-btn">Refresh</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchUser } from '../services/userService'

interface User {
  id: string
  name: string
  email: string
}

interface Props {
  userId: string
}

const props = defineProps<Props>()

const user = ref<User | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const loadUser = async () => {
  loading.value = true
  error.value = null
  
  try {
    user.value = await fetchUser(props.userId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load user'
  } finally {
    loading.value = false
  }
}

const refreshUser = () => {
  loadUser()
}

onMounted(() => {
  loadUser()
})
</script>
```

```typescript
// components/UserProfile.spec.ts
import { mount, flushPromises } from '@vue/test-utils'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import UserProfile from './UserProfile.vue'

// Mock the user service
vi.mock('../services/userService', () => ({
  fetchUser: vi.fn()
}))

import { fetchUser } from '../services/userService'

const mockFetchUser = vi.mocked(fetchUser)

describe('GIVEN UserProfile component', () => {
  beforeEach(() => {
    mockFetchUser.mockClear()
  })

  test('WHEN component mounts THEN should show loading state', () => {
    mockFetchUser.mockImplementation(() => new Promise(() => {})) // Never resolves

    const wrapper = mount(UserProfile, {
      props: {
        userId: '123'
      }
    })

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
  })

  test('WHEN user loads successfully THEN should display user data', async () => {
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    }

    mockFetchUser.mockResolvedValue(mockUser)

    const wrapper = mount(UserProfile, {
      props: {
        userId: '123'
      }
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="user-data"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
    expect(mockFetchUser).toHaveBeenCalledWith('123')
  })

  test('WHEN user fails to load THEN should display error', async () => {
    mockFetchUser.mockRejectedValue(new Error('User not found'))

    const wrapper = mount(UserProfile, {
      props: {
        userId: '123'
      }
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('User not found')
  })

  test('WHEN refresh button is clicked THEN should reload user', async () => {
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    }

    mockFetchUser.mockResolvedValue(mockUser)

    const wrapper = mount(UserProfile, {
      props: {
        userId: '123'
      }
    })

    await flushPromises()

    // Clear previous calls
    mockFetchUser.mockClear()

    // Click refresh
    await wrapper.find('[data-testid="refresh-btn"]').trigger('click')

    expect(mockFetchUser).toHaveBeenCalledWith('123')
  })
})
```

## Testing Conditional Rendering

### Component with Complex Conditionals
```vue
<!-- components/StatusBadge.vue -->
<template>
  <div 
    :class="badgeClasses" 
    data-testid="status-badge"
    :aria-label="ariaLabel"
  >
    <span v-if="showIcon" class="icon" data-testid="status-icon">
      {{ iconText }}
    </span>
    <span class="text" data-testid="status-text">
      {{ displayText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Status = 'active' | 'inactive' | 'pending' | 'error'

interface Props {
  status: Status
  showIcon?: boolean
  customText?: string
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true
})

const badgeClasses = computed(() => [
  'status-badge',
  `status-${props.status}`
])

const iconText = computed(() => {
  const icons = {
    active: '✓',
    inactive: '○',
    pending: '⋯',
    error: '✗'
  }
  return icons[props.status]
})

const displayText = computed(() => {
  if (props.customText) return props.customText
  
  const texts = {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    error: 'Error'
  }
  return texts[props.status]
})

const ariaLabel = computed(() => `Status: ${displayText.value}`)
</script>
```

```typescript
// components/StatusBadge.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect } from 'vitest'
import StatusBadge from './StatusBadge.vue'

describe('GIVEN StatusBadge component', () => {
  test.each([
    ['active', 'Active', '✓'],
    ['inactive', 'Inactive', '○'],
    ['pending', 'Pending', '⋯'],
    ['error', 'Error', '✗']
  ])('WHEN status is %s THEN should display correct text and icon', (status, text, icon) => {
    const wrapper = mount(StatusBadge, {
      props: {
        status: status as any
      }
    })

    expect(wrapper.find('[data-testid="status-text"]').text()).toBe(text)
    expect(wrapper.find('[data-testid="status-icon"]').text()).toBe(icon)
    expect(wrapper.classes()).toContain(`status-${status}`)
  })

  test('WHEN showIcon is false THEN should not render icon', () => {
    const wrapper = mount(StatusBadge, {
      props: {
        status: 'active',
        showIcon: false
      }
    })

    expect(wrapper.find('[data-testid="status-icon"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="status-text"]').exists()).toBe(true)
  })

  test('WHEN customText is provided THEN should use custom text', () => {
    const wrapper = mount(StatusBadge, {
      props: {
        status: 'active',
        customText: 'Online'
      }
    })

    expect(wrapper.find('[data-testid="status-text"]').text()).toBe('Online')
  })

  test('WHEN rendered THEN should have proper accessibility attributes', () => {
    const wrapper = mount(StatusBadge, {
      props: {
        status: 'active'
      }
    })

    expect(wrapper.attributes('aria-label')).toBe('Status: Active')
  })
})
```

## Related Resources
- [Composition API Testing](./composition-api.md)
- [Integration Testing](./integration.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)