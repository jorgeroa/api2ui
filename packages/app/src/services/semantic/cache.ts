/**
 * Memoization cache for semantic field detection.
 * Caches detection results to avoid redundant computation.
 */

import type { ConfidenceResult } from './types'

/**
 * Cache interface for detection results.
 */
export interface DetectionCache {
  /** Get cached results for a field */
  get(key: string): ConfidenceResult[] | undefined
  /** Store results for a field */
  set(key: string, results: ConfidenceResult[]): void
  /** Check if key exists in cache */
  has(key: string): boolean
  /** Clear all cached results */
  clear(): void
  /** Number of cached entries */
  size: number
}

/**
 * Create a cache key from field detection parameters.
 * Uses first 3 sample values to balance cache hits vs. accuracy.
 *
 * @param fieldPath - Full path to the field (e.g., 'items[0].price')
 * @param fieldName - Field name (e.g., 'price')
 * @param fieldType - Inferred type (e.g., 'number')
 * @param sampleValues - Sample values (first 3 used)
 * @param openapiHints - Optional OpenAPI hints
 * @returns Stable cache key string
 */
export function createCacheKey(
  fieldPath: string,
  fieldName: string,
  fieldType: string,
  sampleValues: unknown[],
  openapiHints?: { format?: string; description?: string }
): string {
  return JSON.stringify({
    fieldPath,
    fieldName,
    fieldType,
    sampleValues: sampleValues.slice(0, 3),
    openapiHints,
  })
}

/**
 * Detection function signature for memoization wrapper.
 */
export type DetectionFunction = (
  fieldPath: string,
  fieldName: string,
  fieldType: string,
  sampleValues: unknown[],
  openapiHints?: { format?: string; description?: string }
) => ConfidenceResult[]

/**
 * Memoized detector with cache management.
 */
export interface MemoizedDetector {
  /** Run detection with memoization */
  detect: DetectionFunction
  /** Access to underlying cache */
  cache: DetectionCache
}

/**
 * Create a memoized wrapper around a detection function.
 * Caches results by field path, name, type, and sample values.
 *
 * @param detector - The detection function to memoize
 * @returns MemoizedDetector with detect function and cache access
 *
 * @example
 * ```ts
 * const memoized = createMemoizedDetector(myDetector)
 * const results = memoized.detect(path, name, type, values, hints)
 * memoized.cache.clear() // For testing
 * ```
 */
export function createMemoizedDetector(detector: DetectionFunction): MemoizedDetector {
  const cacheMap = new Map<string, ConfidenceResult[]>()

  const cache: DetectionCache = {
    get(key: string) {
      return cacheMap.get(key)
    },
    set(key: string, results: ConfidenceResult[]) {
      cacheMap.set(key, results)
    },
    has(key: string) {
      return cacheMap.has(key)
    },
    clear() {
      cacheMap.clear()
    },
    get size() {
      return cacheMap.size
    },
  }

  const detect: DetectionFunction = (
    fieldPath,
    fieldName,
    fieldType,
    sampleValues,
    openapiHints
  ) => {
    const key = createCacheKey(fieldPath, fieldName, fieldType, sampleValues, openapiHints)

    const cached = cache.get(key)
    if (cached !== undefined) {
      return cached
    }

    const results = detector(fieldPath, fieldName, fieldType, sampleValues, openapiHints)
    cache.set(key, results)
    return results
  }

  return { detect, cache }
}
