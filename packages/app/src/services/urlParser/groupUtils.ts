/**
 * Utility functions for parameter group handling.
 * Used by ParameterGroup component for display.
 */

/**
 * Extract group prefix from parameter name.
 * "filter[name]" -> "filter"
 * "tag[]" -> null (array notation, not a group)
 * "simpleName" -> null (no group)
 */
export function extractGroupPrefix(name: string): string | null {
  // Match pattern: prefix[key] where key is non-empty (not just [] array notation)
  const match = name.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[[^\]]+\]$/)
  if (match) {
    return match[1]!
  }
  return null
}

/**
 * Common suffixes to remove from group names for cleaner display.
 */
const COMMON_SUFFIXES = [
  'filter',
  'filters',
  'param',
  'params',
  'option',
  'options',
  'config',
  'settings',
]

/**
 * Humanize group name for display.
 * "userFilter" -> "User"
 * "searchParams" -> "Search"
 * "HTMLOptions" -> "HTML"
 * "filter2" -> "Filter 2"
 */
export function humanizeGroupName(name: string): string {
  // Step 1: Split on camelCase boundaries
  // Insert space before uppercase letters that follow lowercase
  let result = name.replace(/([a-z])([A-Z])/g, '$1 $2')

  // Step 2: Split on numbers
  result = result.replace(/(\D)(\d)/g, '$1 $2')
  result = result.replace(/(\d)([a-zA-Z])/g, '$1 $2')

  // Step 3: Remove common suffixes (case-insensitive, word boundary)
  const words = result.split(/\s+/)
  const filteredWords = words.filter((word, _index) => {
    // Only remove suffix if it's not the only word
    if (words.length === 1) return true
    // Check if this word is a common suffix (case-insensitive)
    return !COMMON_SUFFIXES.includes(word.toLowerCase())
  })

  // Step 4: Handle case where all words were stripped
  if (filteredWords.length === 0) {
    // Return original with just capitalization
    return capitalizeFirst(name)
  }

  // Step 5: Capitalize first letter of result
  result = filteredWords.join(' ')
  return capitalizeFirst(result)
}

/**
 * Capitalize the first letter of a string.
 */
function capitalizeFirst(str: string): string {
  if (str.length === 0) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}
