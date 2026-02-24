import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { toast } from 'sonner'
import { useAppStore } from '../store/appStore'
import { useAuthStore } from '../store/authStore'

type ExportFormat = 'claude-desktop' | 'claude-code' | 'cli'

interface MCPExportDialogProps {
  open: boolean
  onClose: () => void
}

import type { Credential } from '../types/auth'

/**
 * Build auth CLI args from a credential.
 */
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

/**
 * Derive a clean server name from a URL.
 */
function deriveServerName(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname
      .replace(/^(www|api)\./, '')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase()
      || 'my-api'
  } catch {
    return 'my-api'
  }
}

function generateConfig(format: ExportFormat, apiUrl: string, name: string, authArgs: string[]): string {
  const allArgs = ['@api2ui/mcp-server', '--api', apiUrl, '--name', name, ...authArgs]

  if (format === 'cli') {
    return `npx @api2ui/mcp-server --api "${apiUrl}" --name ${name}${authArgs.length ? ' ' + authArgs.join(' ') : ''}`
  }

  const config = {
    [name]: {
      command: 'npx',
      args: allArgs,
    },
  }

  return JSON.stringify(config, null, 2)
}

function getInstructions(format: ExportFormat): string {
  switch (format) {
    case 'claude-desktop':
      return 'Add to "mcpServers" in ~/Library/Application Support/Claude/claude_desktop_config.json, then restart Claude Desktop.'
    case 'claude-code':
      return 'Add to "mcpServers" in ~/.claude.json or your project .claude/settings.json.'
    case 'cli':
      return 'Run this command to start the MCP server directly.'
  }
}

export function MCPExportDialog({ open, onClose }: MCPExportDialogProps) {
  const url = useAppStore((s) => s.url)
  const [format, setFormat] = useState<ExportFormat>('claude-desktop')

  if (!url) return null

  const serverName = deriveServerName(url)

  // Get auth info if present
  const authStore = useAuthStore.getState()
  const cred = authStore.getActiveCredential(url)
  const authArgs = buildAuthArgs(cred)

  const configText = generateConfig(format, url, serverName, authArgs)
  const instructions = getInstructions(format)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(configText)
      toast.success('Config copied to clipboard')
    } catch {
      toast.info('MCP Config', { description: configText, duration: 10000 })
    }
  }

  const formats: Array<{ value: ExportFormat; label: string }> = [
    { value: 'claude-desktop', label: 'Claude Desktop' },
    { value: 'claude-code', label: 'Claude Code' },
    { value: 'cli', label: 'CLI' },
  ]

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-w-lg w-full bg-background rounded-xl shadow-lg p-6">
          <DialogTitle className="text-lg font-semibold mb-1">
            Connect via MCP
          </DialogTitle>
          <p className="text-sm text-muted-foreground mb-4">
            Use this API as MCP tools in your AI assistant.
          </p>

          {/* Format selector */}
          <div className="inline-flex border border-border rounded-lg text-xs mb-4" role="group">
            {formats.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFormat(value)}
                className={`px-3 py-1.5 transition-colors ${
                  format === value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                } ${value === 'claude-desktop' ? 'rounded-l-lg' : ''} ${
                  value === 'cli' ? 'rounded-r-lg' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Config display */}
          <div className="relative">
            <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
              {configText}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-background border border-border rounded hover:bg-muted transition-colors"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>

          {/* Instructions */}
          <p className="text-xs text-muted-foreground mt-3">
            {instructions}
          </p>

          {/* Auth warning */}
          {cred && (
            <p className="text-xs text-amber-500 mt-2">
              This config includes your API credentials. Keep it private.
            </p>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm"
          >
            Done
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

/**
 * MCP button for the toolbar — matches ShareButton styling.
 */
export function MCPButton() {
  const [open, setOpen] = useState(false)
  const url = useAppStore((s) => s.url)

  if (!url) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-muted-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus-visible:ring-ring/50 focus:ring-offset-1"
        title="Connect via MCP"
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
            d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 20.5h.01"
          />
        </svg>
        MCP
      </button>
      <MCPExportDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}
