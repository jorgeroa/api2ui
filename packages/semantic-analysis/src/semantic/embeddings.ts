/**
 * Runtime embedding classifier for semantic field detection.
 *
 * Uses pre-computed token embeddings and category centroids generated at build
 * time by `scripts/generate-embeddings.mjs`. Classification is pure math
 * (cosine similarity) — no model or runtime inference required.
 */

import type { SemanticCategory } from './types'
import centroidData from '../data/category-embeddings.json'
import tokenData from '../data/token-embeddings.json'

const DIMENSIONS = centroidData.dimensions

/** Pre-loaded category centroids (category → normalized vector). */
const centroids = centroidData.categories as Record<string, number[]>

/** Pre-loaded token embeddings (token → normalized vector). */
const tokens = tokenData.tokens as Record<string, number[]>

/** All category names for iteration. */
const categoryNames = Object.keys(centroids) as SemanticCategory[]

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

/**
 * Splits a field name into lowercase tokens.
 * Handles snake_case, camelCase, kebab-case, and dot.notation.
 *
 * The full lowercased name is always included as the first token so that
 * single-word field names (even with odd capitalization like "pRiCe") can
 * match directly if present in the vocabulary.
 *
 * Examples:
 *   "userName"       → ["username", "user", "name"]
 *   "first_name"     → ["first_name", "first", "name"]
 *   "phoneNumber"    → ["phonenumber", "phone", "number"]
 *   "pRiCe"          → ["price"]  (no splits needed)
 *   "price"          → ["price"]  (no splits — deduped)
 */
export function tokenizeFieldName(name: string): string[] {
  if (!name) return []
  const fullLower = name.toLowerCase()

  // Replace separators with spaces
  let normalized = name.replace(/[_\-./]/g, ' ')

  // Insert space before camelCase boundaries:
  //   "phoneNumber" → "phone Number"
  //   "HTMLParser"  → "HTML Parser"
  normalized = normalized.replace(/([a-z])([A-Z])/g, '$1 $2')
  normalized = normalized.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')

  const parts = normalized
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0)

  // Deduplicate: put the full name first, then any unique parts
  const seen = new Set<string>()
  const result: string[] = []

  // Full name first (handles "pRiCe" → "price", "bewertung" → "bewertung")
  seen.add(fullLower)
  result.push(fullLower)

  // Then individual parts if different from the full name
  for (const part of parts) {
    if (!seen.has(part)) {
      seen.add(part)
      result.push(part)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Embedding lookup & computation
// ---------------------------------------------------------------------------

/**
 * Look up a single token's pre-computed embedding.
 * Returns null if the token is not in the vocabulary.
 */
export function lookupTokenEmbedding(token: string): number[] | null {
  return tokens[token] ?? null
}

/**
 * Compute a composite embedding for a list of tokens by averaging their
 * individual embeddings and L2-normalizing the result.
 *
 * Returns null if none of the tokens have known embeddings.
 */
export function computeFieldEmbedding(tokenList: string[]): number[] | null {
  const embeddings = tokenList
    .map(t => lookupTokenEmbedding(t))
    .filter((e): e is number[] => e !== null)

  if (embeddings.length === 0) return null

  // Average
  const avg = new Array<number>(DIMENSIONS).fill(0)
  for (const emb of embeddings) {
    for (let i = 0; i < DIMENSIONS; i++) {
      avg[i] = avg[i]! + emb[i]!
    }
  }
  for (let i = 0; i < DIMENSIONS; i++) {
    avg[i] = avg[i]! / embeddings.length
  }

  // L2-normalize
  let norm = 0
  for (let i = 0; i < DIMENSIONS; i++) norm += avg[i]! * avg[i]!
  norm = Math.sqrt(norm)
  if (norm > 0) {
    for (let i = 0; i < DIMENSIONS; i++) avg[i] = avg[i]! / norm
  }

  return avg
}

// ---------------------------------------------------------------------------
// Similarity
// ---------------------------------------------------------------------------

/**
 * Dot product of two L2-normalized vectors (= cosine similarity).
 */
function dotProduct(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!
  return dot
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Minimum similarity threshold to consider a match. */
const DEFAULT_THRESHOLD = 0.65

/**
 * Get the embedding similarity between a field name and a specific category.
 * Returns 0 if the field name has no known tokens.
 */
export function getEmbeddingSimilarity(
  fieldName: string,
  category: SemanticCategory
): number {
  const fieldTokens = tokenizeFieldName(fieldName)
  const embedding = computeFieldEmbedding(fieldTokens)
  if (!embedding) return 0

  const centroid = centroids[category]
  if (!centroid) return 0

  return dotProduct(embedding, centroid)
}

/**
 * Classify a field name against all categories and return the best match.
 * Returns null if the best score is below the threshold or if no tokens are
 * in the vocabulary.
 */
export function classifyFieldName(
  fieldName: string,
  threshold = DEFAULT_THRESHOLD
): { category: SemanticCategory; score: number } | null {
  const fieldTokens = tokenizeFieldName(fieldName)
  const embedding = computeFieldEmbedding(fieldTokens)
  if (!embedding) return null

  let bestCategory: SemanticCategory | null = null
  let bestScore = -Infinity

  for (const cat of categoryNames) {
    const centroidVec = centroids[cat]
    if (!centroidVec) continue
    const score = dotProduct(embedding, centroidVec)
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat
    }
  }

  if (!bestCategory || bestScore < threshold) return null

  return { category: bestCategory, score: bestScore }
}

/**
 * Get number of known tokens for a field name (useful for debugging).
 */
export function getKnownTokenCount(fieldName: string): {
  total: number
  known: number
  unknown: string[]
} {
  const fieldTokens = tokenizeFieldName(fieldName)
  const unknown = fieldTokens.filter(t => !tokens[t])
  return {
    total: fieldTokens.length,
    known: fieldTokens.length - unknown.length,
    unknown,
  }
}
