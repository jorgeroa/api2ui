import { create } from 'zustand'
import type { UnifiedSchema, SemanticMetadata } from '../types/schema'
import type { ParsedSpec } from '../services/openapi/types'
import type { ImportanceScore, GroupingResult } from '../services/analysis/types'
import type { ComponentSelection } from '../services/selection/types'

interface AnalysisCacheEntry {
  semantics: Map<string, SemanticMetadata>
  importance: Map<string, ImportanceScore>
  selection: ComponentSelection | null
  grouping: GroupingResult | null
}

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

  // Analysis cache (run once per API response)
  analysisCache: Map<string, AnalysisCacheEntry>
  setAnalysisCache: (path: string, data: AnalysisCacheEntry) => void
  getAnalysisCache: (path: string) => AnalysisCacheEntry | null
  clearAnalysisCache: () => void

  // Tab selection memory (session-only, keyed by path)
  tabSelections: Map<string, number>
  setTabSelection: (path: string, index: number) => void
  getTabSelection: (path: string) => number

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

export const useAppStore = create<AppState>()((set, get) => ({
  url: '',
  loading: false,
  error: null,
  data: null,
  schema: null,
  parsedSpec: null,
  selectedOperationIndex: 0,
  parameterValues: {},
  analysisCache: new Map(),
  tabSelections: new Map(),

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
    parameterValues: {},
    analysisCache: new Map()
  }),

  // Analysis cache actions
  setAnalysisCache: (path, data) => set((state) => {
    const newCache = new Map(state.analysisCache)
    newCache.set(path, data)
    return { analysisCache: newCache }
  }),
  getAnalysisCache: (path) => {
    const cache = get().analysisCache
    return cache.get(path) ?? null
  },
  clearAnalysisCache: () => set({ analysisCache: new Map() }),

  // Tab selection memory
  setTabSelection: (path, index) => set((state) => {
    const newSelections = new Map(state.tabSelections)
    newSelections.set(path, index)
    return { tabSelections: newSelections }
  }),
  getTabSelection: (path) => get().tabSelections.get(path) ?? 0,

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
