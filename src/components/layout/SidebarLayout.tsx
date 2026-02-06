import React from 'react';

interface SidebarLayoutProps {
  parameters: React.ReactNode;
  results: React.ReactNode;
  className?: string;
}

/**
 * Sidebar layout component that positions parameters on the left (fixed width)
 * and results on the right (flexible width).
 *
 * Layout pattern: LAYOUT-02 (sidebar mode)
 * - Parameters: 16rem (256px) fixed width, left side, scrollable
 * - Results: Flex-1, right side, scrollable
 */
export function SidebarLayout({ parameters, results, className = '' }: SidebarLayoutProps) {
  return (
    <div className={`flex flex-row min-h-0 ${className}`}>
      {/* Parameters Panel - Left Side */}
      <div className="w-64 shrink-0 border-r border-gray-200 overflow-y-auto p-4">
        {parameters}
      </div>

      {/* Results Panel - Right Side */}
      <div className="flex-1 overflow-y-auto p-4">
        {results}
      </div>
    </div>
  );
}
