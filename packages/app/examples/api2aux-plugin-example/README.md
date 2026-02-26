# api2aux-plugin-example

A template plugin for [api2aux](https://github.com/your-org/api2aux) — demonstrates how to build, package, and load a custom field renderer.

## What it does

**Confidence Gauge** renders numeric 0-100 values as a semicircular SVG arc that fills from red (0) through yellow (50) to green (100). It handles edge cases: non-numeric values show "N/A", null shows "No data", and out-of-range values are clamped.

## Project structure

```
src/
  index.ts              # Plugin entry — exports `plugins` array
  ConfidenceGauge.tsx   # The React component
  types.ts              # Inlined minimal types (no api2aux dependency)
package.json
tsconfig.json
vite.config.ts          # Vite library mode build
```

## Build

```bash
pnpm install
pnpm build
```

Output: `dist/index.mjs` — an ES module ready for browser import.

## Loading into api2aux

### Option 1: URL (development)

Serve the built file and load via URL:

```bash
pnpm build
pnpm dlx serve dist -l 3001 --cors
```

In api2aux: Configure View > Plugins > Install plugin > enter `http://localhost:3001/index.mjs`

### Option 2: Local path (development)

Point api2aux at your local build output:

```
source: 'local'
path: '/absolute/path/to/dist/index.mjs'
```

### Option 3: npm (production)

```bash
pnpm publish
```

In api2aux: Configure View > Plugins > Install plugin > enter `api2aux-plugin-example`

## Creating your own plugin

1. Copy this directory
2. Rename `api2aux-plugin-example` to `api2aux-plugin-your-name` in `package.json`
3. Replace `ConfidenceGauge.tsx` with your component
4. Update `src/index.ts`:
   - Change the plugin `id` (use `@your-org/plugin-name` format)
   - Set `accepts.dataTypes` to match your component's needs
   - Add `semanticHints` if you're overriding a core category
   - Add `customCategories` if you're detecting a new data pattern
   - Add a `validate` function if your component only works with specific value ranges
5. Build and test

## FieldPlugin interface

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique ID: `@org/name` |
| `name` | Yes | Display name in ComponentPicker |
| `description` | Yes | Tooltip text |
| `accepts.dataTypes` | Yes | Array of `'string'`, `'number'`, `'boolean'`, `'date'`, `'object'`, `'array'` |
| `accepts.semanticHints` | No | Core categories to compete with: `'rating'`, `'price'`, `'status'`, etc. |
| `accepts.validate` | No | Runtime check — return `false` to skip incompatible values |
| `component` | Yes | React component receiving `FieldRenderProps` |
| `source` | Yes | `'community'` for external plugins |
| `version` | Yes | SemVer string |
| `customCategories` | No | Declare new detection categories with regex patterns |

## Further reading

- [Plugin Authoring Guide](../../docs/plugin-authoring.md) — full reference
