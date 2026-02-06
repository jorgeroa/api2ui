import { useState } from 'react'
import { useLayoutStore } from '../../store/layoutStore'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { LayoutSwitcher } from './LayoutSwitcher'
import { SidebarLayout } from './SidebarLayout'
import { TopBarLayout } from './TopBarLayout'
import { SplitLayout } from './SplitLayout'
import { DrawerLayout } from './DrawerLayout'

interface LayoutContainerProps {
  parameters: React.ReactNode
  results: React.ReactNode
  endpoint: string // Used for per-endpoint layout preference
  className?: string
}

/**
 * LayoutContainer - Orchestrator for all layout modes
 *
 * Implements LAYOUT-01: User-selectable layout presets
 *
 * Responsibilities:
 * - Reads layout preference from store (per-endpoint)
 * - Detects mobile viewport (<768px)
 * - Renders appropriate layout component
 * - Preserves form state during layout switches (via ReactNode mounting)
 * - Includes LayoutSwitcher on desktop
 * - Includes drawer trigger button on mobile
 */
export function LayoutContainer({
  parameters,
  results,
  endpoint,
  className = ''
}: LayoutContainerProps) {
  // Get layout preference for this endpoint
  const { getLayout, setLayout } = useLayoutStore()
  const layout = getLayout(endpoint)

  // Detect mobile viewport
  const isMobile = useMediaQuery('(max-width: 767px)')

  // Drawer state for mobile
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className={className}>
      {/* Layout switcher - desktop only */}
      {!isMobile && (
        <div className="flex justify-end mb-4">
          <LayoutSwitcher
            value={layout}
            onChange={(newLayout) => setLayout(endpoint, newLayout)}
          />
        </div>
      )}

      {/* Mobile: always drawer */}
      {isMobile && (
        <>
          {/* Floating action button to open drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Open parameters"
          >
            {/* Filter/sliders icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-current"
            >
              <path
                d="M3 6h4M7 6a2 2 0 104 0 2 2 0 00-4 0zM11 6h10M3 12h10M13 12a2 2 0 104 0 2 2 0 00-4 0zM17 12h4M3 18h4M7 18a2 2 0 104 0 2 2 0 00-4 0zM11 18h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <DrawerLayout
            parameters={parameters}
            results={results}
            isOpen={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
        </>
      )}

      {/* Desktop: selected layout */}
      {!isMobile && layout === 'sidebar' && (
        <SidebarLayout parameters={parameters} results={results} />
      )}
      {!isMobile && layout === 'topbar' && (
        <TopBarLayout parameters={parameters} results={results} />
      )}
      {!isMobile && layout === 'split' && (
        <SplitLayout parameters={parameters} results={results} />
      )}
    </div>
  )
}
