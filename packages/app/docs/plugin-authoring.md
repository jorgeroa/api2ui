# api2ui Plugin Authoring Guide

Build custom field renderers for api2ui. Plugins extend how data fields are displayed — from simple text formatting to interactive maps, charts, and media players.

## Working Example

A complete, buildable template plugin lives in [`examples/api2ui-plugin-example/`](../examples/api2ui-plugin-example/). It renders a Confidence Gauge (semicircular SVG arc, red → yellow → green) and demonstrates both detection strategies: `semanticHints` and `customCategories`.

```bash
cd examples/api2ui-plugin-example
npm install
npm run build        # → dist/index.mjs
```

Copy the example directory as a starting point for your own plugin. See its [README](../examples/api2ui-plugin-example/README.md) for loading instructions.

## Quick Start

```bash
mkdir api2ui-plugin-my-gauge
cd api2ui-plugin-my-gauge
npm init -y
npm install react --save-peer
```

Create your plugin:

```tsx
// src/index.ts
import type { FieldPlugin, FieldRenderProps } from 'api2ui/types/plugins'

function AnimatedGauge({ value, fieldName }: FieldRenderProps) {
  const num = typeof value === 'number' ? value : 0
  return (
    <div className="gauge-container">
      <svg viewBox="0 0 100 50">
        <path d={`M 10 50 A 40 40 0 0 1 90 50`} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <path
          d={`M 10 50 A 40 40 0 0 1 90 50`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="8"
          strokeDasharray={`${(num / 100) * 126} 126`}
        />
      </svg>
      <span>{num}%</span>
    </div>
  )
}

export const plugins: FieldPlugin[] = [
  {
    id: '@my-org/animated-gauge',
    name: 'Animated Gauge',
    description: 'Animated arc gauge with gradient fill',
    accepts: {
      dataTypes: ['number'],
      validate: (value) => typeof value === 'number' && value >= 0 && value <= 100,
    },
    component: AnimatedGauge,
    source: 'community',
    version: '1.0.0',
    author: 'Your Name',
    tags: ['gauge', 'percentage', 'visualization'],
  },
]
```

## FieldPlugin Interface

Every plugin must implement the `FieldPlugin` interface:

```typescript
interface FieldPlugin {
  // Identity
  id: string                  // Unique ID: '@org/plugin-name' or 'my-plugin'
  name: string                // Display name shown in ComponentPicker
  description: string         // Tooltip description
  icon?: string | ReactNode   // Thumbnail icon (emoji or React element)

  // Compatibility
  accepts: {
    dataTypes: DataType[]           // What data types this plugin can render
    semanticHints?: SemanticCategory[]  // Preferred semantic categories (maps to core detection)
    validate?: (value: unknown, context: FieldContext) => boolean  // Runtime compatibility check
  }

  // Rendering
  component: React.ComponentType<FieldRenderProps>

  // Metadata
  source: 'core' | 'community' | 'premium'
  version: string             // SemVer
  author?: string
  tags?: string[]             // Searchable in ComponentPicker

  // Custom detection (optional)
  customCategories?: PluginSemanticCategory[]
}
```

### DataType Values

| DataType   | Description |
|-----------|-------------|
| `'string'`  | String values |
| `'number'`  | Numeric values |
| `'boolean'` | Boolean values |
| `'date'`    | Date/timestamp strings |
| `'object'`  | Nested objects |
| `'array'`   | Arrays |

### FieldRenderProps

Props passed to your component when rendering:

```typescript
interface FieldRenderProps {
  value: unknown                    // The actual data value
  fieldName: string                 // Raw field name ('price', 'rating')
  fieldPath: string                 // Full JSON path ('$.products[0].price')
  schema: TypeSignature             // Type info from schema inference
  semantics?: SemanticMetadata      // Detection result (category, confidence)
  context?: {
    parentObject?: Record<string, unknown>  // Sibling fields for contextual rendering
    siblingFields?: Map<string, unknown>
  }
}
```

## Two Strategies for Semantic Detection

### Strategy 1: Override an existing core category

Use `semanticHints` when your plugin provides a better renderer for a category that api2ui already detects (rating, price, status, email, geo, etc.).

```typescript
{
  id: '@maps/mapbox-pin',
  name: 'Mapbox Map',
  accepts: {
    dataTypes: ['object'],
    semanticHints: ['geo'],  // Uses core 'geo' detection
  },
  // ...
}
```

