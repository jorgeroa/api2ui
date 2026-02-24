import type { NavStackEntry } from '../../types/navigation'

interface BreadcrumbProps {
  rootLabel: string
  stack: NavStackEntry[]
  onNavigate: (index: number) => void
}

export function Breadcrumb({ rootLabel, stack, onNavigate }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm flex-wrap">
      <button
        onClick={() => onNavigate(-1)}
        className="text-primary hover:text-primary/80 hover:underline font-medium"
      >
        {rootLabel}
      </button>

      {stack.map((entry, i) => {
        const isLast = i === stack.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-muted-foreground shrink-0" aria-hidden="true">&rsaquo;</span>
            {isLast ? (
              <span className="text-foreground font-medium">{entry.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(i)}
                className="text-primary hover:text-primary/80 hover:underline font-medium"
              >
                {entry.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
