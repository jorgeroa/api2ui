/**
 * Converts SerializableOperations into MCP tool definitions with Zod schemas.
 * Adapted from packages/mcp-server/src/tool-generator.ts — uses local types
 * to avoid pulling in swagger-parser via semantic-analysis.
 */

import { z } from 'zod'
import type { SerializableOperation, SerializableParameter } from '../types'

export interface GeneratedTool {
  name: string
  description: string
  inputSchema: Record<string, z.ZodTypeAny>
  operation: SerializableOperation
}

function generateToolName(op: SerializableOperation): string {
  if (op.operationId) {
    return op.operationId
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const pathSegments = op.path
    .replace(/\{[^}]+\}/g, 'by_id')
    .split('/')
    .filter(Boolean)
    .join('_')

  return `${op.method.toLowerCase()}_${pathSegments}`
}

function generateDescription(op: SerializableOperation): string {
  const parts: string[] = []

  if (op.summary) {
    parts.push(op.summary)
  } else if (op.description) {
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

function parameterToZod(param: SerializableParameter): z.ZodTypeAny {
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

  const descParts: string[] = []
  if (param.description) descParts.push(param.description)
  if (param.schema.format) descParts.push(`Format: ${param.schema.format}`)
  if (param.schema.default !== undefined) descParts.push(`Default: ${String(param.schema.default)}`)
  if (param.schema.example !== undefined) descParts.push(`Example: ${String(param.schema.example)}`)
  if (descParts.length > 0) schema = schema.describe(descParts.join('. '))

  if (!param.required) {
    schema = schema.optional()
  }

  return schema
}

export function generateTools(operations: SerializableOperation[]): GeneratedTool[] {
  return operations.map(op => {
    const inputSchema: Record<string, z.ZodTypeAny> = {}

    for (const param of op.parameters) {
      inputSchema[param.name] = parameterToZod(param)
    }

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
