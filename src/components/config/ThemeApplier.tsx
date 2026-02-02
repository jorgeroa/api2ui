import { useEffect } from 'react'
import { useConfigStore } from '../../store/configStore'
import { useAppStore } from '../../store/appStore'

/**
 * Invisible component that syncs configuration store state to DOM.
 * Applies theme class and CSS custom properties to document.documentElement.
 */
export function ThemeApplier() {
  const { globalTheme, styleOverrides, endpointOverrides } = useConfigStore()
  const { parsedSpec, selectedOperationIndex } = useAppStore()

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement

    // Remove all theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-compact', 'theme-spacious')

    // Add current theme class
    root.classList.add(`theme-${globalTheme}`)

    return () => {
      // Cleanup on unmount
      root.classList.remove(`theme-${globalTheme}`)
    }
  }, [globalTheme])

  // Apply style overrides (global + endpoint-specific merged)
  useEffect(() => {
    const root = document.documentElement

    // Determine current endpoint key
    let endpointKey: string | null = null
    if (parsedSpec && parsedSpec.operations[selectedOperationIndex]) {
      const operation = parsedSpec.operations[selectedOperationIndex]
      // Use operationId if available, otherwise use method-path
      endpointKey = operation.operationId || `${operation.method}-${operation.path}`
    }

    // Merge global and endpoint-specific overrides
    const mergedOverrides = {
      ...styleOverrides,
      ...(endpointKey && endpointOverrides[endpointKey] ? endpointOverrides[endpointKey] : {})
    }

    // Track which properties we set so we can clean them up
    const appliedProps = new Set<string>()

    // Apply each override as CSS custom property
    Object.entries(mergedOverrides).forEach(([key, value]) => {
      if (value !== undefined) {
        root.style.setProperty(key, value)
        appliedProps.add(key)
      }
    })

    // Cleanup function: remove properties we set
    return () => {
      appliedProps.forEach((prop) => {
        root.style.removeProperty(prop)
      })
    }
  }, [styleOverrides, endpointOverrides, parsedSpec, selectedOperationIndex])

  // Render nothing
  return null
}
