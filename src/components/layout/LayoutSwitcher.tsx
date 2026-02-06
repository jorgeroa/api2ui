import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { LayoutMode } from '../../store/layoutStore'

interface LayoutSwitcherProps {
  value: LayoutMode
  onChange: (value: LayoutMode) => void
  className?: string
}

/**
 * LayoutSwitcher - Icon-only toggle group for switching layout modes
 *
 * Implements LAYOUT-01: User-selectable layout presets
 *
 * Features:
 * - Three layout options: sidebar, topbar, split
 * - Inline SVG icons representing each layout mode
 * - Native title attribute tooltips
 * - Radix Toggle Group for accessibility (roving tabindex, ARIA)
 */
export function LayoutSwitcher({ value, onChange, className = '' }: LayoutSwitcherProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(newValue) => {
        // Prevent deselection - always have a layout selected
        if (newValue) {
          onChange(newValue as LayoutMode)
        }
      }}
      aria-label="Layout mode"
      className={`inline-flex border border-gray-200 rounded-lg ${className}`}
    >
      {/* Sidebar layout */}
      <ToggleGroup.Item
        value="sidebar"
        aria-label="Sidebar layout"
        title="Sidebar layout"
        className="p-2 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 rounded-l-lg"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-current"
        >
          {/* Left sidebar filled, right main area outlined */}
          <rect x="2" y="3" width="5" height="14" fill="currentColor" />
          <rect x="8" y="3" width="10" height="14" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </ToggleGroup.Item>

      {/* Top bar layout */}
      <ToggleGroup.Item
        value="topbar"
        aria-label="Top bar layout"
        title="Top bar layout"
        className="p-2 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 border-l border-gray-200"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-current"
        >
          {/* Top bar filled, bottom main area outlined */}
          <rect x="2" y="3" width="16" height="4" fill="currentColor" />
          <rect x="2" y="8" width="16" height="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </ToggleGroup.Item>

      {/* Split view layout */}
      <ToggleGroup.Item
        value="split"
        aria-label="Split view layout"
        title="Split view layout"
        className="p-2 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 border-l border-gray-200 rounded-r-lg"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-current"
        >
          {/* Both panels outlined (vertical split) */}
          <rect x="2" y="3" width="6" height="14" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="10" y="3" width="8" height="14" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  )
}
