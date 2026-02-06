import React from 'react'

interface SplitLayoutProps {
  parameters: React.ReactNode
  results: React.ReactNode
  className?: string
}

/**
 * SplitLayout - Desktop split view with 30/70 ratio
 *
 * Provides a vertical split between parameters (30%) and results (70%).
 * Both panels independently scrollable.
 */
export function SplitLayout({
  parameters,
  results,
  className = ''
}: SplitLayoutProps) {
  return (
    <div className={`flex flex-row min-h-0 ${className}`}>
      {/* Parameters panel - 30% */}
      <div className="w-[30%] shrink-0 border-r border-gray-200 overflow-y-auto p-4">
        {parameters}
      </div>

      {/* Results panel - 70% */}
      <div className="flex-1 overflow-y-auto p-4">
        {results}
      </div>
    </div>
  )
}
