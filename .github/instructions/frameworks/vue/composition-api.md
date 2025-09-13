# Vue Composition API Testing

This guide covers testing Vue 3 Composition API features including composables, reactive state, and lifecycle hooks.

## Testing Composables

### Basic Composable Testing
```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const doubleCount = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)
  
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  const reset = () => {
    count.value = initialValue
  }
  
  return {
    count: readonly(count),
    doubleCount,
    isEven,
    increment,
    decrement,
    reset
  }
}
```

```typescript
// composables/useCounter.spec.ts
import { describe, test, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('GIVEN useCounter composable', () => {
  test('WHEN initialized THEN should have default values', () => {
    const { count, doubleCount, isEven } = useCounter()
    
    expect(count.value).toBe(0)
    expect(doubleCount.value).toBe(0)
    expect(isEven.value).toBe(true)
  })

  test('WHEN initialized with custom value THEN should use that value', () => {
    const { count, doubleCount, isEven } = useCounter(5)
    
    expect(count.value).toBe(5)
    expect(doubleCount.value).toBe(10)
    expect(isEven.value).toBe(false)
  })

  test('WHEN increment is called THEN should increase count', () => {
    const { count, increment } = useCounter()
    
    increment()
    
    expect(count.value).toBe(1)
  })

  test('WHEN decrement is called THEN should decrease count', () => {
    const { count, decrement } = useCounter(5)
    
    decrement()
    
    expect(count.value).toBe(4)
  })

  test('WHEN reset is called THEN should return to initial value', () => {
    const { count, increment, reset } = useCounter(3)
    
    increment()
    increment()
    expect(count.value).toBe(5)
    
    reset()
    expect(count.value).toBe(3)
  })

  test('WHEN count changes THEN computed values should update', () => {
    const { count, doubleCount, isEven, increment } = useCounter(2)
    
    expect(doubleCount.value).toBe(4)
    expect(isEven.value).toBe(true)
    
    increment()
    
    expect(doubleCount.value).toBe(6)
    expect(isEven.value).toBe(false)
  })
})
```

## Testing Composables with Dependencies

### Composable with External Dependencies
```typescript
// composables/useApi.ts
import { ref, computed } from 'vue'
import { apiClient } from '../services/apiClient'

interface UseApiOptions {
  immediate?: boolean
}

export function useApi<T>(url: string, options: UseApiOptions = {}) {
  const data = ref<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)
  
  const isReady = computed(() => !loading.value && !error.value)
  
  const execute = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiClient.get(url)
      data.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }
  
  const reset = () => {
    data.value = null
    error.value = null
    loading.value = false
  }
  
  // Auto-execute if immediate is true
  if (options.immediate) {
    execute()
  }
  
  return {
    data: readonly(data),
    error: readonly(error),
    loading: readonly(loading),
    isReady,
    execute,
    reset
  }
}
```

