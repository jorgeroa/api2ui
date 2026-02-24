/**
 * Converts ParsedOperations from OpenAPI specs into MCP tool definitions.
 * Each operation becomes a tool with Zod-validated input schema.
 */

import { z } from 'zod'
import type { ParsedOperation, ParsedParameter } from '@api2ui/semantic-analysis'

/** Generated tool definition ready for MCP registration */
export interface GeneratedTool {
  name: string
  description: string
  inputSchema: Record<string, z.ZodTypeAny>
  operation: ParsedOperation
}

/**
 * Generate a safe tool name from operation details.
 * Prefers operationId, falls back to method_path pattern.
 */
function generateToolName(op: ParsedOperation): string {
  if (op.operationId) {
    // Clean operationId: remove non-alphanumeric, camelCase → snake_case
    return op.operationId
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  // Fallback: method + path segments
  const pathSegments = op.path
    .replace(/\{[^}]+\}/g, 'by_id')
    .split('/')
    .filter(Boolean)
    .join('_')

  return `${op.method.toLowerCase()}_${pathSegments}`
}

/**
 * Build a description from operation metadata.
 */
function generateDescription(op: ParsedOperation): string {
  const parts: string[] = []

  if (op.summary) {
    parts.push(op.summary)
  } else if (op.description) {
    // Use first sentence of description
    const firstSentence = op.description.split(/\.\s/)[0]
    parts.push(firstSentence ? firstSentence + '.' : op.description)
  } else {
    parts.push(`${op.method.toUpperCase()} ${op.path}`)
  }

  if (op.tags.length > 0) {
    parts.push(`Tags: ${op.tags.join(', ')}`)
  }

  return parts.join(' | ')
}

/**
 * Convert a ParsedParameter to a Zod schema type.
 */
function parameterToZod(param: ParsedParameter): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (param.schema.type) {
    case 'integer':
    case 'number': {
      let numSchema = z.number()
      if (param.schema.minimum !== undefined) numSchema = numSchema.min(param.schema.minimum)
      if (param.schema.maximum !== undefined) numSchema = numSchema.max(param.schema.maximum)
      schema = numSchema
      break
    }
    case 'boolean':
      schema = z.boolean()
      break
    case 'array':
      schema = z.array(z.string())
      break
    default: {
      // String with optional enum
      if (param.schema.enum && param.schema.enum.length > 0) {
        const enumValues = param.schema.enum.map(String)
        if (enumValues.length >= 2) {
          schema = z.enum(enumValues as [string, string, ...string[]])
        } else {
          schema = z.string()
        }
      } else {
        let strSchema = z.string()
        if (param.schema.maxLength) strSchema = strSchema.max(param.schema.maxLength)
        schema = strSchema
      }
      break
    }
  }

  // Add description
  const descParts: string[] = []
  if (param.description) descParts.push(param.description)
  if (param.schema.format) descParts.push(`Format: ${param.schema.format}`)
  if (param.schema.default !== undefined) descParts.push(`Default: ${String(param.schema.default)}`)
  if (param.schema.example !== undefined) descParts.push(`Example: ${String(param.schema.example)}`)
  if (descParts.length > 0) schema = schema.describe(descParts.join('. '))

  // Make optional if not required
  if (!param.required) {
    schema = schema.optional()
  }

  return schema
}

/**
 * Generate MCP tools from parsed OpenAPI operations.
 */
export function generateTools(operations: ParsedOperation[]): GeneratedTool[] {
  return operations.map(op => {
    const inputSchema: Record<string, z.ZodTypeAny> = {}

    // Add parameters
    for (const param of op.parameters) {
      inputSchema[param.name] = parameterToZod(param)
    }

    // Add request body as a 'body' parameter for non-GET methods
    if (op.requestBody) {
      const bodyDesc = op.requestBody.description || 'Request body (JSON)'
      inputSchema['body'] = op.requestBody.required
        ? z.string().describe(`${bodyDesc}. Pass as JSON string.`)
        : z.string().optional().describe(`${bodyDesc}. Pass as JSON string.`)
    }

    return {
      name: generateToolName(op),
      description: generateDescription(op),
      inputSchema,
      operation: op,
    }
  })
}
