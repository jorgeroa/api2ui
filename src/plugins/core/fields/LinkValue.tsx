import type { FieldRenderProps } from '../../../types/plugins'
import { ExternalLink } from '../../../components/ui/ExternalLink'

/** Clickable URL that opens in a new tab with interstitial */
export function LinkValue({ value }: FieldRenderProps) {
  const str = String(value ?? '')
  return (
    <ExternalLink
      href={str}
      className="text-primary hover:text-primary/80 underline"
    >
      {str}
    </ExternalLink>
  )
}
