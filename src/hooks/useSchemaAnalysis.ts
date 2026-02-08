/**
 * Hook to run the semantic analysis pipeline when schema/data changes.
 * Populates the analysis cache with semantics, importance, and selection results.
 */

import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { detectSemantics, getBestMatch } from '../services/semantic'
import { analyzeFields } from '../services/analysis'
import { selectComponent } from '../services/selection'
import type { UnifiedSchema, TypeSignature, SemanticMetadata } from '../types/schema'
import type { FieldInfo } from '../services/analysis/types'
import type { SelectionContext } from '../services/selection/types'

/**
 * Extract sample values from data for a given field path.
 * Handles array data by extracting values from each item.
 */
function extractSampleValues(data: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(data)) return []

  const samples: unknown[] = []
  for (const item of data.slice(0, 10)) { // Sample first 10 items
    if (item && typeof item === 'object' && fieldName in item) {
      samples.push((item as Record<string, unknown>)[fieldName])
    }
  }
  return samples
}

/**
 * Get primitive type string from TypeSignature.
 */
function getPrimitiveType(type: TypeSignature): string {
  if (type.kind === 'primitive') return type.type
  if (type.kind === 'array') return 'array'
  if (type.kind === 'object') return 'object'
  return 'unknown'
}

/**
 * Walk schema and find all array-of-objects paths.
 * Returns array of { path, schema, data } for each array.
 */
function findArrayPaths(
  schema: TypeSignature,
  data: unknown,
  basePath: string = '$'
): Array<{ path: string; schema: TypeSignature; data: unknown }> {
  const results: Array<{ path: string; schema: TypeSignature; data: unknown }> = []

  if (schema.kind === 'array' && schema.items.kind === 'object') {
    results.push({ path: basePath, schema, data })
  }

  // Recursively check nested objects
  if (schema.kind === 'object') {
    for (const [fieldName, fieldDef] of schema.fields.entries()) {
      const nestedPath = basePath === '$' ? `$.${fieldName}` : `${basePath}.${fieldName}`
      const nestedData = data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)[fieldName]
        : undefined

      results.push(...findArrayPaths(fieldDef.type, nestedData, nestedPath))
    }
  }

  // Check inside arrays
  if (schema.kind === 'array') {
    const itemPath = `${basePath}[]`
    const firstItem = Array.isArray(data) && data.length > 0 ? data[0] : undefined
    results.push(...findArrayPaths(schema.items, firstItem, itemPath))
  }

  return results
}

/**
 * Build FieldInfo array from an array-of-objects schema.
 */
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

    // Run semantic detection
    const semanticResults = detectSemantics(fieldPath, fieldName, primitiveType, sampleValues)
    const bestMatch = getBestMatch(semanticResults)

    // Build semantic metadata
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

    // Build field info for importance analysis
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

/**
 * Hook to run the analysis pipeline when schema/data changes.
 * Populates the analysis cache with results for DynamicRenderer to consume.
 */
export function useSchemaAnalysis(schema: UnifiedSchema | null, data: unknown): void {
  const { setAnalysisCache, clearAnalysisCache } = useAppStore()

  // Track schema identity to avoid re-running on every render
  const lastSchemaRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip if no schema
    if (!schema) {
      clearAnalysisCache()
      lastSchemaRef.current = null
      return
    }

    // Create identity key from schema URL and timestamp
    const schemaKey = `${schema.url}:${schema.inferredAt}`

    // Skip if schema hasn't changed
    if (lastSchemaRef.current === schemaKey) {
      return
    }
    lastSchemaRef.current = schemaKey

    // Clear previous cache
    clearAnalysisCache()

    // Find all array-of-objects paths in the schema
    const arrayPaths = findArrayPaths(schema.rootType, data)

    // Run analysis for each array path
    for (const { path, schema: arraySchema, data: arrayData } of arrayPaths) {
      // Build field infos and semantic metadata
      const { fieldInfos, semanticsMap } = buildFieldInfos(arraySchema, arrayData, path)

      if (fieldInfos.length === 0) continue

      // Run importance analysis
      const analysisResult = analyzeFields(fieldInfos)

      // Build selection context
      const selectionContext: SelectionContext = {
        semantics: semanticsMap,
        importance: analysisResult.importance,
      }

      // Run component selection
      const selection = selectComponent(arraySchema, selectionContext)

      // Store in cache
      setAnalysisCache(path, {
        semantics: semanticsMap,
        importance: analysisResult.importance,
        selection,
      })
    }
  }, [schema, data, setAnalysisCache, clearAnalysisCache])
}
