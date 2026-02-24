import type { FieldRenderProps } from '../../../types/plugins'

/** Color preview swatch + hex/rgb code */
export function ColorSwatch({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-5 h-5 rounded border border-border inline-block shrink-0"
        style={{ backgroundColor: str }}
      />
      <code className="text-xs font-mono text-foreground">{str}</code>
    </span>
  )
}