Your plugin appears as an alternative in the ComponentPicker for fields detected as `geo`. Users select it, and their preference persists.

### Strategy 2: Declare a custom category

Use `customCategories` when your plugin detects a data pattern that api2ui doesn't know about.

```typescript
{
  id: '@viz/network-graph',
  name: 'Network Graph',
  accepts: { dataTypes: ['array'] },
  customCategories: [{
    id: '@viz/network-data',
    name: 'Network Data',
    description: 'Array of nodes with source/target connections',
    namePatterns: [/nodes?/i, /edges?/i, /connections?/i, /graph/i, /network/i],
    nameKeywords: ['nodes', 'edges', 'links', 'connections', 'vertices'],
    validate: (value) => {
      if (!Array.isArray(value) || value.length === 0) return false
      const first = value[0]
      return first && typeof first === 'object' && ('source' in first || 'target' in first)
    },
  }],
  // ...
}
```

Custom categories use regex/keyword matching (not embeddings) and compete alongside core categories in the scoring pipeline. Highest confidence wins.

## Package Structure

Plugin npm packages should follow the naming convention `api2ui-plugin-*`:

```
api2ui-plugin-my-gauge/
  src/
    index.ts          # Exports: plugins: FieldPlugin[]
    AnimatedGauge.tsx  # Component implementation
  package.json
  tsconfig.json
```

### package.json

```json
{
  "name": "api2ui-plugin-my-gauge",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "keywords": ["api2ui-plugin", "gauge", "visualization"]
}
```

### Module Export

Your package must export a `plugins` array:

```typescript
// Named export (preferred)
export const plugins: FieldPlugin[] = [...]

// Default export (also supported)
export default plugins
```

## Installation

Users install plugins through the Settings panel in api2ui:

1. Open **Configure View** > **Plugins**
2. Click **Install plugin**
3. Enter the npm package name or CDN URL
4. The plugin loads and its components become available in the ComponentPicker

Programmatic installation:

```typescript
import { usePluginStore } from 'api2ui/store/pluginStore'

usePluginStore.getState().installPlugin({
  id: '@my-org/animated-gauge',
  name: 'Animated Gauge',
  source: 'npm',
  package: 'api2ui-plugin-my-gauge',
  version: '1.0.0',
  enabled: true,
})
```

## Best Practices

1. **Declare `dataTypes` accurately** — only list types your component can actually render
2. **Use `validate`** for fine-grained compatibility — prevents your component from appearing for incompatible values
3. **Handle edge cases** — null values, empty strings, unexpected types. Always render something.
4. **Use `e.stopPropagation()`** on interactive elements — prevents table row clicks when users interact with your component
5. **Be responsive** — use ResizeObserver or container queries to adapt to narrow containers (table cells are ~200px wide)
6. **Keep bundle size small** — lazy-load heavy dependencies
7. **Use semantic `tags`** — helps users find your plugin in the ComponentPicker search

## Core Plugin IDs

These are the built-in plugins. Use `semanticHints` to compete with them:

| Plugin ID | Category | Data Type |
|-----------|----------|-----------|
| `core/text` | default | string |
| `core/number` | default | number |
| `core/boolean-badge` | default | boolean |
| `core/star-rating` | rating | number |
| `core/currency` | price | number, string |
| `core/status-badge` | status | string, boolean |
| `core/formatted-date` | date, timestamp | string, date |
| `core/email-link` | email | string |
| `core/phone-link` | phone | string |
| `core/link` | url | string |
| `core/image` | image | string |
| `core/color-swatch` | — | string |
| `core/code-block` | — | string |
| `core/copyable` | uuid | string |
| `core/progress-bar` | — | number |
| `core/percentage` | — | number |
| `core/compact-number` | — | number |
| `core/dot-indicator` | status | string |
| `core/markdown` | — | string |
| `core/relative-time` | timestamp | string, date |
| `core/checkbox` | — | boolean |
| `core/map-pin` | geo | object, array |
| `core/map-link` | geo | object, array, string |
| `core/coordinates` | geo | object, array |
| `core/formatted-address` | — | object |
| `core/stat-card` | — | number, string |
| `core/sparkline` | — | array |
| `core/line-chart` | — | array |
| `core/bar-chart` | — | array |
| `core/pie-chart` | — | array |
| `core/video-player` | video | string |
| `core/audio-player` | audio | string |
| `core/image-gallery` | — | array |
