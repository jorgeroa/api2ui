import { createContext, useContext } from 'react'

/**
 * Tracks whether rendering is happening inside a Dialog/Panel overlay.
 * Used to prevent stacking overlays — nested arrays inside an overlay
 * expand inline instead of opening another dialog.
 */
const OverlayContext = createContext(false)

export const OverlayProvider = OverlayContext.Provider

export function useInsideOverlay(): boolean {
  return useContext(OverlayContext)
}
