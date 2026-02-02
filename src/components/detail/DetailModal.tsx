import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { TypeSignature } from '../../types/schema'
import { DynamicRenderer } from '../DynamicRenderer'

interface DetailModalProps {
  item: unknown | null
  schema: TypeSignature
  onClose: () => void
}

/** Get a title from an item by checking common name fields */
function getItemTitle(item: unknown): string {
  if (typeof item !== 'object' || item === null) {
    return 'Item Details'
  }

  const obj = item as Record<string, unknown>
  const nameFields = ['name', 'title', 'label', 'id']

  for (const field of nameFields) {
    const value = obj[field]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }

  return 'Item Details'
}

export function DetailModal({ item, schema, onClose }: DetailModalProps) {
  const open = item !== null

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold mb-4">
            {getItemTitle(item)}
          </DialogTitle>

          {/* Render the item details */}
          {item !== null && (
            <DynamicRenderer
              data={item}
              schema={schema}
              path="$.selected"
              depth={0}
            />
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
