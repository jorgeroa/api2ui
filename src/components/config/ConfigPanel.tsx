import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useConfigStore } from '../../store/configStore'
import { useAppStore } from '../../store/appStore'
import { FieldListPanel } from './FieldListPanel'

export function ConfigPanel() {
  const { panelOpen, togglePanel, resetConfig } = useConfigStore()
  const { schema } = useAppStore()

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
                <FieldListPanel fields={fields} />
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No data loaded. Fetch an API to configure fields.
                </p>
              )}
            </section>

            {/* Components Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Components
              </h3>
              <p className="text-sm text-gray-500">
                Component type overrides
              </p>
            </section>

            {/* Style Section */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Style
              </h3>
              <p className="text-sm text-gray-500">
                Theme and styling
              </p>
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
