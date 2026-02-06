import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import type { InferredType } from '../../services/urlParser/typeInferrer'

interface TypeIconProps {
  type: string // Current type (from inference or override)
  onTypeChange: (type: string) => void
  disabled?: boolean // Disable dropdown in certain contexts
}

// All available types for the dropdown
const AVAILABLE_TYPES: { type: InferredType; label: string }[] = [
  { type: 'string', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'boolean', label: 'Boolean' },
  { type: 'date', label: 'Date' },
  { type: 'email', label: 'Email' },
  { type: 'url', label: 'URL' },
  { type: 'coordinates', label: 'Coordinates' },
  { type: 'zip', label: 'ZIP Code' },
]

/**
 * SVG icon components for each type.
 * Uses simple inline SVGs for bundle efficiency.
 */
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function AtSymbolIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.404 14.596A6.5 6.5 0 1116.5 10a1.25 1.25 0 01-2.5 0 4 4 0 10-.571 2.06A2.75 2.75 0 0018 10a8 8 0 10-2.343 5.657.75.75 0 00-1.06-1.06 6.5 6.5 0 01-9.193 0zM10 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function HashtagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M9.493 2.853a.75.75 0 00-1.486-.205L7.545 6H4.198a.75.75 0 000 1.5h3.14l-.69 5H3.302a.75.75 0 000 1.5h3.14l-.435 3.148a.75.75 0 001.486.205L7.955 14h4.197l-.435 3.148a.75.75 0 001.486.205l.461-3.353h3.534a.75.75 0 000-1.5h-3.327l.69-5h3.291a.75.75 0 000-1.5h-3.084l.461-3.347a.75.75 0 00-1.486-.205L13.28 6H9.083l.41-3.147zM8.877 7.5l-.69 5h4.196l.69-5H8.876z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ToggleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M13 3a7 7 0 00-7 7 7 7 0 007 7h.5a.5.5 0 00.5-.5V17a7 7 0 000-14v-.5a.5.5 0 00-.5-.5H13zm-3 7a3 3 0 116 0 3 3 0 01-6 0z"
        clipRule="evenodd"
      />
      <path d="M7 10a3 3 0 100 6 3 3 0 000-6z" />
    </svg>
  )
}

function TextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.157 2.176a1.5 1.5 0 00-1.147 0l-4.084 1.69A1.5 1.5 0 002 5.25v10.877a1.5 1.5 0 002.074 1.386l3.51-1.452 4.26 1.762a1.5 1.5 0 001.146 0l4.083-1.69A1.5 1.5 0 0018 14.75V3.872a1.5 1.5 0 00-2.073-1.386l-3.51 1.452-4.26-1.762zM7.58 5a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 017.58 5zm5.59 2.75a.75.75 0 00-1.5 0v6.5a.75.75 0 001.5 0v-6.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Get the icon component for a given type.
 */
function getTypeIcon(type: string): React.FC<{ className?: string }> {
  switch (type) {
    case 'date':
      return CalendarIcon
    case 'email':
      return AtSymbolIcon
    case 'url':
      return LinkIcon
    case 'coordinates':
      return MapPinIcon
    case 'number':
      return HashtagIcon
    case 'boolean':
      return ToggleIcon
    case 'zip':
      return MapIcon
    case 'string':
    default:
      return TextIcon
  }
}

/**
 * Get the display label for a type.
 */
function getTypeLabel(type: string): string {
  const found = AVAILABLE_TYPES.find((t) => t.type === type)
  return found?.label ?? 'Text'
}

/**
 * Type icon with dropdown for overriding inferred parameter types.
 *
 * Shows a subtle icon indicating the detected/selected type. When clicked,
 * opens a dropdown allowing users to change the input type.
 */
export function TypeIcon({ type, onTypeChange, disabled = false }: TypeIconProps) {
  const IconComponent = getTypeIcon(type)

  return (
    <Menu as="div" className="relative inline-block">
      <MenuButton
        className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        title={`Type: ${getTypeLabel(type)}. Click to change.`}
      >
        <IconComponent className="w-4 h-4 text-gray-400 hover:text-gray-600" />
      </MenuButton>

      <MenuItems
        className="absolute right-0 z-10 mt-1 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        anchor="bottom end"
      >
        <div className="py-1">
          {AVAILABLE_TYPES.map(({ type: optionType, label }) => {
            const OptionIcon = getTypeIcon(optionType)
            const isSelected = optionType === type

            return (
              <MenuItem key={optionType}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => onTypeChange(optionType)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                      ${focus ? 'bg-gray-50' : ''}
                      ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-700'}
                    `}
                  >
                    <OptionIcon
                      className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    {label}
                    {isSelected && (
                      <svg
                        className="w-4 h-4 ml-auto text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </MenuItem>
            )
          })}
        </div>
      </MenuItems>
    </Menu>
  )
}
