/**
 * Name matching strategies for the semantic scorer.
 *
 * Two strategies are available:
 * - `embedding` (default): Uses pre-computed embedding cosine similarity
 * - `regex`: Legacy regex pattern matching from v1.0-v1.4
 *
 * The active strategy is controlled by `setSemanticEngine()`.
 */

import type { SemanticCategory, SemanticPattern } from './types'
import { computeFieldEmbedding, tokenizeFieldName } from './embeddings'
import centroidData from '../../data/category-embeddings.json'

const centroids = centroidData.categories as Record<string, number[]>
const categoryNames = Object.keys(centroids) as SemanticCategory[]

/**
 * Interface for name matching strategies.
 * The pattern parameter is needed for the regex strategy; embedding ignores it.
 */
export interface NameMatchStrategy {
  readonly name: 'embedding' | 'regex'
  /**
   * Score how well a field name matches a semantic category.
   * @param fieldName - The field name to evaluate
   * @param category - The semantic category to match against
   * @param pattern - The full pattern definition (used by regex strategy)
   * @returns score 0.0-1.0 where higher = better match
   */
  matchName(fieldName: string, category: SemanticCategory, pattern: SemanticPattern): number
}

// ---------------------------------------------------------------------------
// Embedding strategy
// ---------------------------------------------------------------------------

/**
 * Cache for competitive scores per field name.
 * Since the scorer calls matchName once per (fieldName, category) pair,
 * we compute ALL category similarities on the first call and cache them.
 */
const scoreCache = new Map<string, Map<SemanticCategory, number>>()

/** Minimum spread to consider competitive scoring valid. */
const MIN_SPREAD = 0.005

/**
 * Embedding-based name matching using competitive scoring.
 *
 * Because all embeddings live in a dense region (raw similarities 0.85-0.97),
 * absolute thresholds don't discriminate well. Instead we use **competitive
 * scoring**: for each field name, compute cosine similarity to ALL category
 * centroids, then rank-normalize:
 *
 *   score = (sim - sim_min) / (sim_max - sim_min)
 *
 * This gives 1.0 for the best-matching category, 0.0 for the worst, and
 * proportional values for the rest. The scorer then applies its own weight.
 *
 * For field names with no known tokens, returns 0 for all categories.
 */
class EmbeddingStrategyImpl implements NameMatchStrategy {
  readonly name = 'embedding' as const

  matchName(fieldName: string, category: SemanticCategory, _pattern: SemanticPattern): number {
    let cached = scoreCache.get(fieldName)
    if (!cached) {
      cached = this.computeAllScores(fieldName)
      scoreCache.set(fieldName, cached)
    }
    return cached.get(category) ?? 0
  }

  private computeAllScores(fieldName: string): Map<SemanticCategory, number> {
    const scores = new Map<SemanticCategory, number>()
    const fieldTokens = tokenizeFieldName(fieldName)
    const embedding = computeFieldEmbedding(fieldTokens)

    if (!embedding) {
      // No known tokens — all scores are 0
      for (const cat of categoryNames) scores.set(cat, 0)
      return scores
    }

    // Compute raw similarities
    const rawScores: Array<{ cat: SemanticCategory; sim: number }> = []
    for (const cat of categoryNames) {
      const centroid = centroids[cat]
      if (!centroid) continue
      let dot = 0
      for (let i = 0; i < embedding.length; i++) dot += embedding[i]! * centroid[i]!
      rawScores.push({ cat, sim: dot })
    }

    // Find min/max for rank normalization
    let min = Infinity
    let max = -Infinity
    for (const { sim } of rawScores) {
      if (sim < min) min = sim
      if (sim > max) max = sim
    }

    const spread = max - min
    if (spread < MIN_SPREAD) {
      // No meaningful discrimination — field name is equally close to all categories
      for (const cat of categoryNames) scores.set(cat, 0)
      return scores
    }

    // Rank-normalize to 0.0-1.0
    for (const { cat, sim } of rawScores) {
      scores.set(cat, (sim - min) / spread)
    }

    return scores
  }
}

// ---------------------------------------------------------------------------
// Regex strategy (legacy fallback)
// ---------------------------------------------------------------------------

/**
 * Regex-based name matching using the pattern definitions from v1.0-v1.4.
 * Takes the best regex match weight from the pattern's namePatterns array.
 */
class RegexStrategyImpl implements NameMatchStrategy {
  readonly name = 'regex' as const

  matchName(fieldName: string, _category: SemanticCategory, pattern: SemanticPattern): number {
    // Returns 1.0 if any regex matches, 0.0 otherwise.
    // The scorer handles weighting via NAME_MATCH_WEIGHT.
    for (const namePattern of pattern.namePatterns) {
      if (namePattern.regex.test(fieldName)) {
        return 1.0
      }
    }
    return 0
  }
}

// ---------------------------------------------------------------------------
// Strategy registry
// ---------------------------------------------------------------------------

/** Current semantic engine mode. */
let currentEngine: 'embedding' | 'regex' = 'embedding'

const embeddingStrategy = new EmbeddingStrategyImpl()
const regexStrategy = new RegexStrategyImpl()

/**
 * Get the currently active name matching strategy.
 */
export function getActiveStrategy(): NameMatchStrategy {
  return currentEngine === 'embedding' ? embeddingStrategy : regexStrategy
}

/**
 * Get a specific strategy by name.
 */
export function getStrategy(name: 'embedding' | 'regex'): NameMatchStrategy {
  return name === 'embedding' ? embeddingStrategy : regexStrategy
}

/**
 * Set the active semantic engine mode.
 */
export function setSemanticEngine(engine: 'embedding' | 'regex'): void {
  currentEngine = engine
}

/**
 * Get the current semantic engine mode.
 */
export function getSemanticEngine(): 'embedding' | 'regex' {
  return currentEngine
}

/**
 * Clear the embedding strategy score cache.
 * Call when switching strategies or in tests.
 */
export function clearEmbeddingCache(): void {
  scoreCache.clear()
}