```typescript
// composables/useApi.spec.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useApi } from './useApi'

// Mock the API client
vi.mock('../services/apiClient', () => ({
  apiClient: {
    get: vi.fn()
  }
}))

import { apiClient } from '../services/apiClient'

const mockApiClient = vi.mocked(apiClient)

describe('GIVEN useApi composable', () => {
  beforeEach(() => {
    mockApiClient.get.mockClear()
  })

  test('WHEN initialized THEN should have default state', () => {
    const { data, error, loading, isReady } = useApi('/api/users')
    
    expect(data.value).toBe(null)
    expect(error.value).toBe(null)
    expect(loading.value).toBe(false)
    expect(isReady.value).toBe(true)
  })

  test('WHEN immediate is true THEN should execute automatically', () => {
    mockApiClient.get.mockResolvedValue({ data: { users: [] } })
    
    const { loading } = useApi('/api/users', { immediate: true })
    
    expect(loading.value).toBe(true)
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/users')
  })

  test('WHEN execute is called THEN should fetch data successfully', async () => {
    const mockData = { users: [{ id: 1, name: 'John' }] }
    mockApiClient.get.mockResolvedValue({ data: mockData })
    
    const { data, error, loading, execute } = useApi('/api/users')
    
    const promise = execute()
    
    expect(loading.value).toBe(true)
    
    await promise
    
    expect(loading.value).toBe(false)
    expect(data.value).toEqual(mockData)
    expect(error.value).toBe(null)
  })

  test('WHEN API call fails THEN should set error state', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Network error'))
    
    const { data, error, loading, execute } = useApi('/api/users')
    
    await execute()
    
    expect(loading.value).toBe(false)
    expect(data.value).toBe(null)
    expect(error.value).toBe('Network error')
  })

  test('WHEN reset is called THEN should clear all state', async () => {
    mockApiClient.get.mockResolvedValue({ data: { users: [] } })
    
    const { data, error, loading, execute, reset } = useApi('/api/users')
    
    await execute()
    expect(data.value).not.toBe(null)
    
    reset()
    
    expect(data.value).toBe(null)
    expect(error.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  test('WHEN loading or error exists THEN isReady should be false', async () => {
    mockApiClient.get.mockRejectedValue(new Error('Error'))
    
    const { isReady, execute } = useApi('/api/users')
    
    expect(isReady.value).toBe(true)
    
    const promise = execute()
    expect(isReady.value).toBe(false) // loading = true
    
    await promise
    expect(isReady.value).toBe(false) // error exists
  })
})
```

## Testing Reactive State

