import type { ParsedOperation } from '../../services/openapi/types'

interface OperationSelectorProps {
  operations: ParsedOperation[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function OperationSelector({ operations, selectedIndex, onSelect }: OperationSelectorProps) {
  // Single operation: render as static text
  if (operations.length === 1) {
    const operation = operations[0]
    if (!operation) {
      return null
    }
    return (
      <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
            {operation.method}
          </span>
          <code className="text-sm font-mono text-foreground">{operation.path}</code>
          {operation.summary && (
            <span className="text-sm text-muted-foreground">— {operation.summary}</span>
          )}
        </div>
      </div>
    )
  }

  // Multiple operations: render as dropdown
  return (
    <div className="mb-6">
      <label htmlFor="operation-select" className="block text-sm font-medium text-foreground mb-2">
        Select Endpoint
      </label>
      <select
        id="operation-select"
        value={selectedIndex}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus-visible:ring-ring/50 focus:border-primary bg-background"
      >
        {operations.map((operation, index) => (
          <option key={index} value={index}>
            {operation.method} {operation.path}
            {operation.summary ? ` — ${operation.summary}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
