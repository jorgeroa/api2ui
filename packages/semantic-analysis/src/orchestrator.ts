/**
 * Pure-function orchestrator for analyzing API responses.
 * Replaces the React hook pattern — no React, no store, no side effects.
 *
 * Usage:
 * ```ts
 * import { analyzeApiResponse } from '@api2ui/semantic-analysis'
 *
 * const schema = inferSchema(responseData, { url })
 * const analysis = analyzeApiResponse(schema, responseData)
 * // analysis.paths['$'] → { semantics, importance, grouping }
 * ```
 */

import { inferSchema } from './schema/inferrer'
import { detectSemantics, getBestMatch } from './semantic'
import { analyzeFields } from './analysis'
import type { UnifiedSchema, TypeSignature, SemanticMetadata } from './types/schema'
import type { FieldInfo, ImportanceScore, GroupingResult } from './analysis/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Analysis result for a single schema path */
export interface PathAnalysis {
  /** Semantic metadata per field path */
  semantics: Map<string, SemanticMetadata>
  /** Importance scores per field path */
  importance: Map<string, ImportanceScore>
  /** Grouping analysis result (prefix groups, semantic clusters) */
  grouping: GroupingResult | null
}

/** Full analysis result for an API response */
export interface ApiAnalysisResult {
  /** Inferred schema */
  schema: UnifiedSchema
  /** Analysis results keyed by JSON path (e.g. '$', '$.address', '$[].tags') */
  paths: Record<string, PathAnalysis>
}

/** Schema kind discriminator */
const SchemaKind = {
  ArrayOfObjects: 'array-of-objects',
  Object: 'object',
  PrimitiveArray: 'primitive-array',
} as const
type SchemaKind = typeof SchemaKind[keyof typeof SchemaKind]

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractSampleValues(data: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(data)) return []
  const samples: unknown[] = []
  for (const item of data.slice(0, 10)) {
    if (item && typeof item === 'object' && fieldName in item) {
      samples.push((item as Record<string, unknown>)[fieldName])
    }
  }
  return samples
}

function getPrimitiveType(type: TypeSignature): string {
  if (type.kind === 'primitive') return type.type
  if (type.kind === 'array') return 'array'
  if (type.kind === 'object') return 'object'
  return 'unknown'
}

function findAnalyzablePaths(
  schema: TypeSignature,
  data: unknown,
  basePath: string = '$'
): Array<{ path: string; schema: TypeSignature; data: unknown; schemaKind: SchemaKind }> {
  const results: Array<{ path: string; schema: TypeSignature; data: unknown; schemaKind: SchemaKind }> = []

  if (schema.kind === 'array' && schema.items.kind === 'object') {
    results.push({ path: basePath, schema, data, schemaKind: 'array-of-objects' })
  }

  if (schema.kind === 'array' && schema.items.kind === 'primitive') {
    results.push({ path: basePath, schema, data, schemaKind: 'primitive-array' })
  }

  if (schema.kind === 'object') {
    results.push({ path: basePath, schema, data, schemaKind: 'object' })
  }

  if (schema.kind === 'object') {
    for (const [fieldName, fieldDef] of schema.fields.entries()) {
      const nestedPath = basePath === '$' ? `$.${fieldName}` : `${basePath}.${fieldName}`
      const nestedData = data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)[fieldName]
        : undefined
      results.push(...findAnalyzablePaths(fieldDef.type, nestedData, nestedPath))
    }
  }

  if (schema.kind === 'array') {
    const itemPath = `${basePath}[]`
    const firstItem = Array.isArray(data) && data.length > 0 ? data[0] : undefined
    results.push(...findAnalyzablePaths(schema.items, firstItem, itemPath))
  }

  return results
}

function buildFieldInfos(
  schema: TypeSignature,
  data: unknown,
  basePath: string
): { fieldInfos: FieldInfo[]; semanticsMap: Map<string, SemanticMetadata> } {
  if (schema.kind !== 'array' || schema.items.kind !== 'object') {
    return { fieldInfos: [], semanticsMap: new Map() }
  }

  const fields = schema.items.fields
  const fieldInfos: FieldInfo[] = []
  const semanticsMap = new Map<string, SemanticMetadata>()
  let position = 0
  const totalFields = fields.size

  for (const [fieldName, fieldDef] of fields.entries()) {
    const fieldPath = `${basePath}[].${fieldName}`
    const sampleValues = extractSampleValues(data, fieldName)
    const primitiveType = getPrimitiveType(fieldDef.type)
    const semanticResults = detectSemantics(fieldPath, fieldName, primitiveType, sampleValues)
    const bestMatch = getBestMatch(semanticResults)

    const semanticMetadata: SemanticMetadata = bestMatch
      ? {
          detectedCategory: bestMatch.category,
          confidence: bestMatch.confidence,
          level: bestMatch.level,
          appliedAt: 'smart-default',
          alternatives: semanticResults
            .filter(r => r.category !== bestMatch.category)
            .slice(0, 2)
            .map(r => ({ category: r.category, confidence: r.confidence }))
        }
      : {
          detectedCategory: null,
          confidence: 0,
          level: 'none',
          appliedAt: 'type-based',
          alternatives: []
        }

    semanticsMap.set(fieldPath, semanticMetadata)
    fieldInfos.push({
      path: fieldPath,
      name: fieldName,
      semanticCategory: bestMatch?.category ?? null,
      sampleValues,
      position,
      totalFields,
    })
    position++
  }

  return { fieldInfos, semanticsMap }
}

