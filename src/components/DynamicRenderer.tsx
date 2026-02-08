import { useState, useEffect, useCallback } from 'react'
import type { TypeSignature } from '../types/schema'
import type { NavStackEntry } from '../types/navigation'
import { getComponent } from './registry/ComponentRegistry'
import { JsonFallback } from './renderers/JsonFallback'
import { useConfigStore } from '../store/configStore'
import { useAppStore } from '../store/appStore'
import { NavigationProvider } from '../contexts/NavigationContext'
import { ComponentPicker } from './config/ComponentPicker'
import { ViewModeBadge } from './config/ViewModeBadge'
import { OnboardingTooltip } from './config/OnboardingTooltip'
import { Breadcrumb } from './navigation/Breadcrumb'
import { DrilldownModeToggle } from './navigation/DrilldownModeToggle'
import { getDefaultTypeName } from '../services/selection'

interface DynamicRendererProps {
  data: unknown
  schema: TypeSignature
  path?: string
  depth?: number
}

const MAX_DEPTH = 5

/** Get the list of alternative component types for a given schema */
function getAvailableTypes(schema: TypeSignature): string[] {
  if (schema.kind === 'array' && schema.items.kind === 'object') {
    return ['table', 'card-list', 'list', 'gallery', 'timeline', 'stats', 'json']
  }
  if (schema.kind === 'array' && schema.items.kind === 'primitive') {
    return ['primitive-list', 'chips', 'inline', 'grid', 'json']
  }
  if (schema.kind === 'object') {
    return ['detail', 'hero', 'tabs', 'split', 'json']
  }
  return [getDefaultTypeName(schema)]
}

export function DynamicRenderer({
  data,
  schema,
  path = '$',
  depth = 0,
}: DynamicRendererProps) {
  const { fieldConfigs, setFieldComponentType, drilldownMode } = useConfigStore()
  const { getAnalysisCache } = useAppStore()
  const [showPicker, setShowPicker] = useState(false)

  // Navigation stack — only meaningful at depth=0
  const [navStack, setNavStack] = useState<NavStackEntry[]>([])

  // Reset nav stack when root data changes
  useEffect(() => {
    if (depth === 0) setNavStack([])
  }, [data, depth])

  // Clear stack when switching to dialog or panel mode
  useEffect(() => {
    if (depth === 0 && (drilldownMode === 'dialog' || drilldownMode === 'panel')) setNavStack([])
  }, [drilldownMode, depth])

  // Drill-down handler passed via context
  const handleDrillDown = useCallback(
    (item: unknown, itemSchema: TypeSignature, label: string, itemPath: string) => {
      setNavStack(prev => [...prev, { data: item, schema: itemSchema, label, path: itemPath }])
    },
    []
  )

  // Breadcrumb navigation: pop stack to index (-1 = root)
  const handleBreadcrumbNav = useCallback((index: number) => {
    if (index < 0) {
      setNavStack([])
    } else {
      setNavStack(prev => prev.slice(0, index + 1))
    }
  }, [])

  // Listen for open-picker events from ComponentOverridePanel
  useEffect(() => {
    if (depth !== 0) return
    const handler = (e: Event) => {
      const { fieldPath } = (e as CustomEvent).detail
      if (fieldPath === path) {
        setShowPicker(true)
      }
    }
    document.addEventListener('api2ui:open-picker', handler)
    return () => document.removeEventListener('api2ui:open-picker', handler)
  }, [depth, path])

  // Guard against excessive depth
  if (depth > MAX_DEPTH) {
    return (
      <JsonFallback
        data={data}
        schema={schema}
        path={path}
        depth={depth}
      />
    )
  }

  // Determine active data: if page mode with nav stack, render stack top
  const isPageMode = drilldownMode === 'page'
  const stackTop = depth === 0 && isPageMode && navStack.length > 0
    ? navStack[navStack.length - 1]
    : null
  const activeData = stackTop ? stackTop.data : data
  const activeSchema = stackTop ? stackTop.schema : schema
  const activePath = stackTop ? stackTop.path : path

  // Look up component override for the active path
  const config = fieldConfigs[activePath]
  const override = config?.componentType

  // Determine current component type with precedence: User override > Smart default > Type-based default
  let currentType: string
  if (override) {
    // User override always wins (INT-01, INT-05)
    currentType = override
  } else {
    // Try smart selection from cache
    const cached = getAnalysisCache(activePath)
    if (cached?.selection && cached.selection.confidence >= 0.75) {
      // High-confidence smart default
      currentType = cached.selection.componentType
    } else {
      // Fall back to type-based default (v1.2 behavior preserved)
      currentType = getDefaultTypeName(activeSchema)
    }
  }

  // Get the appropriate component from the registry
  const Component = getComponent(activeSchema, override || undefined)

  // Determine component types for badge
  const defaultType = getDefaultTypeName(activeSchema)
  const availableTypes = getAvailableTypes(activeSchema)

  // Show badge on any renderer with alternatives
  const canShowBadge = availableTypes.length > 1

  const content = (
    <div>
      {/* Navigation bar: breadcrumb + mode toggle — only at depth=0 when data exists */}
      {depth === 0 && data != null && (
        <div className="flex items-center justify-between mb-2">
          {navStack.length > 0 ? (
            <Breadcrumb
              rootLabel="Results"
              stack={navStack}
              onNavigate={handleBreadcrumbNav}
            />
          ) : (
            <div />
          )}
          <DrilldownModeToggle />
        </div>
      )}

      {canShowBadge && (
        <div className="flex justify-end mb-1">
          <ViewModeBadge
            currentType={currentType}
            availableTypes={availableTypes}
            onSelect={(type) => {
              setFieldComponentType(activePath, type)
            }}
            onOpenPicker={() => setShowPicker(true)}
          />
        </div>
      )}
      {showPicker && (
        <ComponentPicker
          currentType={currentType}
          availableTypes={availableTypes}
          fieldPath={activePath}
          sampleData={activeData}
          sampleSchema={activeSchema}
          onSelect={(type) => {
            setFieldComponentType(activePath, type)
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
      <Component
        data={activeData}
        schema={activeSchema}
        path={activePath}
        depth={depth}
      />
      {depth === 0 && data != null && <OnboardingTooltip />}
    </div>
  )

  // At depth=0, wrap in NavigationProvider
  if (depth === 0) {
    return (
      <NavigationProvider value={{ drilldownMode, onDrillDown: handleDrillDown }}>
        {content}
      </NavigationProvider>
    )
  }

  return content
}
