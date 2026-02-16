# api2ui

Paste a JSON API URL and instantly see it rendered as a beautiful, interactive UI. Semantic field detection automatically formats prices, emails, dates, ratings, images, and more.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and paste any JSON API URL, or try a built-in example.

## Features

### Semantic Field Detection
Fields are automatically classified using an embedding-based engine with 21 semantic categories (price, email, phone, rating, image, status, etc.) across 5 languages (EN/ES/FR/DE/PT). Prices get currency formatting, emails become clickable links, images render inline, and ratings display as stars.

### OpenAPI/Swagger Support
Paste a spec URL to browse tagged endpoints in a sidebar, fill in parameters with auto-generated forms, and execute operations. Supports OpenAPI 2.0 and 3.x.

### Component Switching
Switch between table, card list, and list views via a dropdown badge. The system auto-selects the best component based on data shape, but you can override per-field.

### Configure Mode
Hide/show fields, rename labels, reorder columns via drag-and-drop, and override component types. All settings persist to localStorage.

### Theming
Light, dark, compact, and spacious presets plus fine-grained control over colors, typography, spacing, and border radius. Supports per-endpoint style overrides.

### Authentication
Bearer token, Basic Auth, API Key (header/query), and query parameter authentication. Credentials are stored in sessionStorage (per-tab, not shared).

### Shareable Links
Click "Share" to copy a URL that encodes the API endpoint and view configuration. Recipients see the same data and layout without needing to configure anything.

## Built-in Examples

| Example | URL | Showcases |
|---------|-----|-----------|
| User Directory | `jsonplaceholder.typicode.com/users` | Table with email, phone, address detection |
| Single User | `jsonplaceholder.typicode.com/users/1` | Detail view with nested objects |
| Product Catalog | `dummyjson.com/products` | Card grid with images, prices, ratings |
| Pet Store API | `petstore.swagger.io/v2/swagger.json` | OpenAPI multi-endpoint navigation |
| GitHub Profile | `api.github.com/users/octocat` | Avatar, URL, date, name detection |

## Tech Stack

- **React 19** + TypeScript
- **Vite** for dev server and builds
- **Zustand** for state management with localStorage/sessionStorage persistence
- **Tailwind CSS 4** for styling
- **multilingual-e5-small** embeddings (pre-computed at build time) for semantic classification
- **Headless UI** for accessible dialogs
- **@dnd-kit** for drag-and-drop column reordering
- **@apidevtools/swagger-parser** for OpenAPI spec dereferencing

## Project Structure

```
src/
  components/
    config/          Configuration panel, theme, field controls
    renderers/       Table, CardList, List, Detail, Primitive, JSON
    navigation/      Sidebar, Breadcrumb, DrilldownModeToggle
    auth/            Authentication forms and lock icon
    openapi/         Operation selector
    forms/           Parameter input forms
  services/
    api/             Fetch with CORS detection and typed errors
    semantic/        Embedding-based field classification engine
    sharing/         Shareable link encoding/decoding
    analysis/        Field importance scoring and grouping
    openapi/         OpenAPI 2.0 & 3.x parser
    schema/          JSON schema inference engine
    selection/       Schema-to-component selection heuristics
    urlParser/       URL parameter parsing
  store/             Zustand stores (app, config, auth, layout, parameters)
scripts/
  categories.json    Semantic category definitions (21 categories, 652 tokens)
  generate-embeddings.mjs  Build-time embedding generation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests with Vitest |
| `npm run lint` | Run ESLint |
| `npm run generate-embeddings` | Regenerate semantic embeddings |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up the dev environment, add semantic categories, create value validators, and add rendering components.

## License

MIT
