# Changelog

## [0.5.0] - 2026-02-16

### Added

- **Embedding-based semantic engine**: Field classification now uses `multilingual-e5-small` embeddings with cosine similarity against 21 category centroids. Supports field names in English, Spanish, French, German, and Portuguese.
- **Shareable links**: Click "Share" to copy a URL that encodes the API endpoint, field configuration, theme, and layout. Recipients see the same view without any setup.
- **API authentication**: Bearer token, Basic Auth, API Key (header/query), and query parameter authentication. Credentials stored in sessionStorage (per-tab).
- **Dev-mode CORS proxy**: Vite proxy at `/api-proxy/` for local development with CORS-restricted APIs.
- **GitHub Profile example**: New example card on the welcome screen.
- **Feature highlights**: Welcome screen shows feature cards for semantic detection, OpenAPI support, shareable links, and authentication.
- **Contributor guide**: `CONTRIBUTING.md` with setup, testing, and contribution workflows.

### Changed

- **Value validators hardened**: Status uses heuristic detection instead of hardcoded English enums. Rating range narrowed to 0-10. SKU requires mixed letters and numbers. Name, title, description, and address validators are more discriminating.
- **Competitive scoring**: Embedding classifier uses rank-normalized cosine similarity to handle the dense similarity space (0.85-0.97 range).
- **README rewritten**: Full documentation of features, architecture, and tech stack.

### Fixed

- Address validator no longer matches single-token codes like "SKU-12345".
- Format hint weight now correctly contributes to confidence scores.

## [0.4.0] - 2026-02-14

### Added

- API authentication (Bearer, Basic, API Key, query params)
- OpenAPI security scheme detection
- Auth credential persistence in sessionStorage

## [0.3.0] - 2026-02-13

### Added

- Smart component selection with pattern detection heuristics
- Field importance scoring and hierarchical grouping
- Context-aware components for nested data
- Grouped detail view with hero, overview, and accordion sections

## [0.2.0] - 2026-02-12

### Added

- URL parameter parsing with type inference
- Layout system (sidebar, split, top-bar, drawer)
- Rich input components (date picker, range slider, tag input, enum checkboxes)
- Parameter persistence and debounced re-fetch

## [0.1.0] - 2026-02-11

### Added

- Smart visual defaults (hero images, thumbnails, typography hierarchy)
- Component switching with ViewModeBadge carousel
- Configuration panel with drag-and-drop field reordering
- Pagination controls

## [0.0.0] - 2026-02-10

### Added

- Core rendering engine (table, card list, list, detail views)
- JSON schema inference from API responses
- Semantic field detection (22 categories)
- OpenAPI 2.0 and 3.x spec support
- Theme presets (light, dark, compact, spacious)
- Master-detail navigation with breadcrumbs
