import { useState, useMemo } from 'react'
import { Dialog, DialogPanel, DialogTitle, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { toast } from 'sonner'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'
import { parseUrlParameters } from '../services/urlParser/parser'
import type { Credential } from '../types/auth'

interface MCPToolPreviewProps {
  open: boolean
  onClose: () => void
}

/**
 * Sanitize a name into a valid identifier (mirrors server.ts sanitizeParamName).
 */
function sanitizeParamName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Derive tool name from URL hostname (mirrors server.ts logic).
 */
function deriveToolName(url: string, serverName?: string): string {
  if (serverName) {
    return `fetch_${sanitizeParamName(serverName)}`
  }
  try {
    const hostname = new URL(url).hostname
    const hostParts = hostname.replace(/^(www|api)\./, '').split('.')
    if (hostParts.length > 0 && hostParts[0]) {
      return `fetch_${sanitizeParamName(hostParts[0])}`
    }
  } catch { /* fallback */ }
  return 'fetch_api'
}

/**
 * Detect semantic categories from response fields using analysis cache.
 */
function getResponseFieldDescriptions(
  analysisCache: Map<string, { semantics: Map<string, { detectedCategory?: string; level?: string }> }>
): Array<{ name: string; category: string }> {
  const fields: Array<{ name: string; category: string }> = []
  const seen = new Set<string>()

  for (const [path, entry] of analysisCache) {
    // Only use top-level paths
    if (path !== '$' && path !== '$[]') continue
    for (const [fieldPath, metadata] of entry.semantics) {
      if (metadata.detectedCategory && (metadata.level === 'high' || metadata.level === 'medium')) {
        const fieldName = fieldPath.split('.').pop() || fieldPath
        if (seen.has(fieldName)) continue
        seen.add(fieldName)
        fields.push({ name: fieldName, category: formatCategory(metadata.detectedCategory) })
      }
    }
  }

  return fields.slice(0, 12)
}

const CATEGORY_LABELS: Record<string, string> = {
  price: 'currency/price',
  email: 'email address',
  phone: 'phone number',
  url: 'URL',
  image_url: 'image URL',
  rating: 'rating score',
  date: 'date/time',
  name: 'name/identity',
  description: 'description',
  status: 'status indicator',
  color: 'color value',
  uuid: 'unique identifier',
  address: 'address',
  coordinates: 'coordinates',
  percentage: 'percentage',
  count: 'count/quantity',
  tags: 'tags/labels',
}

function formatCategory(category: string): string {
  return CATEGORY_LABELS[category] || category
}

/**
 * Get MCP command for config snippet.
 */
function getMcpCommand(): { command: string; pkg: string } {
  if (import.meta.env.DEV) {
    return { command: 'node', pkg: 'packages/mcp-server/dist/cli.js' }
  }
  return { command: 'npx', pkg: '@api2ui/mcp-server' }
}

function buildAuthArgs(cred: Credential | null): string[] {
  if (!cred) return []
  switch (cred.type) {
    case 'bearer':
      return ['--token', cred.token]
    case 'apiKey':
      return ['--header', `${cred.headerName}: ${cred.value}`]
    case 'queryParam':
      return ['--api-key', `${cred.paramName}=${cred.value}`]
    default:
      return []
  }
}

export function MCPToolPreview({ open, onClose }: MCPToolPreviewProps) {
  const url = useAppStore((s) => s.url)
  const data = useAppStore((s) => s.data)
  const analysisCache = useAppStore((s) => s.analysisCache)

  const toolInfo = useMemo(() => {
    if (!url) return null

    const toolName = deriveToolName(url)
    const { parameters } = parseUrlParameters(url)

    // Parse URL for base
    let baseUrl = url
    try {
      const parsed = new URL(url)
      baseUrl = `${parsed.origin}${parsed.pathname}`
    } catch { /* keep original */ }

    // Build parameter list (mirrors server.ts logic)
    const toolParams = [
      { name: 'path', type: 'string', required: false, description: 'Additional path segment to append (e.g., "/users/1")' },
      ...parameters.map(p => ({
        name: p.originalKey !== sanitizeParamName(p.originalKey) ? sanitizeParamName(p.originalKey) : p.originalKey,
        type: p.isArray ? 'array' : 'string',
        required: false,
        description: p.originalKey !== sanitizeParamName(p.originalKey)
          ? `Query param "${p.originalKey}" (default: "${p.schema.default ?? ''}")`
          : `(default: "${p.schema.default ?? ''}")`,
        originalKey: p.originalKey,
        defaultValue: p.schema.default as string | undefined,
      })),
      { name: 'debug', type: 'boolean', required: false, description: 'Show request URL, headers, and timing' },
      { name: 'full_response', type: 'boolean', required: false, description: 'Disable truncation, return full response' },
    ]

    // Semantic response fields
    const responseFields = getResponseFieldDescriptions(analysisCache as Map<string, { semantics: Map<string, { detectedCategory?: string; level?: string }> }>)

    // Tool description
    const paramCount = parameters.length
    let description = paramCount > 0
      ? `Fetch data from ${baseUrl} with ${paramCount} configurable query parameters. Each parameter has a default value that can be overridden.`
      : `Fetch data from ${url}. Optionally append a path.`

    if (responseFields.length > 0) {
      const fieldStr = responseFields.map(f => `${f.name} (${f.category})`).join(', ')
      description = `${description}. Returns: ${fieldStr}`
    }

    // Config snippet
    const { command, pkg } = getMcpCommand()
    const authStore = useAuthStore.getState()
    const cred = authStore.getActiveCredential(url)
    const authArgs = buildAuthArgs(cred)
    const serverName = deriveToolName(url).replace('fetch_', '')

    const config = {
      [serverName]: {
        command,
        args: [pkg, '--api', url, '--name', serverName, ...authArgs],
      },
    }

    return {
      toolName,
      description,
      params: toolParams,
      responseFields,
      configSnippet: JSON.stringify(config, null, 2),
      hasData: data !== null && data !== undefined,
    }
  }, [url, data, analysisCache])

  if (!toolInfo) return null

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.info(label, { description: text, duration: 10000 })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-stretch justify-end">
        <DialogPanel className="w-[28rem] bg-background shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-foreground">
              MCP Tool Preview
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* Tool name + description */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm font-mono font-semibold text-foreground bg-muted px-2 py-0.5 rounded">
                  {toolInfo.toolName}
                </code>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {toolInfo.description}
              </p>
            </section>

            {/* Parameters */}
            <Disclosure defaultOpen>
              <DisclosureButton className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {({ open: isOpen }) => (
                  <>
                    Parameters ({toolInfo.params.length})
                    <svg
                      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </DisclosureButton>
              <DisclosurePanel className="mt-2 space-y-1">
                {toolInfo.params.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-start gap-2 py-1.5 px-2 rounded text-xs hover:bg-muted/50"
                  >
                    <code className="font-mono text-foreground shrink-0">{param.name}</code>
                    <span className="text-muted-foreground/70">{param.type}</span>
                    <span className="text-muted-foreground ml-auto truncate max-w-[200px]" title={param.description}>
                      {param.description}
                    </span>
                  </div>
                ))}
              </DisclosurePanel>
            </Disclosure>

            {/* Response Fields */}
            {toolInfo.responseFields.length > 0 && (
              <Disclosure defaultOpen>
                <DisclosureButton className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {({ open: isOpen }) => (
                    <>
                      Response Fields ({toolInfo.responseFields.length})
                      <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </DisclosureButton>
                <DisclosurePanel className="mt-2 space-y-1">
                  {toolInfo.responseFields.map((field) => (
                    <div
                      key={field.name}
                      className="flex items-center gap-2 py-1 px-2 rounded text-xs hover:bg-muted/50"
                    >
                      <code className="font-mono text-foreground">{field.name}</code>
                      <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground text-[10px]">
                        {field.category}
                      </span>
                    </div>
                  ))}
                </DisclosurePanel>
              </Disclosure>
            )}

            {!toolInfo.hasData && (
              <p className="text-xs text-muted-foreground italic">
                Fetch the API to see response field semantics.
              </p>
            )}

            {/* Config Snippet */}
            <Disclosure>
              <DisclosureButton className="flex items-center justify-between w-full text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {({ open: isOpen }) => (
                  <>
                    Config Snippet
                    <svg
                      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </DisclosureButton>
              <DisclosurePanel className="mt-2">
                <div className="relative">
                  <pre className="bg-muted rounded-lg p-3 text-[11px] font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                    {toolInfo.configSnippet}
                  </pre>
                  <button
                    onClick={() => handleCopy(toolInfo.configSnippet, 'Config')}
                    className="absolute top-2 right-2 px-2 py-0.5 text-[10px] bg-background border border-border rounded hover:bg-muted transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </DisclosurePanel>
            </Disclosure>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-3">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

/**
 * MCP Tool Preview button for the toolbar.
 */
export function MCPToolPreviewButton() {
  const [open, setOpen] = useState(false)
  const url = useAppStore((s) => s.url)

  if (!url) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus-visible:ring-ring/50 focus:ring-offset-1"
        title="Preview MCP tools"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17l-5.59-3.43a.78.78 0 010-1.35l5.59-3.43a.78.78 0 011.17.68v6.86a.78.78 0 01-1.17.67z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8 5-8-5M20 17l-8-5-8 5"
          />
        </svg>
        Tools
      </button>
      <MCPToolPreview open={open} onClose={() => setOpen(false)} />
    </>
  )
}
