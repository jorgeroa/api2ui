import { useState, useCallback } from 'react'
import type { TypeSignature } from '../types/schema'
import { useNavigation } from '../contexts/NavigationContext'
import { getItemLabel } from '../utils/itemLabel'

export interface SelectedItem {
  data: unknown
  path: string
}

/**
 * Shared hook for array renderers to handle item drill-down across all three
 * modes (page, dialog, panel). Stores the selected item along with its actual
 * JSON path so that dialog/panel modes get the same smart component selection
 * as page mode.
 */
export function useItemDrilldown(itemSchema: TypeSignature, parentPath: string) {
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const nav = useNavigation()

  const handleItemClick = useCallback(
    (item: unknown, index: number, label?: string) => {
      const itemPath = `${parentPath}[${index}]`
      if (nav?.drilldownMode === 'page') {
        nav.onDrillDown(item, itemSchema, label ?? getItemLabel(item), itemPath)
      } else {
        setSelectedItem({ data: item, path: itemPath })
      }
    },
    [nav, itemSchema, parentPath],
  )

  const clearSelection = useCallback(() => setSelectedItem(null), [])

  return { selectedItem, handleItemClick, clearSelection }
}
