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
        <DialogPanel className="max-w-3xl w-full bg-surface text-text rounded-xl shadow-lg max-h-[80vh] overflow-y-auto">
          {/* Sticky header with close button */}
          <div className="sticky top-0 bg-surface z-10 flex items-center justify-end px-4 py-2 border-b border-border rounded-t-xl">
            <DialogTitle className="sr-only">
              {getItemLabel(item, 'Item Details')}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {item !== null && (
              <DynamicRenderer
                data={item}
                schema={schema}
                path={itemPath}
                depth={1}
              />
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
