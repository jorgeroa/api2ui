# Technology Stack

**Project:** api2ui
**Researched:** 2026-02-01
**Confidence:** MEDIUM (training data + ecosystem patterns, limited live verification)

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|-----------|
| **React** | 18.3.x | UI framework | Component-based architecture perfect for dynamic rendering. Hooks enable clean state management. Largest ecosystem for UI component patterns. | MEDIUM |
| **TypeScript** | 5.6.x+ | Type safety | Critical for type inference from API schemas. Provides intellisense for dynamic component mapping. Catches runtime errors at compile time. | MEDIUM |
| **Vite** | 6.x | Build tool | Fast dev server, optimized HMR, out-of-box TypeScript support. Modern replacement for Create React App (which is deprecated). | MEDIUM |

**Rationale:** React dominates for dynamic UI rendering applications. The virtual DOM and component model align perfectly with runtime rendering from API data. TypeScript is non-negotiable for maintaining sanity when mapping unknown API schemas to UI components.

### OpenAPI/Schema Parsing
| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|-----------|
| **openapi-typescript** | 7.x | Generate types from OpenAPI | Converts OpenAPI schemas to TypeScript types at build/runtime. Industry standard for OpenAPI TypeScript integration. | LOW |
| **swagger-parser** | 10.x | Parse/validate OpenAPI | Validates and dereferences OpenAPI documents. Handles $ref resolution. Mature, widely used. | MEDIUM |

**Rationale:** For v1 with runtime schema inference, you need a parser that can validate and dereference OpenAPI specs. swagger-parser is battle-tested. openapi-typescript enables type-safe schema handling if you want compile-time types.

**Alternative approach:** For raw response inspection (no OpenAPI spec provided), use runtime type inference with libraries like:
- **zod** (3.x) - Runtime schema validation and type inference
- **json-schema-to-typescript** (15.x) - Generate types from JSON Schema

### HTTP Client
| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|-----------|
| **Axios** | 1.7.x+ | HTTP requests | Superior error handling, interceptors for auth, automatic JSON parsing. Better DX than fetch for complex scenarios. | MEDIUM |

**Alternative:** Native `fetch` API is sufficient for v1 (GET only, public APIs). Zero dependencies. Axios becomes valuable when adding auth, retries, or request transformation later.

**Recommendation:** Start with `fetch`, migrate to Axios when needed. Don't prematurely add dependencies.

### State Management
| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|-----------|
| **Zustand** | 4.x or 5.x | Global state | Minimal boilerplate, localStorage persistence built-in, TypeScript-first. Perfect for storing user configs. | MEDIUM |
| **React Context** | Built-in | Component state | For passing rendering context down component tree. No external dependency. | HIGH |

**Rationale:** For v1 with local storage configs, Zustand is ideal. It's lightweight (1KB), has built-in persistence middleware, and avoids Redux boilerplate. Use React Context for theme/mode switching (Configure/View).

**Anti-pattern:** Do NOT use Redux for this project. Overkill for config storage. Zustand or even localStorage + useState is sufficient.

### Styling
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|-----------|
| **Tailwind CSS** | 4.x | Utility-first CSS | Rapid UI development, easy customization, design system out of box. CSS customization requirement fits Tailwind's config model perfectly. | MEDIUM |
| **CSS Modules** | Built-in | Component-scoped CSS | Alternative if Tailwind feels too opinionated. Scoped styles prevent conflicts in dynamic rendering. | HIGH |

**Rationale:** Tailwind is dominant in 2026 for rapid prototyping. For "CSS customizable" requirement, Tailwind's config system lets users override theme variables. CSS Modules are the conservative choice if you want full control.

**Alternative:** Vanilla CSS with CSS variables for theming. Zero dependencies, maximum control.

**Recommendation:** **Tailwind** for v1. The utility-first approach accelerates building the component library (tables, cards, lists). Users can override via `tailwind.config.js` or CSS variables.

