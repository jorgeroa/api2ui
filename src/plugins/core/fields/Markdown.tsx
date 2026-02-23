import ReactMarkdown from 'react-markdown'
import type { FieldRenderProps } from '../../../types/plugins'

/** Rendered markdown content */
export function Markdown({ value }: FieldRenderProps) {
  const str = String(value ?? '')

  return (
    <div className="prose prose-sm max-w-none text-foreground">
      <ReactMarkdown>{str}</ReactMarkdown>
    </div>
  )
}
