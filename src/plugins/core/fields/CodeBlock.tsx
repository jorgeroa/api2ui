import type { FieldRenderProps } from '../../../types/plugins'

/** Monospace code display */
export function CodeBlock({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  return (
    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
      {str}
    </code>
  )
}
