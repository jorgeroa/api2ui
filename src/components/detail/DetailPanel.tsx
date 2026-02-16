import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { TypeSignature } from '../../types/schema'
import { DynamicRenderer } from '../DynamicRenderer'
import { getItemLabel } from '../../utils/itemLabel'
import { OverlayProvider } from '../../contexts/OverlayContext'

interface DetailPanelProps {
  item: unknown | null
  schema: TypeSignature
  itemPath: string
  onClose: () => void
}

export function DetailPanel({ item, schema, itemPath, onClose }: DetailPanelProps) {
  const open = item !== null

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop - lighter than modal */}
      <div className="fixed inset-0 bg-black/20" aria-hidden="true" />

      {/* Panel container - positioned at right edge */}
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="w-full max-w-2xl bg-surface text-text shadow-xl h-full overflow-y-auto">
          {/* Sticky header */}
          <div className="sticky top-0 bg-surface border-b border-border px-6 py-3 flex items-center justify-end z-10">
            <DialogTitle className="sr-only">
              {getItemLabel(item, 'Item Details')}
            </DialogTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close panel">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel content */}
          <div className="p-6">
            <OverlayProvider value={true}>
              {item !== null && (
                <DynamicRenderer data={item} schema={schema} path={itemPath} depth={1} />
              )}
            </OverlayProvider>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
