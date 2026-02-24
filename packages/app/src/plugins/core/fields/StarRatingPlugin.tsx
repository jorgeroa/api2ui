import type { FieldRenderProps } from '../../../types/plugins'
import { StarRating } from '../../../components/renderers/semantic/StarRating'

/** Star rating wrapper — delegates to existing StarRating component */
export function StarRatingPlugin({ value }: FieldRenderProps) {
  if (typeof value !== 'number') return <span>{String(value)}</span>
  return <StarRating value={value} />
}