### Complex Reactive State Management
```typescript
// composables/useFormState.ts
import { reactive, computed, watch } from 'vue'

interface FormField {
  value: any
  error: string | null
  touched: boolean
}

interface FormState {
  [key: string]: FormField
}

interface ValidationRule {
  required?: boolean
  minLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

interface FormSchema {
  [key: string]: ValidationRule
}

export function useFormState(schema: FormSchema, initialValues: Record<string, any> = {}) {
  const state = reactive<FormState>({})
  
  // Initialize form fields
  Object.keys(schema).forEach(key => {
    state[key] = {
      value: initialValues[key] || '',
      error: null,
      touched: false
    }
  })
  
  const validate = (fieldName: string, value: any): string | null => {
    const rules = schema[fieldName]
    if (!rules) return null
    
    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${fieldName} is required`
    }
    
    if (rules.minLength && value.toString().length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`
    }
    
    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return `${fieldName} format is invalid`
    }
    
    if (rules.custom) {
      return rules.custom(value)
    }
    
    return null
  }
  
  const setValue = (fieldName: string, value: any) => {
    if (state[fieldName]) {
      state[fieldName].value = value
      state[fieldName].touched = true
      state[fieldName].error = validate(fieldName, value)
    }
  }
  
  const touchField = (fieldName: string) => {
    if (state[fieldName]) {
      state[fieldName].touched = true
    }
  }
  
  const validateAll = () => {
    Object.keys(state).forEach(fieldName => {
      state[fieldName].error = validate(fieldName, state[fieldName].value)
      state[fieldName].touched = true
    })
  }
  
  const reset = () => {
    Object.keys(state).forEach(fieldName => {
      state[fieldName].value = initialValues[fieldName] || ''
      state[fieldName].error = null
      state[fieldName].touched = false
    })
  }
  
  const isValid = computed(() => {
    return Object.values(state).every(field => !field.error)
  })
  
  const hasErrors = computed(() => {
    return Object.values(state).some(field => field.error)
  })
  
  const touchedFields = computed(() => {
    return Object.keys(state).filter(key => state[key].touched)
  })
  
  const values = computed(() => {
    const result: Record<string, any> = {}
    Object.keys(state).forEach(key => {
      result[key] = state[key].value
    })
    return result
  })
  
  return {
    state: readonly(state),
    values,
    isValid,
    hasErrors,
    touchedFields,
    setValue,
    touchField,
    validateAll,
    reset
  }
}
```

```typescript
// composables/useFormState.spec.ts
import { describe, test, expect } from 'vitest'
import { useFormState } from './useFormState'

describe('GIVEN useFormState composable', () => {
  const schema = {
    name: { required: true, minLength: 2 },
    email: { required: true, pattern: /\S+@\S+\.\S+/ },
    age: { 
      required: true, 
      custom: (value: number) => {
        if (value < 18) return 'Must be 18 or older'
        if (value > 100) return 'Must be 100 or younger'
        return null
      }
    }
  }

  test('WHEN initialized THEN should create form fields with default values', () => {
    const { state, values, isValid } = useFormState(schema)
    
    expect(state.name.value).toBe('')
    expect(state.email.value).toBe('')
    expect(state.age.value).toBe('')
    expect(values.value).toEqual({ name: '', email: '', age: '' })
    expect(isValid.value).toBe(false) // required fields are empty
  })

  test('WHEN initialized with initial values THEN should use those values', () => {
    const initialValues = { name: 'John', email: 'john@example.com', age: 25 }
    const { values } = useFormState(schema, initialValues)
    
    expect(values.value).toEqual(initialValues)
  })

  test('WHEN setValue is called THEN should update field value and validate', () => {
    const { state, setValue } = useFormState(schema)
    
    setValue('name', 'J')
    
    expect(state.name.value).toBe('J')
    expect(state.name.touched).toBe(true)
    expect(state.name.error).toBe('name must be at least 2 characters')
  })

  test('WHEN valid value is set THEN should clear error', () => {
    const { state, setValue } = useFormState(schema)
    
    setValue('name', 'John Doe')
    
    expect(state.name.value).toBe('John Doe')
    expect(state.name.error).toBe(null)
  })

  test('WHEN required field is empty THEN should show required error', () => {
    const { state, setValue } = useFormState(schema)
    
    setValue('name', '')
    
    expect(state.name.error).toBe('name is required')
  })

  test('WHEN email format is invalid THEN should show pattern error', () => {
    const { state, setValue } = useFormState(schema)
    
    setValue('email', 'invalid-email')
    
    expect(state.email.error).toBe('email format is invalid')
  })

  test('WHEN custom validation fails THEN should show custom error', () => {
    const { state, setValue } = useFormState(schema)
    
    setValue('age', 15)
    
    expect(state.age.error).toBe('Must be 18 or older')
  })

  test('WHEN all fields are valid THEN isValid should be true', () => {
    const { isValid, setValue } = useFormState(schema)
    
    setValue('name', 'John Doe')
    setValue('email', 'john@example.com')
    setValue('age', 25)
    
    expect(isValid.value).toBe(true)
  })

  test('WHEN validateAll is called THEN should validate all fields', () => {
    const { state, validateAll } = useFormState(schema)
    
    validateAll()
    
    expect(state.name.error).toBe('name is required')
    expect(state.email.error).toBe('email is required')
    expect(state.age.error).toBe('age is required')
    expect(state.name.touched).toBe(true)
    expect(state.email.touched).toBe(true)
    expect(state.age.touched).toBe(true)
  })

  test('WHEN reset is called THEN should reset to initial state', () => {
    const { state, setValue, reset } = useFormState(schema, { name: 'Initial' })
    
    setValue('name', 'Changed')
    setValue('email', 'test@example.com')
    
    expect(state.name.value).toBe('Changed')
    expect(state.name.touched).toBe(true)
    
    reset()
    
    expect(state.name.value).toBe('Initial')
    expect(state.name.touched).toBe(false)
    expect(state.name.error).toBe(null)
    expect(state.email.value).toBe('')
  })

  test('WHEN fields have errors THEN hasErrors should be true', () => {
    const { hasErrors, setValue } = useFormState(schema)
    
    expect(hasErrors.value).toBe(false) // no touched fields yet
    
    setValue('name', '')
    
    expect(hasErrors.value).toBe(true)
  })

  test('WHEN touchField is called THEN should mark field as touched', () => {
    const { state, touchField } = useFormState(schema)
    
    expect(state.name.touched).toBe(false)
    
    touchField('name')
    
    expect(state.name.touched).toBe(true)
  })
})
```

## Testing Lifecycle Hooks

### Component with Lifecycle Hooks
```vue
<!-- components/TimerComponent.vue -->
<template>
  <div data-testid="timer">
    <div data-testid="time">{{ formattedTime }}</div>
    <button @click="start" :disabled="isRunning" data-testid="start-btn">Start</button>
    <button @click="pause" :disabled="!isRunning" data-testid="pause-btn">Pause</button>
    <button @click="reset" data-testid="reset-btn">Reset</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const time = ref(0)
const isRunning = ref(false)
let intervalId: number | null = null

const formattedTime = computed(() => {
  const minutes = Math.floor(time.value / 60)
  const seconds = time.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const start = () => {
  if (!isRunning.value) {
    isRunning.value = true
    intervalId = window.setInterval(() => {
      time.value++
    }, 1000)
  }
}

const pause = () => {
  if (isRunning.value && intervalId) {
    isRunning.value = false
    clearInterval(intervalId)
    intervalId = null
  }
}

const reset = () => {
  pause()
  time.value = 0
}

onMounted(() => {
  console.log('Timer component mounted')
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>
```

```typescript
// components/TimerComponent.spec.ts
import { mount } from '@vue/test-utils'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import TimerComponent from './TimerComponent.vue'

describe('GIVEN TimerComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('WHEN component mounts THEN should display initial time', () => {
    const wrapper = mount(TimerComponent)
    
    expect(wrapper.find('[data-testid="time"]').text()).toBe('00:00')
  })

  test('WHEN start button is clicked THEN should start timer', async () => {
    const wrapper = mount(TimerComponent)
    
    await wrapper.find('[data-testid="start-btn"]').trigger('click')
    
    expect(wrapper.find('[data-testid="start-btn"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-testid="pause-btn"]').attributes('disabled')).toBeUndefined()
  })

  test('WHEN timer is running THEN should increment time', async () => {
    const wrapper = mount(TimerComponent)
    
    await wrapper.find('[data-testid="start-btn"]').trigger('click')
    
    // Fast-forward 3 seconds
    vi.advanceTimersByTime(3000)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('[data-testid="time"]').text()).toBe('00:03')
  })

  test('WHEN pause button is clicked THEN should pause timer', async () => {
    const wrapper = mount(TimerComponent)
    
    await wrapper.find('[data-testid="start-btn"]').trigger('click')
    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()
    
    await wrapper.find('[data-testid="pause-btn"]').trigger('click')
    
    const timeBeforePause = wrapper.find('[data-testid="time"]').text()
    
    // Advance time after pause
    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()
    
    // Time should not have changed
    expect(wrapper.find('[data-testid="time"]').text()).toBe(timeBeforePause)
  })

  test('WHEN reset button is clicked THEN should reset timer', async () => {
    const wrapper = mount(TimerComponent)
    
    await wrapper.find('[data-testid="start-btn"]').trigger('click')
    vi.advanceTimersByTime(5000)
    await wrapper.vm.$nextTick()
    
    await wrapper.find('[data-testid="reset-btn"]').trigger('click')
    
    expect(wrapper.find('[data-testid="time"]').text()).toBe('00:00')
    expect(wrapper.find('[data-testid="start-btn"]').attributes('disabled')).toBeUndefined()
  })

  test('WHEN component unmounts THEN should clear interval', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
    
    const wrapper = mount(TimerComponent)
    
    // Start timer to create interval
    wrapper.find('[data-testid="start-btn"]').trigger('click')
    
    // Unmount component
    wrapper.unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  test('WHEN time reaches 60 seconds THEN should display as minutes', async () => {
    const wrapper = mount(TimerComponent)
    
    await wrapper.find('[data-testid="start-btn"]').trigger('click')
    vi.advanceTimersByTime(65000) // 65 seconds
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('[data-testid="time"]').text()).toBe('01:05')
  })
})
```

## Testing Watchers

### Component with Watchers
```typescript
// composables/useSearch.ts
import { ref, watch } from 'vue'
import { debounce } from 'lodash-es'

interface SearchResult {
  id: string
  title: string
  description: string
}

export function useSearch(searchFn: (query: string) => Promise<SearchResult[]>) {
  const query = ref('')
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const performSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      results.value = []
      return
    }
    
    loading.value = true
    error.value = null
    
    try {
      results.value = await searchFn(searchQuery)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Search failed'
      results.value = []
    } finally {
      loading.value = false
    }
  }, 300)
  
  // Watch for query changes
  watch(query, (newQuery) => {
    performSearch(newQuery)
  })
  
  const clearSearch = () => {
    query.value = ''
    results.value = []
    error.value = null
  }
  
  return {
    query,
    results: readonly(results),
    loading: readonly(loading),
    error: readonly(error),
    clearSearch
  }
}
```

```typescript
// composables/useSearch.spec.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useSearch } from './useSearch'

describe('GIVEN useSearch composable', () => {
  const mockSearchFn = vi.fn()
  
  beforeEach(() => {
    mockSearchFn.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('WHEN query changes THEN should trigger search after debounce', async () => {
    mockSearchFn.mockResolvedValue([{ id: '1', title: 'Result 1', description: 'Desc 1' }])
    
    const { query } = useSearch(mockSearchFn)
    
    query.value = 'test query'
    
    // Fast-forward debounce time
    vi.advanceTimersByTime(300)
    await nextTick()
    
    expect(mockSearchFn).toHaveBeenCalledWith('test query')
  })

  test('WHEN query changes rapidly THEN should debounce calls', async () => {
    const { query } = useSearch(mockSearchFn)
    
    query.value = 'test'
    vi.advanceTimersByTime(100)
    
    query.value = 'test query'
    vi.advanceTimersByTime(100)
    
    query.value = 'test query final'
    vi.advanceTimersByTime(300)
    await nextTick()
    
    expect(mockSearchFn).toHaveBeenCalledTimes(1)
    expect(mockSearchFn).toHaveBeenCalledWith('test query final')
  })

  test('WHEN search succeeds THEN should update results', async () => {
    const mockResults = [
      { id: '1', title: 'Result 1', description: 'Desc 1' },
      { id: '2', title: 'Result 2', description: 'Desc 2' }
    ]
    mockSearchFn.mockResolvedValue(mockResults)
    
    const { query, results, loading } = useSearch(mockSearchFn)
    
    query.value = 'test'
    vi.advanceTimersByTime(300)
    
    expect(loading.value).toBe(true)
    
    await nextTick()
    
    expect(loading.value).toBe(false)
    expect(results.value).toEqual(mockResults)
  })

  test('WHEN search fails THEN should set error', async () => {
    mockSearchFn.mockRejectedValue(new Error('Search failed'))
    
    const { query, error, results } = useSearch(mockSearchFn)
    
    query.value = 'test'
    vi.advanceTimersByTime(300)
    await nextTick()
    
    expect(error.value).toBe('Search failed')
    expect(results.value).toEqual([])
  })

  test('WHEN query is empty THEN should clear results without search', async () => {
    const { query, results } = useSearch(mockSearchFn)
    
    query.value = ''
    vi.advanceTimersByTime(300)
    await nextTick()
    
    expect(mockSearchFn).not.toHaveBeenCalled()
    expect(results.value).toEqual([])
  })

  test('WHEN clearSearch is called THEN should reset all state', async () => {
    mockSearchFn.mockResolvedValue([{ id: '1', title: 'Result', description: 'Desc' }])
    
    const { query, results, clearSearch } = useSearch(mockSearchFn)
    
    query.value = 'test'
    vi.advanceTimersByTime(300)
    await nextTick()
    
    expect(results.value).toHaveLength(1)
    
    clearSearch()
    
    expect(query.value).toBe('')
    expect(results.value).toEqual([])
  })
})
```

## Related Resources
- [Component Testing](./component-testing.md)
- [Integration Testing](./integration.md)
- [Mocking Strategies](./mocking.md)
- [Best Practices](../../common/best-practices.md)
- [Testing Principles](../../common/testing-principles.md)