/**
 * Shared field rendering component with importance-tier visual hierarchy.
 * Provides consistent three-tier styling (primary/secondary/tertiary) across all detail view modes.
 */

import type { ImportanceTier } from '../../services/analysis/types'
import type { FieldDefinition } from '../../types/schema'
import { PrimitiveRenderer } from './PrimitiveRenderer'

/**
 * Props for FieldRow component.
 */
export interface FieldRowProps {
  /** Field name (raw identifier) */
  fieldName: string
  /** Display label (formatted for UI) */
  displayLabel: string
  /** Field value to render */
  value: unknown
  /** Field definition from schema */
  fieldDef: FieldDefinition
  /** JSON path to this field */
  fieldPath: string
  /** Importance tier for visual hierarchy */
  tier: ImportanceTier
  /** Current depth in the tree (for PrimitiveRenderer) */
  depth: number
  /** Optional context menu handler */
  onContextMenu?: (e: React.MouseEvent, fieldPath: string, fieldName: string, value: unknown) => void
}

/**
 * Style classes for each importance tier.
 */
interface TierStyles {
  /** Row container classes (padding) */
  row: string
  /** Label classes (size, weight, color) */
  label: string
  /** Value wrapper classes (size, weight, color) */
  value: string
}

/**
 * Get visual styles based on importance tier.
 * Implements three-tier hierarchy from Phase 15 research.
 */
export function getFieldStyles(tier: ImportanceTier): TierStyles {
  switch (tier) {
    case 'primary':
      return {
        row: 'py-2',
        label: 'text-base font-semibold text-gray-700',
        value: 'text-lg font-semibold text-gray-900',
      }
    case 'secondary':
      return {
        row: 'py-1',
        label: 'text-sm font-medium text-gray-500',
        value: 'text-sm text-gray-900',
      }
    case 'tertiary':
      return {
        row: 'py-0.5 opacity-80',
        label: 'text-xs font-medium text-gray-500',
        value: 'text-sm text-gray-600',
      }
  }
}

/** Check if a string value is a media URL (video/audio) that needs full-width rendering */
function isMediaUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(value)
    || /youtube\.com\/(watch\?v=|embed\/)/i.test(value)
    || /youtu\.be\//i.test(value)
    || /vimeo\.com\/\d+/i.test(value)
    || /\.(mp3|wav|ogg|flac|aac|m4a)(\?|$)/i.test(value)
}

/**
 * Shared field row component with importance-tier visual hierarchy.
 * Renders primitive fields with consistent styling based on their importance tier.
 */
export function FieldRow({
  fieldName,
  displayLabel,
  value,
  fieldDef,
  fieldPath,
  tier,
  depth,
  onContextMenu,
}: FieldRowProps) {
  const styles = getFieldStyles(tier)
  const stacked = isMediaUrl(value)

  // Context menu and long-press handlers
  const contextMenuHandlers = onContextMenu
    ? {
        onContextMenu: (e: React.MouseEvent) => onContextMenu(e, fieldPath, fieldName, value),
        onTouchStart: (e: React.TouchEvent) => {
          const touch = e.touches[0]
          if (!touch) return
          const touchX = touch.clientX
          const touchY = touch.clientY
          const timer = setTimeout(() => {
            onContextMenu(
              { clientX: touchX, clientY: touchY } as unknown as React.MouseEvent,
              fieldPath,
              fieldName,
              value
            )
          }, 800)
          ;(e.currentTarget as HTMLElement).dataset.longPressTimer = String(timer)
        },
        onTouchEnd: (e: React.TouchEvent) => {
          const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
          if (timer) clearTimeout(Number(timer))
        },
        onTouchMove: (e: React.TouchEvent) => {
          const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer
          if (timer) clearTimeout(Number(timer))
        },
      }
    : {}

  if (stacked) {
    return (
      <div
        className={`min-w-0 ${styles.row}`}
        {...contextMenuHandlers}
      >
        <div className={`${styles.label} mb-1`}>{displayLabel}:</div>
        <div className={`${styles.value} min-w-0`}>
          <PrimitiveRenderer data={value} schema={fieldDef.type} path={fieldPath} depth={depth} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-[auto_1fr] gap-x-3 items-start min-w-0 ${styles.row}`}
      {...contextMenuHandlers}
    >
      <div className={`${styles.label} whitespace-nowrap pt-0.5`}>{displayLabel}:</div>
      <div className={`${styles.value} min-w-0`}>
        <PrimitiveRenderer data={value} schema={fieldDef.type} path={fieldPath} depth={depth} />
      </div>
    </div>
  )
}
