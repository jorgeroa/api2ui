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
        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        {rootLabel}
      </button>

      {stack.map((entry, i) => {
        const isLast = i === stack.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            <span className="text-gray-400 shrink-0" aria-hidden="true">&rsaquo;</span>
            {isLast ? (
              <span className="text-gray-800 font-medium">{entry.label}</span>
            ) : (
              <button
                onClick={() => onNavigate(i)}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
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
