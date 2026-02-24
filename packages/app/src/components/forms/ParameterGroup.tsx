import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { humanizeGroupName } from '../../services/urlParser/groupUtils'

interface ParameterGroupProps {
  /** Raw group name (e.g., "filter") */
  groupName: string
  /** Parameter inputs to render inside */
  children: React.ReactNode
  /** Default: false (all collapsed per user decision) */
  defaultOpen?: boolean
}

/**
 * Accordion wrapper for grouped parameters.
 * Parameters with common prefixes (e.g., filter[name], filter[age])
 * auto-group into collapsible sections for reduced visual clutter.
 */
export function ParameterGroup({ groupName, children, defaultOpen = false }: ParameterGroupProps) {
  const displayName = humanizeGroupName(groupName)

  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <>
          <DisclosureButton className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-muted transition-colors rounded-md">
            <div className="flex items-center gap-2">
              <svg
                className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-semibold text-sm text-muted-foreground">{displayName}</span>
            </div>
          </DisclosureButton>
          <DisclosurePanel className="space-y-3 pl-4">
            {children}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  )
}
