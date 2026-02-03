/**
 * Detects if a string value is a URL pointing to an image file.
 * Uses pathname-based extension checking to avoid false positives from query params.
 */
export function isImageUrl(value: unknown): boolean {
  // Return false for falsy values, non-strings, or non-HTTP(S) URLs
  if (!value || typeof value !== 'string' || !/^https?:\/\//i.test(value)) {
    return false
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']

  try {
    // Parse URL and check pathname for image extension
    const url = new URL(value)
    const pathname = url.pathname.toLowerCase()
    return imageExtensions.some(ext => pathname.endsWith(ext))
  } catch {
    // If URL parsing fails, fall back to checking the raw string
    // Extract the portion before query params
    const beforeQuery = value.split('?')[0]?.toLowerCase() ?? ''
    return imageExtensions.some(ext => beforeQuery.endsWith(ext))
  }
}
