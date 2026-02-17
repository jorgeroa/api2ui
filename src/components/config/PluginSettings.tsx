/**
 * Plugin settings panel — manage installed external plugins.
 * Shows core plugin count, installed external plugins with enable/disable toggles,
 * and an install form for adding new plugins.
 */

import { useState } from 'react'
import { usePluginStore } from '../../store/pluginStore'
import { registry } from '../registry/pluginRegistry'
import type { PluginManifest } from '../../types/pluginManifest'

/** Trash icon */
function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

/** Package icon */
function PackageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}

/** Plus icon */
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

export function PluginSettings() {
  const { installed, loadErrors, installPlugin, removePlugin, togglePlugin } = usePluginStore()
  const [showInstall, setShowInstall] = useState(false)
  const [installForm, setInstallForm] = useState({ name: '', source: 'npm' as 'npm' | 'url', value: '' })

  const coreCount = registry.list({ source: 'core' }).length

  const handleInstall = () => {
    if (!installForm.name.trim() || !installForm.value.trim()) return

    const manifest: PluginManifest = {
      id: installForm.name.trim(),
      name: installForm.name.trim(),
      source: installForm.source,
      ...(installForm.source === 'npm'
        ? { package: installForm.value.trim() }
        : { url: installForm.value.trim() }),
      version: '0.0.0',
      enabled: true,
    }

    installPlugin(manifest)
    setInstallForm({ name: '', source: 'npm', value: '' })
    setShowInstall(false)
  }

  return (
    <div className="space-y-3">
      {/* Core plugins summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Core plugins</span>
        <span className="text-gray-900 font-medium">{coreCount} registered</span>
      </div>

      {/* Installed external plugins */}
      {installed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">External Plugins</div>
          {installed.map((manifest) => {
            const error = loadErrors[manifest.id]
            return (
              <div
                key={manifest.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <PackageIcon />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{manifest.name}</div>
                  <div className="text-xs text-gray-500">
                    {manifest.source === 'npm' ? manifest.package : manifest.url}
                    {manifest.version !== '0.0.0' && ` v${manifest.version}`}
                  </div>
                  {error && (
                    <div className="text-xs text-red-600 mt-0.5">{error}</div>
                  )}
                </div>
                {/* Enable/disable toggle */}
                <button
                  onClick={() => togglePlugin(manifest.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    manifest.enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  title={manifest.enabled ? 'Disable plugin' : 'Enable plugin'}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      manifest.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                {/* Remove */}
                <button
                  onClick={() => removePlugin(manifest.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove plugin"
                >
                  <TrashIcon />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Install new plugin */}
      {showInstall ? (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="text-xs font-medium text-gray-700">Install Plugin</div>
          <input
            type="text"
            placeholder="Plugin name"
            value={installForm.name}
            onChange={(e) => setInstallForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <select
              value={installForm.source}
              onChange={(e) => setInstallForm((f) => ({ ...f, source: e.target.value as 'npm' | 'url' }))}
              className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="npm">npm</option>
              <option value="url">URL</option>
            </select>
            <input
              type="text"
              placeholder={installForm.source === 'npm' ? 'api2ui-plugin-name' : 'https://cdn.example.com/plugin.js'}
              value={installForm.value}
              onChange={(e) => setInstallForm((f) => ({ ...f, value: e.target.value }))}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowInstall(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleInstall}
              disabled={!installForm.name.trim() || !installForm.value.trim()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Install
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInstall(true)}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
        >
          <PlusIcon />
          Install plugin
        </button>
      )}
    </div>
  )
}