### Component Rendering
| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|-----------|
| **React Hook Form** | 7.x | Form handling | For parameter input forms. Minimal re-renders, built-in validation. | MEDIUM |
| **@tanstack/react-table** | 8.x | Table rendering | Most powerful table library. Virtual scrolling, sorting, filtering built-in. Perfect for rendering API list responses. | MEDIUM |

**Rationale:** For type-based component rendering (tables for arrays, forms for objects), specialized libraries handle edge cases you don't want to build.

**Alternative:** Build custom components. For MVP, custom table/card/list components give you full control and avoid dependency bloat.

**Recommendation:** **Start custom, add libraries when complexity grows.** For v1, custom components are simpler than learning TanStack Table's API.

### Local Storage
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|-----------|
| **localStorage API** | Native | Config persistence | Built-in browser API. Zero dependencies. Sufficient for v1 config storage. | HIGH |
| **idb-keyval** | 6.x | IndexedDB wrapper | If storing large configs/cache. Better than localStorage for large data. | MEDIUM |

**Rationale:** For v1 with simple config storage (API URLs, component mappings), `localStorage` is perfect. `idb-keyval` becomes relevant if caching large API responses.

**Recommendation:** **localStorage** for v1. Simple, synchronous, 5MB limit is plenty for configs.

### Development Tools
| Tool | Version | Purpose | Why | Confidence |
|------|---------|---------|-----|-----------|
| **ESLint** | 9.x | Linting | Catch bugs, enforce code style. TypeScript-ESLint integration is mature. | MEDIUM |
| **Prettier** | 3.x | Code formatting | Automatic formatting. Zero config option available. | MEDIUM |
| **Vitest** | 2.x | Unit testing | Fast, Vite-native testing. Better DX than Jest for Vite projects. | MEDIUM |

**Rationale:** Modern development workflow. ESLint + Prettier are table stakes. Vitest is the 2026 standard for Vite projects (replaces Jest).

## Alternatives Considered

| Category | Recommended | Alternative | Why Not | Confidence |
|----------|-------------|-------------|---------|-----------|
| **Framework** | React | Vue 3 | Smaller ecosystem for dynamic rendering patterns. React's component model is more flexible for runtime rendering. | MEDIUM |
| **Framework** | React | Svelte | Compile-time framework, less suited for runtime dynamic rendering from unknown schemas. | MEDIUM |
| **Framework** | React | Vanilla JS | Too much boilerplate for dynamic component rendering. Component model needed. | HIGH |
| **Build Tool** | Vite | Webpack | Vite is faster, simpler config. Webpack is legacy for new projects. | MEDIUM |
| **Build Tool** | Vite | Parcel | Less ecosystem support, slower adoption. Vite has won the bundler race. | LOW |
| **State** | Zustand | Redux | Redux is overkill. Too much boilerplate for simple config storage. | HIGH |
| **State** | Zustand | Jotai/Recoil | Similar to Zustand but less mature persistence story. Zustand's persist middleware is battle-tested. | LOW |
| **Styling** | Tailwind | Styled Components | Runtime CSS-in-JS has performance cost. Tailwind is compile-time. | MEDIUM |
| **Styling** | Tailwind | Emotion | Same issue as Styled Components. CSS-in-JS is falling out of favor in 2026. | MEDIUM |
| **HTTP** | fetch/Axios | SWR/React Query | Overkill for v1 GET-only. These are for data fetching + caching + mutations. Useful post-v1. | MEDIUM |
| **Validation** | Zod | Yup | Zod has better TypeScript integration. Type inference from schema is superior. | LOW |
| **Validation** | Zod | Joi | Joi is backend-focused. Zod is modern, TypeScript-first. | LOW |

## NOT Recommended (Anti-Patterns)

| Technology | Why Avoid |
|------------|-----------|
| **Create React App** | Deprecated in 2023. Use Vite instead. |
| **Redux Toolkit** | Overkill for config storage. Adds complexity without benefit. |
| **Angular** | Full framework with opinionated structure. Overkill for single-page rendering app. |
| **Next.js** | Server-side framework. v1 is client-only. Next.js adds unnecessary complexity. |
| **CSS-in-JS (runtime)** | Performance overhead. Tailwind or CSS Modules are faster. |
| **Lodash** | Tree-shaking issues. Modern JS covers most use cases. Only add if needed. |

