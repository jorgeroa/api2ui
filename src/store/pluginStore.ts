/**
 * Plugin store — persists installed external plugin manifests.
 * Core plugins are always available and don't appear here.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PluginManifest } from '../types/pluginManifest'

interface PluginStore {
  /** Installed external plugin manifests */
  installed: PluginManifest[]
  /** Plugin IDs that failed to load (with error messages) */
  loadErrors: Record<string, string>

  /** Install a new plugin */
  installPlugin: (manifest: PluginManifest) => void
  /** Remove an installed plugin */
  removePlugin: (id: string) => void
  /** Toggle a plugin's enabled state */
  togglePlugin: (id: string) => void
  /** Update a plugin's manifest (e.g., version bump) */
  updatePlugin: (id: string, updates: Partial<PluginManifest>) => void
  /** Record a load error for a plugin */
  setLoadError: (id: string, error: string) => void
  /** Clear a load error */
  clearLoadError: (id: string) => void
  /** Clear all installed plugins */
  clearAll: () => void
}

export const usePluginStore = create<PluginStore>()(
  persist(
    (set) => ({
      installed: [],
      loadErrors: {},

      installPlugin: (manifest) =>
        set((state) => {
          // Replace if already installed, otherwise append
          const exists = state.installed.findIndex((m) => m.id === manifest.id)
          if (exists >= 0) {
            const updated = [...state.installed]
            updated[exists] = manifest
            return { installed: updated }
          }
          return { installed: [...state.installed, manifest] }
        }),

      removePlugin: (id) =>
        set((state) => ({
          installed: state.installed.filter((m) => m.id !== id),
          loadErrors: Object.fromEntries(
            Object.entries(state.loadErrors).filter(([k]) => k !== id),
          ),
        })),

      togglePlugin: (id) =>
        set((state) => ({
          installed: state.installed.map((m) =>
            m.id === id ? { ...m, enabled: !m.enabled } : m,
          ),
        })),

      updatePlugin: (id, updates) =>
        set((state) => ({
          installed: state.installed.map((m) =>
            m.id === id ? { ...m, ...updates } : m,
          ),
        })),

      setLoadError: (id, error) =>
        set((state) => ({
          loadErrors: { ...state.loadErrors, [id]: error },
        })),

      clearLoadError: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.loadErrors
          return { loadErrors: rest }
        }),

      clearAll: () => set({ installed: [], loadErrors: {} }),
    }),
    {
      name: 'api2ui-plugins',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        installed: state.installed,
      }),
    },
  ),
)
