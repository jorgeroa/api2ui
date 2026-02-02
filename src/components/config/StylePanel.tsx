import { useState } from 'react'
import { useConfigStore } from '../../store/configStore'
import { useAppStore } from '../../store/appStore'
import { ThemePresets } from './ThemePresets'
import { ColorPicker } from './ColorPicker'

export function StylePanel() {
  const {
    styleOverrides,
    endpointOverrides,
    setStyleOverride,
    setEndpointStyleOverride,
    clearEndpointOverrides,
    setStyleOverrides,
  } = useConfigStore()
  const { parsedSpec } = useAppStore()

  // Endpoint scope state: null = global, string = specific endpoint
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)

  // Get the list of endpoints from the parsed spec
  const endpoints = parsedSpec?.operations.map((op) => {
    const key = op.operationId || `${op.method} ${op.path}`
    return { key, label: key }
  }) || []

  // Show endpoint selector only if we have 2+ endpoints
  const showEndpointSelector = endpoints.length >= 2

  // Get current style values based on selected scope
  const getCurrentValue = (key: string): string => {
    if (selectedEndpoint) {
      const endpointSpecific = endpointOverrides[selectedEndpoint]
      return (endpointSpecific?.[key as keyof typeof endpointSpecific] as string) || (styleOverrides[key as keyof typeof styleOverrides] as string) || ''
    }
    return (styleOverrides[key as keyof typeof styleOverrides] as string) || ''
  }

  // Update style value based on selected scope
  const updateValue = (key: string, value: string) => {
    if (selectedEndpoint) {
      setEndpointStyleOverride(selectedEndpoint, key, value)
    } else {
      setStyleOverride(key, value)
    }
  }

  // Check if current endpoint has any overrides
  const hasEndpointOverrides = selectedEndpoint && endpointOverrides[selectedEndpoint] && Object.keys(endpointOverrides[selectedEndpoint]).length > 0

  const handleClearEndpointOverrides = () => {
    if (selectedEndpoint) {
      clearEndpointOverrides(selectedEndpoint)
    }
  }

  const handleResetStyles = () => {
    if (confirm('Reset all style customizations to defaults?')) {
      setStyleOverrides({})
      // Clear all endpoint overrides
      Object.keys(endpointOverrides).forEach(endpoint => {
        clearEndpointOverrides(endpoint)
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Endpoint scope selector */}
      {showEndpointSelector && (
        <div className="pb-4 border-b border-gray-200">
          <label htmlFor="endpoint-scope" className="block text-sm font-medium text-gray-700 mb-2">
            Editing styles for:
          </label>
          <select
            id="endpoint-scope"
            value={selectedEndpoint || 'global'}
            onChange={(e) => setSelectedEndpoint(e.target.value === 'global' ? null : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="global">Global (default)</option>
            {endpoints.map((ep) => (
              <option key={ep.key} value={ep.key}>
                {ep.label}
              </option>
            ))}
          </select>

          {hasEndpointOverrides && (
            <button
              onClick={handleClearEndpointOverrides}
              className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
            >
              Clear endpoint overrides
            </button>
          )}
        </div>
      )}

      {/* Theme Preset Section */}
      <section>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Theme Preset</h4>
        <ThemePresets />
      </section>

      {/* Colors Section */}
      <section>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Colors</h4>
        <div className="space-y-4">
          <ColorPicker
            label="Primary"
            value={getCurrentValue('--color-primary')}
            cssVar="--color-primary"
            onChange={(color) => updateValue('--color-primary', color)}
          />
          <ColorPicker
            label="Secondary"
            value={getCurrentValue('--color-secondary')}
            cssVar="--color-secondary"
            onChange={(color) => updateValue('--color-secondary', color)}
          />
          <ColorPicker
            label="Background"
            value={getCurrentValue('--color-background')}
            cssVar="--color-background"
            onChange={(color) => updateValue('--color-background', color)}
          />
          <ColorPicker
            label="Text"
            value={getCurrentValue('--color-text')}
            cssVar="--color-text"
            onChange={(color) => updateValue('--color-text', color)}
          />
          <ColorPicker
            label="Surface"
            value={getCurrentValue('--color-surface')}
            cssVar="--color-surface"
            onChange={(color) => updateValue('--color-surface', color)}
          />
          <ColorPicker
            label="Border"
            value={getCurrentValue('--color-border')}
            cssVar="--color-border"
            onChange={(color) => updateValue('--color-border', color)}
          />
        </div>
      </section>

      {/* Typography Section */}
      <section>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Typography</h4>
        <div className="space-y-4">
          {/* Font family */}
          <div>
            <label htmlFor="font-family" className="block text-sm font-medium text-gray-700 mb-2">
              Font Family
            </label>
            <select
              id="font-family"
              value={getCurrentValue('--font-family')}
              onChange={(e) => updateValue('--font-family', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Default (system-ui)</option>
              <option value="system-ui, sans-serif">System UI</option>
              <option value="Inter, sans-serif">Inter</option>
              <option value="monospace">Monospace</option>
              <option value="serif">Serif</option>
            </select>
          </div>

          {/* Base font size */}
          <div>
            <label htmlFor="font-size" className="block text-sm font-medium text-gray-700 mb-2">
              Base Font Size: {getCurrentValue('--font-size-base') || '14px'}
            </label>
            <input
              id="font-size"
              type="range"
              min="12"
              max="20"
              step="1"
              value={parseInt(getCurrentValue('--font-size-base') || '14')}
              onChange={(e) => updateValue('--font-size-base', `${e.target.value}px`)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>12px</span>
              <span>20px</span>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Spacing</h4>
        <div className="space-y-4">
          {/* Row spacing */}
          <div>
            <label htmlFor="row-spacing" className="block text-sm font-medium text-gray-700 mb-2">
              Row Spacing: {getCurrentValue('--spacing-row') || '0.5rem'}
            </label>
            <input
              id="row-spacing"
              type="range"
              min="0.25"
              max="1.5"
              step="0.25"
              value={parseFloat(getCurrentValue('--spacing-row') || '0.5')}
              onChange={(e) => updateValue('--spacing-row', `${e.target.value}rem`)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.25rem</span>
              <span>1.5rem</span>
            </div>
          </div>

          {/* Border radius */}
          <div>
            <label htmlFor="border-radius" className="block text-sm font-medium text-gray-700 mb-2">
              Border Radius: {getCurrentValue('--border-radius-base') || '0.5rem'}
            </label>
            <input
              id="border-radius"
              type="range"
              min="0"
              max="1"
              step="0.125"
              value={parseFloat(getCurrentValue('--border-radius-base') || '0.5')}
              onChange={(e) => updateValue('--border-radius-base', `${e.target.value}rem`)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>1rem</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reset button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleResetStyles}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
        >
          Reset Styles
        </button>
      </div>
    </div>
  )
}
