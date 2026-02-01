import { create } from 'zustand'
import type { UnifiedSchema } from '../types/schema'

interface AppState {
  // Input
  url: string
  setUrl: (url: string) => void

  // Pipeline state
  loading: boolean
  error: Error | null
  data: unknown
  schema: UnifiedSchema | null

  // Actions
  startFetch: () => void
  fetchSuccess: (data: unknown, schema: UnifiedSchema) => void
  fetchError: (error: Error) => void
  reset: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  url: '',
  loading: false,
  error: null,
  data: null,
  schema: null,

  setUrl: (url) => set({ url }),
  startFetch: () => set({ loading: true, error: null, data: null, schema: null }),
  fetchSuccess: (data, schema) => set({ loading: false, data, schema, error: null }),
  fetchError: (error) => set({ loading: false, error, data: null, schema: null }),
  reset: () => set({ url: '', loading: false, error: null, data: null, schema: null }),
}))
