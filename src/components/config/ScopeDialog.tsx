import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

interface ScopeDialogProps {
  fieldPath: string
  componentType: string
  similarFields: Array<{ path: string; name: string }>
  onApplyOne: () => void
  onApplyAll: () => void
  onCancel: () => void
}

/**
 * ScopeDialog asks the user whether to apply a component override
 * to just the current field or all similar fields.
 */
export function ScopeDialog({
  fieldPath,
  componentType,
  similarFields,
  onApplyOne,
  onApplyAll,
  onCancel,
}: ScopeDialogProps) {
  return (
    <Dialog open={true} onClose={onCancel} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <DialogTitle className="text-xl font-semibold mb-4">
            Apply {componentType} to:
          </DialogTitle>

          <div className="space-y-3">
            {/* Apply to just this field */}
            <button
              onClick={onApplyOne}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-left"
            >
              <div className="font-semibold">Just this field</div>
              <div className="text-sm text-blue-100">{fieldPath}</div>
            </button>

            {/* Apply to all similar fields */}
            {similarFields.length > 0 && (
              <button
                onClick={onApplyAll}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-left"
              >
                <div className="font-semibold">
                  All similar fields ({similarFields.length + 1} fields)
                </div>
                <div className="text-sm text-blue-100 mt-1 max-h-24 overflow-y-auto">
                  {fieldPath}
                  {similarFields.map((field) => (
                    <div key={field.path}>{field.path}</div>
                  ))}
                </div>
              </button>
            )}
          </div>

          {/* Cancel */}
          <button
            onClick={onCancel}
            className="w-full mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
