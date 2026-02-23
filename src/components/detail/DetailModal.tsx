import { useState, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { TypeSignature } from '../../types/schema'
import { DynamicRenderer } from '../DynamicRenderer'
import { getItemLabel } from '../../utils/itemLabel'
import { OverlayNavProvider } from '../../contexts/OverlayContext'
import type { OverlayNavItem } from '../../contexts/OverlayContext'

interface DetailModalProps {
  item: unknown | null
  schema: TypeSignature
  itemPath: string
  onClose: () => void
}

export function DetailModal({ item, schema, itemPath, onClose }: DetailModalProps) {
  const open = item !== null
  const [stack, setStack] = useState<OverlayNavItem[]>([])

  const push = useCallback((navItem: OverlayNavItem) => {
    setStack(prev => [...prev, navItem])
  }, [])

  const goTo = useCallback((index: number) => {
    setStack(prev => prev.slice(0, index))
  }, [])

  const handleClose = useCallback(() => {
    setStack([])
    onClose()
  }, [onClose])

  // Current view: top of stack or the initial item
  const current = stack.length > 0 ? stack[stack.length - 1] : null
  const viewData = current?.data ?? item
  const viewSchema = current?.schema ?? schema
  const viewPath = current?.path ?? itemPath

  const rootLabel = getItemLabel(item, 'Item')

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-3xl w-full bg-popover text-foreground rounded-xl shadow-lg max-h-[80vh] overflow-y-auto">
          {/* Sticky header with breadcrumb and close button */}
          <div className="sticky top-0 bg-popover z-10 flex items-center justify-between px-4 py-2 border-b border-border rounded-t-xl">
            <DialogTitle className="sr-only">
              {current?.label ?? rootLabel}
            </DialogTitle>

            {stack.length > 0 ? (
              <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
                <button
                  onClick={() => goTo(0)}
                  className="text-primary hover:text-primary/80 truncate shrink-0"
                >
                  {rootLabel}
                </button>
                {stack.map((entry, i) => (
                  <span key={i} className="flex items-center gap-1 min-w-0">
                    <span className="text-muted-foreground shrink-0">&rsaquo;</span>
                    {i < stack.length - 1 ? (
                      <button
                        onClick={() => goTo(i + 1)}
                        className="text-primary hover:text-primary/80 truncate"
                      >
                        {entry.label}
                      </button>
                    ) : (
                      <span className="text-foreground font-medium truncate">{entry.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            ) : (
              <span className="text-sm text-foreground font-medium truncate">{rootLabel}</span>
            )}

            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <OverlayNavProvider value={{ stack, push, goTo }}>
              {viewData !== null && (
                <DynamicRenderer
                  data={viewData}
                  schema={viewSchema}
                  path={viewPath}
                  depth={1}
                />
              )}
            </OverlayNavProvider>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
