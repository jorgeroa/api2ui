import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const LayoutMode = {
  Sidebar: 'sidebar',
  Topbar: 'topbar',
  Split: 'split',
} as const
export type LayoutMode = typeof LayoutMode[keyof typeof LayoutMode]

interface LayoutState {
  // endpoint -> layout preference
  layouts: Record<string, LayoutMode>
  defaultLayout: LayoutMode
}

interface LayoutStore extends LayoutState {
  // Layout operations
  getLayout: (endpoint: string) => LayoutMode
  setLayout: (endpoint: string, layout: LayoutMode) => void
  clearLayout: (endpoint: string) => void
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      // State
      layouts: {},
      defaultLayout: 'topbar',

      // Layout operations
      getLayout: (endpoint) => {
        const state = get()
        return state.layouts[endpoint] ?? state.defaultLayout
      },

      setLayout: (endpoint, layout) =>
        set((state) => ({
          layouts: {
            ...state.layouts,
            [endpoint]: layout,
          },
        })),

      clearLayout: (endpoint) =>
        set((state) => {
          const { [endpoint]: _removed, ...rest } = state.layouts
          void _removed
          return {
            layouts: rest,
          }
        }),
    }),
    {
      name: 'api2aux-layouts',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        layouts: state.layouts,
        defaultLayout: state.defaultLayout,
      }),
    }
  )
)
