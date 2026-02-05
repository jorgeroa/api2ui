import { create } from 'zustand'
import type { UnifiedSchema } from '../types/schema'
import type { ParsedSpec } from '../services/openapi/types'

interface AppState {
  // Input
  url: string
  setUrl: (url: string) => void

  // Pipeline state
  loading: boolean
  error: Error | null
  data: unknown
  schema: UnifiedSchema | null

  // OpenAPI state
  parsedSpec: ParsedSpec | null
  selectedOperationIndex: number
  parameterValues: Record<string, string>

  // Actions
  startFetch: () => void
  fetchSuccess: (data: unknown, schema: UnifiedSchema) => void
  fetchError: (error: Error) => void
  reset: () => void

  // OpenAPI actions
  clearSpec: () => void
  specSuccess: (spec: ParsedSpec) => void
  setSelectedOperation: (index: number) => void
  setParameterValue: (name: string, value: string) => void
  clearParameters: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  url: '',
  loading: false,
  error: null,
  data: null,
  schema: null,
  parsedSpec: null,
  selectedOperationIndex: 0,
  parameterValues: {},

  setUrl: (url) => set({ url }),
  startFetch: () => set({ loading: true, error: null, data: null, schema: null }),
  fetchSuccess: (data, schema) => set({ loading: false, data, schema, error: null }),
  fetchError: (error) => set({ loading: false, error, data: null, schema: null }),
  reset: () => set({
    url: '',
    loading: false,
    error: null,
    data: null,
    schema: null,
    parsedSpec: null,
    selectedOperationIndex: 0,
    parameterValues: {}
  }),

  // OpenAPI actions
  clearSpec: () => set({
    parsedSpec: null,
    selectedOperationIndex: 0,
    parameterValues: {},
  }),
  specSuccess: (spec) => set({
    parsedSpec: spec,
    selectedOperationIndex: 0,
    parameterValues: {},
    loading: false,
    error: null
  }),
  setSelectedOperation: (index) => set({
    selectedOperationIndex: index,
    parameterValues: {},
    data: null,
    schema: null
  }),
  setParameterValue: (name, value) => set((state) => ({
    parameterValues: { ...state.parameterValues, [name]: value }
  })),
  clearParameters: () => set({ parameterValues: {} }),
}))
