import { describe, it, expect } from 'vitest'
import {
  generateClaudeDesktopConfig,
  generateClaudeCodeConfig,
  generateGenericConfig,
} from './config-generator'

describe('generateClaudeDesktopConfig', () => {
  it('generates config with npx when no local path', () => {
    const result = generateClaudeDesktopConfig({
      openapiUrl: 'https://api.example.com/openapi.json',
      name: 'my-api',
    })

    expect(result.config).toEqual({
      'my-api': {
        command: 'npx',
        args: ['@api2aux/mcp-server', '--openapi', 'https://api.example.com/openapi.json', '--name', 'my-api'],
      },
    })
    expect(result.instructions).toContain('Claude Desktop')
    expect(result.instructions).toContain('mcpServers')
  })

  it('uses node command when local path provided', () => {
    const result = generateClaudeDesktopConfig(
      { apiUrl: 'https://api.example.com' },
      '/path/to/cli.js'
    )

    expect(result.config).toEqual({
      'api2aux': {
        command: 'node',
        args: ['/path/to/cli.js', '--api', 'https://api.example.com'],
      },
    })
  })

  it('defaults server name to api2aux', () => {
    const result = generateClaudeDesktopConfig({ apiUrl: 'https://example.com' })
    expect(result.config).toHaveProperty('api2aux')
  })

  it('includes auth args', () => {
    const result = generateClaudeDesktopConfig({
      openapiUrl: 'https://api.example.com/spec',
      token: 'my-token',
      header: 'X-Custom: value',
      apiKey: 'key=secret',
    })

    const args = (result.config['api2aux'] as { args: string[] }).args
    expect(args).toContain('--token')
    expect(args).toContain('my-token')
    expect(args).toContain('--header')
    expect(args).toContain('X-Custom: value')
    expect(args).toContain('--api-key')
    expect(args).toContain('key=secret')
  })
})

describe('generateClaudeCodeConfig', () => {
  it('generates config with CLI command in instructions', () => {
    const result = generateClaudeCodeConfig({
      openapiUrl: 'https://api.example.com/openapi.json',
      name: 'my-api',
    })

    expect(result.instructions).toContain('claude mcp add')
    expect(result.instructions).toContain('my-api')
    expect(result.instructions).toContain('.claude')
  })

  it('has same config structure as desktop', () => {
    const config = { apiUrl: 'https://example.com', name: 'test' }
    const desktop = generateClaudeDesktopConfig(config)
    const code = generateClaudeCodeConfig(config)

    expect(code.config).toEqual(desktop.config)
  })
})

describe('generateGenericConfig', () => {
  it('generates flat command config', () => {
    const result = generateGenericConfig({
      openapiUrl: 'https://api.example.com/spec',
    })

    expect(result.config).toEqual({
      command: 'npx',
      args: ['@api2aux/mcp-server', '--openapi', 'https://api.example.com/spec'],
    })
    expect(result.instructions).toContain('stdio')
  })

  it('prefers openapi over api url', () => {
    const result = generateGenericConfig({
      openapiUrl: 'https://spec.example.com',
      apiUrl: 'https://api.example.com',
    })

    const args = result.config['args'] as string[]
    expect(args).toContain('--openapi')
    expect(args).not.toContain('--api')
  })
})
