import { useState, useEffect, useRef, useCallback } from 'react'
import { useConfigStore } from '../../store/configStore'
import { getAvailableRenderModes } from '../renderers/PrimitiveRenderer'
import { registry } from '../registry/pluginRegistry'

interface FieldConfigPopoverProps {
  fieldPath: string
  fieldName: string
  fieldValue: unknown
  position: { x: number; y: number }
  onClose: () => void
}

/** Normalize path for config storage (convert indexed to generic) */
function normalizePath(path: string): string {
  return path.replace(/\[\d+\]/g, '[]')
}

export function FieldConfigPopover({
  fieldPath: rawFieldPath,
  fieldName,
  fieldValue,
  position,
  onClose,
}: FieldConfigPopoverProps) {
  const { getFieldConfig, toggleFieldVisibility, setFieldLabel, setFieldComponentType } =
    useConfigStore()

  // Normalize path so config is stored/looked up with generic [] indices
  const fieldPath = normalizePath(rawFieldPath)

  // Initialize staged state from current config
  const currentConfig = getFieldConfig(fieldPath)
  const [stagedVisible, setStagedVisible] = useState(currentConfig.visible)
  const [stagedLabel, setStagedLabel] = useState(currentConfig.label || '')
  const [stagedComponentType, setStagedComponentType] = useState(
    currentConfig.componentType || ''
  )

  const panelRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Viewport boundary detection
  useEffect(() => {
    const panelWidth = 256 // w-64
    const panelHeight = panelRef.current?.offsetHeight || 300

    let x = position.x
    let y = position.y

    if (x + panelWidth > window.innerWidth) {
      x = position.x - panelWidth
    }
    if (y + panelHeight > window.innerHeight) {
      y = Math.max(8, position.y - panelHeight)
    }

    // Ensure not off-screen to the left or top
    x = Math.max(8, x)
    y = Math.max(8, y)

    setAdjustedPosition({ x, y })
  }, [position])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleApply = useCallback(() => {
    const config = getFieldConfig(fieldPath)

    // Commit staged changes only if different
    if (stagedVisible !== config.visible) {
      toggleFieldVisibility(fieldPath)
    }
    if (stagedLabel !== (config.label || '')) {
      setFieldLabel(fieldPath, stagedLabel)
    }
    if (stagedComponentType !== (config.componentType || '')) {
      setFieldComponentType(fieldPath, stagedComponentType)
    }

    onClose()
  }, [
    fieldPath,
    stagedVisible,
    stagedLabel,
    stagedComponentType,
    getFieldConfig,
    toggleFieldVisibility,
    setFieldLabel,
    setFieldComponentType,
    onClose,
  ])

  // Get available component types for this field value
  const availableTypes = getAvailableRenderModes(fieldValue, fieldName)

  // Also include external plugins compatible with this data type
  const dataType = typeof fieldValue === 'number' ? 'number' : typeof fieldValue === 'boolean' ? 'boolean' : 'string'
  const externalPlugins = registry.getCompatible(dataType as any).filter(p => p.source !== 'core')
  const showComponentType = availableTypes.length > 1 || externalPlugins.length > 0

  // Format the field name for display
  const displayFieldName = fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

  return (
    <>
      {/* Transparent backdrop for click-outside detection */}
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />

      {/* Popover panel */}
      <div
        ref={panelRef}
        className="fixed bg-background rounded-lg shadow-xl border border-border p-4 z-50 w-64"
        style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {/* Header */}
        <div className="mb-3">
          <div className="text-sm font-semibold text-muted-foreground">Configure Field</div>
          <div className="text-xs font-mono text-muted-foreground mt-0.5 truncate" title={fieldName}>
            {fieldName}
          </div>
        </div>

        {/* Visibility toggle */}
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={stagedVisible}
            onChange={(e) => setStagedVisible(e.target.checked)}
            className="rounded border-border text-primary focus-visible:ring-ring/50"
          />
          <span className="text-sm text-foreground">Visible</span>
        </label>

        {/* Custom label input */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Custom Label</label>
          <input
            type="text"
            value={stagedLabel}
            onChange={(e) => setStagedLabel(e.target.value)}
            placeholder="Custom label..."
            className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus-visible:ring-ring/50 focus:border-border"
          />
          <div className="text-xs text-muted-foreground mt-0.5">
            Default: {displayFieldName}
          </div>
        </div>

        {/* Component type selector */}
        {showComponentType && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Display As</label>
            <select
              value={stagedComponentType}
              onChange={(e) => setStagedComponentType(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus-visible:ring-ring/50 focus:border-border bg-background"
            >
              <option value="">Auto-detect</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
              {externalPlugins.map((plugin) => (
                <option key={plugin.id} value={plugin.id}>
                  {plugin.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border my-3" />

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-3 py-1.5 text-sm text-primary-foreground bg-primary hover:bg-primary/90 rounded transition-colors"
          >
            Apply
          </button>
        </div>

        {/* More settings link - opens ConfigPanel scrolled to this field */}
        <button
          onClick={() => {
            onClose()
            document.dispatchEvent(
              new CustomEvent('api2ui:open-config-panel', { detail: { fieldPath } })
            )
          }}
          className="mt-2 text-xs text-primary hover:text-primary/80 hover:underline w-full text-left"
        >
          More settings...
        </button>
      </div>
    </>
  )
}
