import type { ReactNode } from 'react'

interface FieldControlsProps {
  fieldPath: string
  fieldName?: string
  isVisible: boolean
  customLabel?: string
  children: ReactNode
}

/**
 * FieldControls is now a simple passthrough component.
 * Visibility controls have been moved to DraggableField for a cleaner hover-reveal UX.
 * This component is kept for backward compatibility but can be removed in the future.
 */
export function FieldControls({ children }: FieldControlsProps) {
  return <>{children}</>
}