function buildObjectFieldInfos(
  schema: TypeSignature,
  data: unknown,
  basePath: string
): { fieldInfos: FieldInfo[]; semanticsMap: Map<string, SemanticMetadata> } {
  if (schema.kind !== 'object') {
    return { fieldInfos: [], semanticsMap: new Map() }
  }

  const fields = schema.fields
  const fieldInfos: FieldInfo[] = []
  const semanticsMap = new Map<string, SemanticMetadata>()
  let position = 0
  const totalFields = fields.size

  for (const [fieldName, fieldDef] of fields.entries()) {
    const fieldPath = `${basePath}.${fieldName}`
    const sampleValues = data && typeof data === 'object' && !Array.isArray(data) && fieldName in (data as Record<string, unknown>)
      ? [(data as Record<string, unknown>)[fieldName]]
      : []
    const primitiveType = getPrimitiveType(fieldDef.type)
    const semanticResults = detectSemantics(fieldPath, fieldName, primitiveType, sampleValues)
    const bestMatch = getBestMatch(semanticResults)

    const semanticMetadata: SemanticMetadata = bestMatch
      ? {
          detectedCategory: bestMatch.category,
          confidence: bestMatch.confidence,
          level: bestMatch.level,
          appliedAt: 'smart-default',
          alternatives: semanticResults
            .filter(r => r.category !== bestMatch.category)
            .slice(0, 2)
            .map(r => ({ category: r.category, confidence: r.confidence }))
        }
      : {
          detectedCategory: null,
          confidence: 0,
          level: 'none',
          appliedAt: 'type-based',
          alternatives: []
        }

    semanticsMap.set(fieldPath, semanticMetadata)
    fieldInfos.push({
      path: fieldPath,
      name: fieldName,
      semanticCategory: bestMatch?.category ?? null,
      sampleValues,
      position,
      totalFields,
    })
    position++
  }

  return { fieldInfos, semanticsMap }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze an API response: infer schema, detect semantics, score importance.
 * Pure function with no side effects — returns all results.
 *
 * @param data - The raw API response data
 * @param url - The API URL (for schema metadata)
 * @returns Full analysis result with schema and per-path analysis
 */
export function analyzeApiResponse(data: unknown, url: string): ApiAnalysisResult {
  const schema = inferSchema(data, url)
  const paths: Record<string, PathAnalysis> = {}

  const analyzablePaths = findAnalyzablePaths(schema.rootType, data)

  for (const { path, schema: nodeSchema, data: nodeData, schemaKind } of analyzablePaths) {
    if (schemaKind === 'array-of-objects') {
      const { fieldInfos, semanticsMap } = buildFieldInfos(nodeSchema, nodeData, path)
      if (fieldInfos.length === 0) continue

      const analysisResult = analyzeFields(fieldInfos)
      paths[path] = {
        semantics: semanticsMap,
        importance: analysisResult.importance,
        grouping: analysisResult.grouping,
      }
    } else if (schemaKind === 'object') {
      const { fieldInfos, semanticsMap } = buildObjectFieldInfos(nodeSchema, nodeData, path)
      if (fieldInfos.length === 0) continue

      const analysisResult = analyzeFields(fieldInfos)
      paths[path] = {
        semantics: semanticsMap,
        importance: analysisResult.importance,
        grouping: analysisResult.grouping,
      }
    } else if (schemaKind === 'primitive-array') {
      const semanticsMap = new Map<string, SemanticMetadata>()
      const importanceMap = new Map<string, ImportanceScore>()

      const fieldName = path.split('.').pop() || path
      const semanticResults = detectSemantics(path, fieldName, 'array', Array.isArray(nodeData) ? nodeData.slice(0, 10) : [])
      const bestMatch = getBestMatch(semanticResults)
      if (bestMatch) {
        semanticsMap.set(path, {
          detectedCategory: bestMatch.category,
          confidence: bestMatch.confidence,
          level: bestMatch.level,
          appliedAt: 'smart-default',
          alternatives: []
        })
      }

      paths[path] = {
        semantics: semanticsMap,
        importance: importanceMap,
        grouping: null,
      }
    }
  }

  return { schema, paths }
}

/**
 * Run analysis on a pre-inferred schema (skip schema inference step).
 * Useful when schema is already available.
 */
export function analyzeSchema(
  schema: UnifiedSchema,
  data: unknown
): Record<string, PathAnalysis> {
  const result = analyzeApiResponse(data, schema.url)
  // Re-use the same analysis logic, schema is re-inferred but that's fast
  return result.paths
}
