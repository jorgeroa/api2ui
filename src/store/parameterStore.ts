import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ParameterState {
  // endpoint -> param name -> value
  values: Record<string, Record<string, string>>
  // endpoint -> param name -> user-overridden type (when inference is wrong)
  typeOverrides: Record<string, Record<string, string>>
}

interface ParameterStore extends ParameterState {
  // Value operations
  getValues: (endpoint: string) => Record<string, string>
  getValue: (endpoint: string, name: string) => string | undefined
  setValue: (endpoint: string, name: string, value: string) => void
  setValues: (endpoint: string, values: Record<string, string>) => void
  clearValue: (endpoint: string, name: string) => void
  clearEndpoint: (endpoint: string) => void

  // Type override operations
  getTypeOverride: (endpoint: string, name: string) => string | undefined
  setTypeOverride: (endpoint: string, name: string, type: string) => void
}

export const useParameterStore = create<ParameterStore>()(
  persist(
    (set, get) => ({
      // State
      values: {},
      typeOverrides: {},

      // Value operations
      getValues: (endpoint) => {
        const state = get()
        return state.values[endpoint] ?? {}
      },

      getValue: (endpoint, name) => {
        const state = get()
        return state.values[endpoint]?.[name]
      },

      setValue: (endpoint, name, value) =>
        set((state) => ({
          values: {
            ...state.values,
            [endpoint]: {
              ...state.values[endpoint],
              [name]: value,
            },
          },
        })),

      setValues: (endpoint, values) =>
        set((state) => ({
          values: {
            ...state.values,
            [endpoint]: {
              ...state.values[endpoint],
              ...values,
            },
          },
        })),

      clearValue: (endpoint, name) =>
        set((state) => {
          const endpointValues = state.values[endpoint]
          if (!endpointValues) return state

          const { [name]: _, ...rest } = endpointValues
          return {
            values: {
              ...state.values,
              [endpoint]: rest,
            },
          }
        }),

      clearEndpoint: (endpoint) =>
        set((state) => {
          const { [endpoint]: _, ...restValues } = state.values
          const { [endpoint]: __, ...restOverrides } = state.typeOverrides
          return {
            values: restValues,
            typeOverrides: restOverrides,
          }
        }),

      // Type override operations
      getTypeOverride: (endpoint, name) => {
        const state = get()
        return state.typeOverrides[endpoint]?.[name]
      },

      setTypeOverride: (endpoint, name, type) =>
        set((state) => ({
          typeOverrides: {
            ...state.typeOverrides,
            [endpoint]: {
              ...state.typeOverrides[endpoint],
              [name]: type,
            },
          },
        })),
    }),
    {
      name: 'api2ui-parameters',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        values: state.values,
        typeOverrides: state.typeOverrides,
      }),
    }
  )
)
