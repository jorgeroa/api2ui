import SwaggerParser from '@apidevtools/swagger-parser'
import type { OpenAPIV3, OpenAPIV2 } from 'openapi-types'
import type { ParsedSpec, ParsedOperation, ParsedParameter } from './types'

/**
 * Parse an OpenAPI/Swagger spec URL or object and extract GET operations.
 *
 * @param specUrlOrObject - URL string or spec object
 * @returns Parsed spec with operations, parameters, and metadata
 */
export async function parseOpenAPISpec(
  specUrlOrObject: string | object
): Promise<ParsedSpec> {
  try {
    // Dereference the spec to resolve all $refs
    const apiRaw = await SwaggerParser.dereference(specUrlOrObject as string)
    const api = apiRaw as unknown as OpenAPIV3.Document | OpenAPIV2.Document

    // Detect spec version
    const isOpenAPI3 = 'openapi' in api
    const specVersion = isOpenAPI3
      ? (api as OpenAPIV3.Document).openapi
      : (api as OpenAPIV2.Document).swagger

    // Extract metadata
    const title = api.info.title
    const version = api.info.version

    // Extract base URL
    const baseUrl = isOpenAPI3
      ? extractOpenAPI3BaseUrl(api as OpenAPIV3.Document)
      : extractSwagger2BaseUrl(api as OpenAPIV2.Document)

    // Extract operations
    const operations = extractOperations(api, isOpenAPI3)

    return {
      title,
      version,
      specVersion,
      baseUrl,
      operations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const urlInfo = typeof specUrlOrObject === 'string' ? ` from ${specUrlOrObject}` : ''
    throw new Error(`Failed to parse OpenAPI spec${urlInfo}: ${message}`)
  }
}

/**
 * Extract base URL from OpenAPI 3.x servers array
 */
function extractOpenAPI3BaseUrl(api: OpenAPIV3.Document): string {
  return api.servers?.[0]?.url ?? ''
}

/**
 * Extract base URL from Swagger 2.0 host, basePath, and schemes
 */
function extractSwagger2BaseUrl(api: OpenAPIV2.Document): string {
  const scheme = api.schemes?.[0] ?? 'https'
  const host = api.host ?? ''
  const basePath = api.basePath ?? ''
  return `${scheme}://${host}${basePath}`
}

/**
 * Extract all GET operations from the spec
 */
function extractOperations(
  api: OpenAPIV3.Document | OpenAPIV2.Document,
  isOpenAPI3: boolean
): ParsedOperation[] {
  const operations: ParsedOperation[] = []

  if (!api.paths) {
    return operations
  }

  for (const [path, pathItem] of Object.entries(api.paths)) {
    if (!pathItem) continue

    // Extract path-level parameters (these apply to all operations on this path)
    const pathLevelParams = 'parameters' in pathItem ? pathItem.parameters ?? [] : []

    // Only extract GET operations
    if ('get' in pathItem && pathItem.get) {
      const operation = pathItem.get as OpenAPIV3.OperationObject | OpenAPIV2.OperationObject

      // Merge path-level and operation-level parameters
      const operationParams = operation.parameters ?? []
      const allParams = [...pathLevelParams, ...operationParams]

      const parsedParams = allParams.map(param =>
        parseParameter(param as OpenAPIV3.ParameterObject | OpenAPIV2.Parameter, isOpenAPI3)
      )

      // Extract response schema
      const responseSchema = extractResponseSchema(operation, isOpenAPI3)

      operations.push({
        path,
        method: 'GET',
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description,
        parameters: parsedParams,
        responseSchema,
        tags: operation.tags ?? [],
      })
    }
  }

  return operations
}

/**
 * Parse a parameter from OpenAPI 3.x or Swagger 2.0 format
 */
function parseParameter(
  param: OpenAPIV3.ParameterObject | OpenAPIV2.Parameter,
  isOpenAPI3: boolean
): ParsedParameter {
  const name = param.name
  const location = param.in as 'query' | 'path' | 'header' | 'cookie'
  const required = param.required ?? location === 'path'
  const description = param.description ?? ''

  // Extract schema - different structure between versions
  let type: string | string[] | undefined
  let format: string | undefined
  let enumValues: unknown[] | undefined
  let defaultValue: unknown
  let exampleValue: unknown
  let minimum: number | undefined
  let maximum: number | undefined
  let maxLength: number | undefined

  if (isOpenAPI3) {
    const p = param as OpenAPIV3.ParameterObject
    const schema = p.schema as OpenAPIV3.SchemaObject | undefined
    type = schema?.type
    format = schema?.format
    enumValues = schema?.enum
    defaultValue = schema?.default
    // Example can be on the parameter itself or in the schema
    exampleValue = p.example ?? schema?.example
    minimum = schema?.minimum
    maximum = schema?.maximum
    maxLength = schema?.maxLength
  } else {
    // Swagger 2.0 has type/format at parameter level
    const p = param as OpenAPIV2.GeneralParameterObject
    type = 'type' in p ? p.type : undefined
    format = 'format' in p ? p.format : undefined
    enumValues = 'enum' in p ? p.enum : undefined
    defaultValue = 'default' in p ? p.default : undefined
    exampleValue = 'x-example' in p ? (p as Record<string, unknown>)['x-example'] : undefined
    minimum = 'minimum' in p ? p.minimum : undefined
    maximum = 'maximum' in p ? p.maximum : undefined
    maxLength = 'maxLength' in p ? p.maxLength : undefined
  }

  return {
    name,
    in: location,
    required,
    description,
    schema: {
      type: type?.toString() ?? 'string',
      format,
      enum: enumValues,
      default: defaultValue,
      example: exampleValue,
      minimum,
      maximum,
      maxLength,
    },
  }
}

/**
 * Extract response schema from 200 response
 */
function extractResponseSchema(
  operation: OpenAPIV3.OperationObject | OpenAPIV2.OperationObject,
  isOpenAPI3: boolean
): unknown {
  const response200 = operation.responses?.['200']
  if (!response200) return undefined

  if (isOpenAPI3) {
    const resp = response200 as OpenAPIV3.ResponseObject
    const content = resp.content?.['application/json']
    return content?.schema
  } else {
    const resp = response200 as OpenAPIV2.ResponseObject
    return resp.schema
  }
}
