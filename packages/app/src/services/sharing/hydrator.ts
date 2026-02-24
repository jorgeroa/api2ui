/**
 * Hash state hydration for shareable links.
 *
 * On app load, checks for a `#share=...` hash fragment and hydrates
 * the relevant stores with the decoded state.
 */

import { useAppStore } from '../../store/appStore'
import { useConfigStore } from '../../store/configStore'
import { useLayoutStore } from '../../store/layoutStore'
import { decodeShareableState, hasSharePayload } from './encoder'
import type { ShareableState } from './encoder'

/**
 * Collect the current shareable state from all stores.
 */
export function collectShareableState(): ShareableState | null {
  const { url, selectedOperationIndex } = useAppStore.getState()
  if (!url) return null

  const { fieldConfigs, globalTheme, styleOverrides } = useConfigStore.getState()
  const { layouts } = useLayoutStore.getState()

  return {
    apiUrl: url,
    operationIndex: selectedOperationIndex,
    fieldConfigs: Object.keys(fieldConfigs).length > 0 ? fieldConfigs : undefined,
    theme: globalTheme !== 'light' ? globalTheme : undefined,
    styleOverrides: Object.keys(styleOverrides).length > 0 ? styleOverrides : undefined,
    layouts: Object.keys(layouts).length > 0 ? layouts : undefined,
  }
}

/**
 * Try to hydrate stores from the URL hash.
 * Returns the decoded state if successful, null otherwise.
 * Does NOT clear the hash — the caller decides when to do that.
 */
export function hydrateFromHash(): ShareableState | null {
  if (!hasSharePayload()) return null

  const state = decodeShareableState(window.location.hash)
  if (!state) return null

  // Hydrate app store
  const appStore = useAppStore.getState()
  appStore.setUrl(state.apiUrl)
  if (state.operationIndex !== undefined) {
    appStore.setSelectedOperation(state.operationIndex)
  }

  // Hydrate config store
  const configStore = useConfigStore.getState()
  if (state.fieldConfigs) {
    // Merge field configs (don't replace — shared link overrides take precedence)
    for (const [path, config] of Object.entries(state.fieldConfigs)) {
      configStore.setFieldConfig(path, config)
    }
  }
  if (state.theme) {
    configStore.applyTheme(state.theme)
  }
  if (state.styleOverrides) {
    configStore.setStyleOverrides(state.styleOverrides)
  }

  // Hydrate layout store
  if (state.layouts) {
    const layoutStore = useLayoutStore.getState()
    for (const [endpoint, layout] of Object.entries(state.layouts)) {
      layoutStore.setLayout(endpoint, layout)
    }
  }

  return state
}
