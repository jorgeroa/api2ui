import type { TypeSignature } from '../../types/schema'
import type { SelectedItem } from '../../hooks/useItemDrilldown'
import { useNavigation } from '../../contexts/NavigationContext'
import { DetailModal } from './DetailModal'
import { DetailPanel } from './DetailPanel'

interface DrilldownContainerProps {
  selectedItem: SelectedItem | null
  itemSchema: TypeSignature
  onClose: () => void
}

/**
 * Renders the appropriate drill-down overlay (modal or side panel) based on
 * the current drilldown mode. Centralises the conditional rendering that was
 * previously duplicated across every array renderer.
 */
export function DrilldownContainer({ selectedItem, itemSchema, onClose }: DrilldownContainerProps) {
  const nav = useNavigation()

  if (!selectedItem) return null

  if (nav?.drilldownMode === 'panel') {
    return (
      <DetailPanel
        item={selectedItem.data}
        schema={itemSchema}
        itemPath={selectedItem.path}
        onClose={onClose}
      />
    )
  }

  return (
    <DetailModal
      item={selectedItem.data}
      schema={itemSchema}
      itemPath={selectedItem.path}
      onClose={onClose}
    />
  )
}
