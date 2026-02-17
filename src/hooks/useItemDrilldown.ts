import { useState, useCallback } from 'react'
import type { TypeSignature } from '../types/schema'
import { useNavigation } from '../contexts/NavigationContext'
import { useOverlayNav } from '../contexts/OverlayContext'
import { getItemLabel } from '../utils/itemLabel'
import { formatLabel } from '../utils/formatLabel'

export interface SelectedItem {
  data: unknown
  path: string
}

/** Extract the last field-name segment from a JSON path (skip array indices) */
function extractSectionName(path: string): string | null {
  const segments = path.split('.')
  const last = segments[segments.length - 1]
  if (!last || last === '$') return null
  // Strip trailing array index if present
  const clean = last.replace(/\[\d+\]$/, '')
  if (!clean || clean === '$') return null
  return clean
}

/**
 * Shared hook for array renderers to handle item drill-down across all three
 * modes (page, dialog, panel). When inside an overlay, pushes onto the
 * overlay navigation stack instead of opening another dialog.
 */
export function useItemDrilldown(
  itemSchema: TypeSignature,
  parentPath: string,
  parentData?: unknown,
  parentSchema?: TypeSignature,
) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const nav = useNavigation()
  const overlayNav = useOverlayNav()

  const handleItemClick = useCallback(
    (item: unknown, index: number, label?: string) => {
      const itemPath = `${parentPath}[${index}]`
      const itemLabel = label ?? getItemLabel(item)

      if (overlayNav) {
        // Inside an overlay: push section breadcrumb if drilling from a named section
        const sectionName = extractSectionName(parentPath)
        const alreadyInStack = sectionName && overlayNav.stack.some(
          entry => entry.path === parentPath
        )
        if (sectionName && !alreadyInStack && parentData !== undefined && parentSchema) {
          overlayNav.push({
            data: parentData,
            schema: parentSchema,
            path: parentPath,
            label: formatLabel(sectionName),
          })
        }
        overlayNav.push({ data: item, schema: itemSchema, path: itemPath, label: itemLabel })
      } else if (nav?.drilldownMode === 'page') {
        nav.onDrillDown(item, itemSchema, itemLabel, itemPath)
      } else {
        // Top-level dialog/panel: set local state for DrilldownContainer
        setSelectedItem({ data: item, path: itemPath })
      }
    },
    [nav, overlayNav, itemSchema, parentPath, parentData, parentSchema],
  )

  const clearSelection = useCallback(() => setSelectedItem(null), [])

  return { selectedItem, handleItemClick, clearSelection }
}
