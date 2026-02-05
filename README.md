# api2ui

Paste a JSON API URL and instantly see it rendered as a beautiful, interactive UI. Supports direct JSON endpoints and OpenAPI/Swagger specs.

## Features

- **Auto-rendering** -- Fetches JSON data, infers the schema, and picks the best component (table, cards, list, detail view, or raw JSON)
- **OpenAPI/Swagger support** -- Paste a spec URL to browse tagged endpoints in a sidebar, fill in parameters, and execute operations
- **Component switching** -- Switch between table, card list, and list views via a dropdown badge or a side-by-side preview picker
- **Page & dialog navigation** -- Drill into nested data inline with breadcrumb navigation, or use a modal dialog. Toggle between modes at any time
- **Configure mode** -- Hide/show fields, rename labels, reorder columns via drag-and-drop, and override component types per field
- **Theming** -- Light, dark, compact, and spacious presets plus fine-grained control over colors, typography, spacing, and border radius. Supports per-endpoint style overrides
- **Persistent config** -- All settings (field configs, theme, drilldown mode) are saved to localStorage

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and try one of the built-in examples:

| Example          | URL                                                  | Type    |
|------------------|------------------------------------------------------|---------|
| User Directory   | `https://jsonplaceholder.typicode.com/users`         | Array   |
| Single User      | `https://jsonplaceholder.typicode.com/users/1`       | Object  |
| Product Catalog  | `https://dummyjson.com/products`                     | Array   |
| Pet Store API    | `https://petstore.swagger.io/v2/swagger.json`        | OpenAPI |

## Tech stack

- **React 19** + TypeScript
- **Vite** for dev server and builds
- **Zustand** for state management with localStorage persistence
- **Tailwind CSS 4** for styling
- **Headless UI** for accessible dialogs and disclosures
- **@dnd-kit** for drag-and-drop column reordering
- **@apidevtools/swagger-parser** for OpenAPI spec dereferencing

## Project structure

```
src/
  components/
    config/          Configuration panel, theme, field controls
    renderers/       Table, CardList, List, Detail, Primitive, JSON
    navigation/      Sidebar, Breadcrumb, DrilldownModeToggle
    detail/          Detail modal (dialog mode)
    openapi/         Operation selector
    forms/           Parameter input forms
    error/           Error display with retry
    loading/         Skeleton loaders
    registry/        Schema-to-component mapping
  services/
    api/             Fetch with CORS detection and typed errors
    openapi/         OpenAPI 2.0 & 3.x parser
    schema/          JSON schema inference engine
  store/             Zustand stores (app state + config)
  contexts/          React contexts (navigation)
  hooks/             useAPIFetch orchestrator
  types/             TypeScript type definitions
  utils/             Shared utilities (image detection, item labels)
```

## Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Start dev server         |
| `npm run build`   | Type-check and build     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |
| `npm test`        | Run tests with Vitest    |

## License

MIT
