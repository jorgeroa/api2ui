import { useEffect, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useConfigStore } from '../../store/configStore'
import { useAppStore } from '../../store/appStore'
import { FieldListPanel } from './FieldListPanel'
import { ComponentOverridePanel } from './ComponentOverridePanel'
import { StylePanel } from './StylePanel'
import { PluginSettings } from './PluginSettings'

export function ConfigPanel() {
  const { panelOpen, togglePanel, resetConfig } = useConfigStore()
  const { schema } = useAppStore()

  // Scroll to a specific field row in the panel and highlight it briefly
  const scrollToField = useCallback((fieldPath: string) => {
    // Use a short delay to allow panel to render if just opened
    setTimeout(() => {
      const el = document.querySelector(`[data-field-path="${fieldPath}"]`) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Add a temporary highlight ring
        el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1')
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1')
        }, 2000)
      }
    }, 150)
  }, [])

  // Listen for 'api2ui:open-config-panel' events from FieldConfigPopover "More settings..."
  useEffect(() => {
    const handler = (e: Event) => {
      const { fieldPath } = (e as CustomEvent).detail
      // Open the panel if not already open
      const store = useConfigStore.getState()
      if (!store.panelOpen) {
        store.togglePanel()
      }
      // Scroll to the field after panel opens
      scrollToField(fieldPath)
    }
    document.addEventListener('api2ui:open-config-panel', handler)
    return () => document.removeEventListener('api2ui:open-config-panel', handler)
  }, [scrollToField])

  // Handle "configure in context" from FieldListPanel: close panel, dispatch event for renderer
  const handleConfigureField = useCallback((fieldPath: string) => {
    togglePanel() // Close the config panel
    // Dispatch event for renderers to pick up and open popover
    document.dispatchEvent(
      new CustomEvent('api2ui:configure-field', { detail: { fieldPath } })
    )
  }, [togglePanel])

  const handleReset = () => {
    if (confirm('Reset all configurations? This will clear all customizations.')) {
      resetConfig()
    }
  }

  // Extract field list from schema
  const extractFields = (): Array<{ path: string; name: string }> => {
    if (!schema) return []

    const fields: Array<{ path: string; name: string }> = []

    if (schema.rootType.kind === 'array' && schema.rootType.items.kind === 'object') {
      // Array of objects: list the item fields with path $[].fieldName
      for (const [fieldName] of schema.rootType.items.fields.entries()) {
        fields.push({
          path: `$[].${fieldName}`,
          name: fieldName,
        })
      }
    } else if (schema.rootType.kind === 'object') {
      // Object: list the fields directly with path $.fieldName
      for (const [fieldName] of schema.rootType.fields.entries()) {
        fields.push({
          path: `$.${fieldName}`,
          name: fieldName,
        })
      }
    }

    return fields
  }

  const fields = extractFields()

  return (
    <Dialog open={panelOpen} onClose={togglePanel} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Container to position panel on right */}
      <div className="fixed inset-0 flex items-stretch justify-end">
        <DialogPanel className="w-96 bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Configure View
            </DialogTitle>
            <button
              onClick={togglePanel}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close panel"
            >
              {/* X icon SVG */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Fields Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Fields
              </h3>
              {fields.length > 0 ? (
                <FieldListPanel fields={fields} onConfigureField={handleConfigureField} />
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No data loaded. Fetch an API to configure fields.
                </p>
              )}
            </section>

            {/* Components Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Components
              </h3>
              <ComponentOverridePanel />
            </section>

            {/* Style Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Style
              </h3>
              <StylePanel />
            </section>

            {/* Plugins Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Plugins
              </h3>
              <PluginSettings />
            </section>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Reset All
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
