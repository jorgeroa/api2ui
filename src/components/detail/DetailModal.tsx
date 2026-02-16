import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { TypeSignature } from '../../types/schema'
import { DynamicRenderer } from '../DynamicRenderer'
import { getItemLabel } from '../../utils/itemLabel'

interface DetailModalProps {
  item: unknown | null
  schema: TypeSignature
  itemPath: string
  onClose: () => void
}

export function DetailModal({ item, schema, itemPath, onClose }: DetailModalProps) {
  const open = item !== null

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-3xl w-full bg-surface text-text rounded-xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
          <DialogTitle className="text-xl font-semibold mb-4">
            {getItemLabel(item, 'Item Details')}
          </DialogTitle>

          {/* Render the item details — use actual item path for smart component selection */}
          {item !== null && (
            <DynamicRenderer
              data={item}
              schema={schema}
              path={itemPath}
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
