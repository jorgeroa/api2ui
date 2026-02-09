interface StarRatingProps {
  value: number
  max?: number
}

export function StarRating({ value, max = 5 }: StarRatingProps) {
  // Clamp value to [0, max] range
  const clamped = Math.max(0, Math.min(value, max))

  // Calculate star counts
  const fullStars = Math.floor(clamped)
  const hasHalf = (clamped - fullStars) >= 0.5
  const emptyStars = max - fullStars - (hasHalf ? 1 : 0)

  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${value} out of ${max}`}
    >
      {/* Filled stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <span key={`full-${i}`} className="text-yellow-400">&#9733;</span>
      ))}

      {/* Half star */}
      {hasHalf && (
        <span className="text-yellow-300">&#9733;</span>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300">&#9734;</span>
      ))}

      {/* Numeric value */}
      <span className="text-xs text-gray-500 ml-1">({value.toFixed(1)})</span>
    </span>
  )
}
