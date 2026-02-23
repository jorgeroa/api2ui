import type { ParsedOperation } from '../../services/openapi/types'

interface OperationItemProps {
  operation: ParsedOperation
  index: number
  isSelected: boolean
  onSelect: (index: number) => void
}

export function OperationItem({ operation, index, isSelected, onSelect }: OperationItemProps) {
  return (
    <button
      onClick={() => onSelect(index)}
      className={`
        w-full text-left px-3 py-2 transition-colors
        ${isSelected
          ? 'bg-muted border-l-2 border-foreground text-foreground'
          : 'hover:bg-muted border-l-2 border-transparent'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="px-1.5 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded uppercase">
          {operation.method}
        </span>
        <code className="text-xs font-mono text-foreground">{operation.path}</code>
      </div>
      {operation.summary && (
        <p className="text-xs text-muted-foreground truncate">
          {operation.summary}
        </p>
      )}
    </button>
  )
}
