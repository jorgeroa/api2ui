import { useState, useCallback, useEffect } from 'react'
import type { TypeSignature } from '../../types/schema'
import { DynamicRenderer } from '../DynamicRenderer'
import { getItemLabel } from '../../utils/itemLabel'
import { useAppStore } from '../../store/appStore'
import { OverlayNavProvider } from '../../contexts/OverlayContext'
import type { OverlayNavItem } from '../../contexts/OverlayContext'

interface DetailPanelProps {
  item: unknown | null
  schema: TypeSignature
  itemPath: string
  onClose: () => void
}

export function DetailPanel({ item, schema, itemPath, onClose }: DetailPanelProps) {
  const open = item !== null
  const setDetailPanelOpen = useAppStore(s => s.setDetailPanelOpen)
  const [stack, setStack] = useState<OverlayNavItem[]>([])

  // Signal to App that the panel is open so it can add right padding
  useEffect(() => {
    if (open) setDetailPanelOpen(true)
    return () => setDetailPanelOpen(false)
  }, [open, setDetailPanelOpen])

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

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  const current = stack.length > 0 ? stack[stack.length - 1] : null
  const viewData = current?.data ?? item
  const viewSchema = current?.schema ?? schema
  const viewPath = current?.path ?? itemPath

  const rootLabel = getItemLabel(item, 'Item')

  if (!open) return null

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-popover text-foreground shadow-2xl border-l border-border overflow-y-auto overscroll-contain">
      {/* Sticky header with breadcrumb and close button */}
      <div className="sticky top-0 bg-popover border-b border-border px-6 py-3 flex items-center justify-between z-10">
        <h2 className="sr-only">
          {current?.label ?? rootLabel}
        </h2>

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
          aria-label="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
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
    </div>
  )
}