## Recommended Starter Stack (Minimal)

For greenfield v1, start with this minimal stack:

```bash
# Core dependencies
npm create vite@latest api2ui -- --template react-ts
cd api2ui
npm install

# OpenAPI parsing
npm install swagger-parser

# HTTP client (optional, can use fetch)
# npm install axios

# State management
npm install zustand

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Development
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Total bundle size estimate:** ~150KB gzipped (React 18 + minimal deps)

## Progressive Enhancement Path

As project evolves beyond v1:

| Phase | Add | Why |
|-------|-----|-----|
| **v2: Mutations** | React Query (TanStack Query) | Cache management, optimistic updates, invalidation |
| **v2: Complex Tables** | @tanstack/react-table | Virtual scrolling, complex filtering/sorting |
| **v2: Forms** | React Hook Form + Zod | Dynamic form generation from OpenAPI schemas |
| **v3: SSR** | Next.js or Remix | Server-side rendering for SEO, shared API configs |
| **v3: Authentication** | Auth0 or Clerk | OAuth for private APIs, session management |

## Installation Script

```bash
#!/bin/bash
# Initialize Vite + React + TypeScript project
npm create vite@latest api2ui -- --template react-ts
cd api2ui

# Install core dependencies
npm install swagger-parser zustand

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react

# Initialize Tailwind
npx tailwindcss init -p

# Create base directory structure
mkdir -p src/components/{tables,cards,lists,forms}
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/store

echo "Stack initialized. Next: Configure Tailwind, set up ESLint/Prettier."
```

## Configuration Files Needed

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // User-customizable theme variables
    },
  },
  plugins: [],
}
```

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### tsconfig.json enhancements
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Version Lock Strategy

**DO:**
- Lock major versions in package.json (e.g., `"react": "^18.3.1"`)
- Use `npm ci` in CI/CD for reproducible builds
- Commit `package-lock.json`
- Review breaking changes before major upgrades

**DON'T:**
- Use `*` or `latest` in package.json
- Skip lockfile commits
- Auto-update without testing

## Confidence Assessment

| Technology Area | Confidence | Rationale |
|----------------|-----------|-----------|
| Core Framework (React/TS/Vite) | MEDIUM | Training data from 2025, versions likely current but unverified |
| OpenAPI Parsing | LOW | swagger-parser version unverified, may have newer alternatives |
| State Management | MEDIUM | Zustand is established pattern, version unverified |
| Styling | MEDIUM | Tailwind 4.x based on training data, exact version unverified |
| HTTP Client | HIGH | fetch is native, Axios is stable and well-known |
| Build Tooling | MEDIUM | Vite dominance clear from training, exact version unverified |

## Research Gaps

**Unable to verify without live sources:**
1. Exact current versions of React (18.3.x? 18.4.x? 19.x?)
2. Tailwind CSS version (4.x release status)
3. Vite latest stable (5.x or 6.x?)
4. Whether better OpenAPI parsers have emerged since training cutoff
5. New state management libraries that might have displaced Zustand

**Recommendation:** Before initializing project, verify current versions:
```bash
npm info react version
npm info typescript version
npm info vite version
npm info tailwindcss version
npm info swagger-parser version
npm info zustand version
```

## Sources

**HIGH Confidence:**
- Native browser APIs (fetch, localStorage) - Web standards
- React component model - Well-established pattern

**MEDIUM Confidence:**
- Library ecosystem patterns - Based on 2025 training data
- Technology choices - Consistent with industry trends as of training cutoff

**LOW Confidence:**
- Specific version numbers - Training data is 6-18 months old
- Exact current state of OpenAPI tooling - May have evolved
- Whether Vite 6.x exists or if Vite 5.x is current

**Verification needed:**
- Official documentation for all libraries
- npm registry for current versions
- GitHub releases for breaking changes since training cutoff
