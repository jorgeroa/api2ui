import type { RendererProps } from '../../types/components'

export function JsonFallback({ data }: RendererProps) {
  return (
    <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}
