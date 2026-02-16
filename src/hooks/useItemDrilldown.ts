import { useState, useCallback } from 'react'
import type { TypeSignature } from '../types/schema'
import { useNavigation } from '../contexts/NavigationContext'
import { useOverlayNav } from '../contexts/OverlayContext'
import { getItemLabel } from '../utils/itemLabel'

export interface SelectedItem {
  data: unknown
  path: string
}

/**
 * Shared hook for array renderers to handle item drill-down across all three
 * modes (page, dialog, panel). When inside an overlay, pushes onto the
 * overlay navigation stack instead of opening another dialog.
 */
export function useItemDrilldown(itemSchema: TypeSignature, parentPath: string) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const nav = useNavigation()
  const overlayNav = useOverlayNav()

  const handleItemClick = useCallback(
    (item: unknown, index: number, label?: string) => {
      const itemPath = `${parentPath}[${index}]`
      const itemLabel = label ?? getItemLabel(item)

      if (overlayNav) {
        // Inside an overlay: push onto the overlay navigation stack
        overlayNav.push({ data: item, schema: itemSchema, path: itemPath, label: itemLabel })
      } else if (nav?.drilldownMode === 'page') {
        nav.onDrillDown(item, itemSchema, itemLabel, itemPath)
      } else {
        // Top-level dialog/panel: set local state for DrilldownContainer
        setSelectedItem({ data: item, path: itemPath })
      }
    },
    [nav, overlayNav, itemSchema, parentPath],
  )

  const clearSelection = useCallback(() => setSelectedItem(null), [])

  return { selectedItem, handleItemClick, clearSelection }
}
