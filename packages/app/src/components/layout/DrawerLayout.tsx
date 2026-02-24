import React, { useEffect } from 'react'

interface DrawerLayoutProps {
  parameters: React.ReactNode
  results: React.ReactNode
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

/**
 * DrawerLayout - Mobile bottom drawer with slide-up animation
 *
 * Results are always visible. Parameters slide up from bottom in a drawer.
 * Uses CSS transforms for 60fps animation performance.
 */
export function DrawerLayout({
  parameters,
  results,
  isOpen,
  onOpenChange,
  className = ''
}: DrawerLayoutProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className={`relative min-h-0 ${className}`}>
      {/* Results - always visible */}
      <div className="overflow-y-auto p-4">
        {results}
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background rounded-t-xl shadow-lg transition-transform duration-200 ease-out max-h-[60vh] flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <button
          onClick={() => onOpenChange(!isOpen)}
          className="w-full flex justify-center py-3 cursor-pointer"
          aria-label={isOpen ? 'Close drawer' : 'Open drawer'}
        >
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </button>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {parameters}
        </div>
      </div>
    </div>
  )
}
