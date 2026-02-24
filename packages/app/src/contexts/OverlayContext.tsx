import { createContext, useContext } from 'react'
import type { TypeSignature } from '../types/schema'

export interface OverlayNavItem {
  data: unknown
  schema: TypeSignature
  path: string
  label: string
}

interface OverlayNavContextValue {
  stack: OverlayNavItem[]
  push: (item: OverlayNavItem) => void
  goTo: (index: number) => void
}

const OverlayNavContext = createContext<OverlayNavContextValue | null>(null)

export const OverlayNavProvider = OverlayNavContext.Provider

export function useOverlayNav(): OverlayNavContextValue | null {
  return useContext(OverlayNavContext)
}

export function useInsideOverlay(): boolean {
  return useContext(OverlayNavContext) !== null
}
