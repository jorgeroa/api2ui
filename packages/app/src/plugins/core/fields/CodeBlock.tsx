import type { FieldRenderProps } from '../../../types/plugins'

/** Monospace code display */
export function CodeBlock({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  return (
    <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs font-mono">
      {str}
    </code>
  )
}
