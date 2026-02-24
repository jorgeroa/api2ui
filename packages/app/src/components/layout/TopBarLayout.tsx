import React from 'react';

interface TopBarLayoutProps {
  parameters: React.ReactNode;
  results: React.ReactNode;
  className?: string;
}

/**
 * Top bar layout component that positions parameters in a responsive grid above results.
 *
 * Layout pattern: LAYOUT-03 (top bar mode)
 * - Parameters: Responsive CSS Grid (auto-fit, 2-3 columns), top section
 * - Results: Flexible height, below parameters, scrollable
 *
 * Grid adapts to parameter count and viewport width using auto-fit minmax pattern.
 */
export function TopBarLayout({ parameters, results, className = '' }: TopBarLayoutProps) {
  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {/* Parameters Panel - Top Section */}
      <div className="border-b border-border p-4">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))'
          }}
        >
          {parameters}
        </div>
      </div>

      {/* Results Panel - Bottom Section */}
      <div className="flex-1 overflow-y-auto p-4">
        {results}
      </div>
    </div>
  );
}
