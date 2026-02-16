import type { TypeSignature } from '../../types/schema'
import type { SelectedItem } from '../../hooks/useItemDrilldown'
import { useNavigation } from '../../contexts/NavigationContext'
import { useInsideOverlay, OverlayProvider } from '../../contexts/OverlayContext'
import { DynamicRenderer } from '../DynamicRenderer'
import { DetailModal } from './DetailModal'
import { DetailPanel } from './DetailPanel'

interface DrilldownContainerProps {
  selectedItem: SelectedItem | null
  itemSchema: TypeSignature
  onClose: () => void
}

/**
 * Renders the appropriate drill-down view based on the current drilldown mode
 * and overlay context. Top-level uses modal or side panel overlays.
 * Inside an existing overlay, renders inline to avoid stacking dialogs.
 */
export function DrilldownContainer({ selectedItem, itemSchema, onClose }: DrilldownContainerProps) {
  const nav = useNavigation()
  const insideOverlay = useInsideOverlay()

  if (!selectedItem) return null

  // Already inside an overlay: render inline instead of stacking another
  if (insideOverlay) {
    return (
      <div className="mt-4 border border-border rounded-lg overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-border bg-gray-50 dark:bg-gray-800">
          <button
            onClick={onClose}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <div className="p-4">
          <OverlayProvider value={true}>
            <DynamicRenderer
              data={selectedItem.data}
              schema={itemSchema}
              path={selectedItem.path}
              depth={2}
            />
          </OverlayProvider>
        </div>
      </div>
    )
  }

  // Top-level: use overlay
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
