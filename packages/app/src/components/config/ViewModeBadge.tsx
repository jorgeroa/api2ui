import { useState, useEffect, useRef } from 'react'

interface ViewModeBadgeProps {
  currentType: string
  availableTypes: string[]
  onSelect: (type: string) => void
  onOpenPicker?: () => void
}

/**
 * ViewModeBadge displays a pill showing the current component type.
 * Clicking opens a dropdown to select from available alternatives.
 */
export function ViewModeBadge({
  currentType,
  availableTypes,
  onSelect,
}: ViewModeBadgeProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const hasAlternatives = availableTypes.length > 1

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const displayNames: Record<string, string> = {
    'table': 'Table',
    'card-list': 'Cards',
    'list': 'List',
    'gallery': 'Gallery',
    'timeline': 'Timeline',
    'stats': 'Stats',
    'detail': 'Detail',
    'hero': 'Profile',
    'tabs': 'Tabs',
    'split': 'Split',
    'primitive-list': 'Bullet List',
    'chips': 'Tags',
    'inline': 'Inline',
    'grid': 'Grid',
    'json': 'JSON',
  }

  const displayName = displayNames[currentType] || currentType.charAt(0).toUpperCase() + currentType.slice(1)

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (hasAlternatives) setOpen(!open)
        }}
        className={`inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-full font-medium transition-all select-none ${
          hasAlternatives
            ? 'hover:bg-muted/80 cursor-pointer'
            : 'opacity-50 cursor-not-allowed'
        }`}
      >
        {displayName}
        {hasAlternatives && (
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 bg-popover rounded-lg shadow-lg border border-border py-1 z-50 min-w-35">
          {availableTypes.map((type) => {
            const label = displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1)
            const isActive = type === currentType
            return (
              <button
                key={type}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(type)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? 'bg-muted text-foreground font-semibold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {label}
                {isActive && ' ✓'}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
