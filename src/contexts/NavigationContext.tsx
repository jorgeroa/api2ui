import { createContext, useContext } from 'react'
import type { TypeSignature } from '../types/schema'
import type { DrilldownMode } from '../types/navigation'

interface NavigationContextValue {
  drilldownMode: DrilldownMode
  onDrillDown: (item: unknown, schema: TypeSignature, label: string, path: string) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export const NavigationProvider = NavigationContext.Provider

export function useNavigation(): NavigationContextValue | null {
  return useContext(NavigationContext)
}
