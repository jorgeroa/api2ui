# Project Research Summary

**Project:** api2ui v1.2 - Smart Parameters & Layout System
**Domain:** API Testing Tools / Developer Tools - Filter UIs & Parameter Forms
**Researched:** 2026-02-05
**Confidence:** HIGH

## Executive Summary

v1.2 adds smart parameter handling and user-switchable layouts to api2ui's existing API testing interface. Research shows that production filter UIs require instant feedback, visual applied-filter state via chips, and progressive disclosure to prevent overwhelming users with 10+ parameters. The recommended technical approach uses zero-dependency solutions wherever possible: native URLSearchParams for query string parsing (no library needed), React Hook Form + Zod for validation (lightweight TypeScript-first), native range inputs with Tailwind styling (no slider library), and Tailwind CSS Grid for layout switching (no layout library). This philosophy delivers 33KB of new dependencies while avoiding 113KB that alternative approaches would require.

The key architectural insight is **format convergence**: parse both OpenAPI specs and raw URL query strings into the same `ParsedParameter[]` format early in the pipeline, eliminating downstream conditional logic and preventing dual-system collision. New features extend existing components rather than creating parallel code paths. Parameter persistence uses the existing configStore pattern with Zustand persist middleware, layout switching modifies existing App.tsx logic without changing layout structures, and type inference produces the same schema format that ParameterInput already expects.

Critical risks center on integration with existing systems rather than greenfield complexity. The highest-priority pitfalls are: (1) breaking existing OpenAPI parameter handling when adding raw URL parsing, (2) type inference false positives destroying user trust, (3) localStorage race conditions in multi-tab scenarios, (4) aggressive validation UX interrupting user flow, and (5) layout state synchronization complexity. Prevention requires conservative type inference with confidence levels, per-endpoint parameter storage with version tokens, validation-on-blur timing (not on-change), and derived layout state instead of synchronized state variables.

## Key Findings

### Recommended Stack

The v1.2 stack emphasizes **prefer zero-dependency solutions** over libraries when capabilities overlap. Native browser APIs and CSS cover query string parsing, range inputs, and layout grids without external dependencies. Libraries are only added when they provide substantial value over native approaches.

**Core technologies (33.4KB total):**
- **React Hook Form v7.71.1** (9KB): Minimal re-renders for form validation — replaces custom validation code, net neutral impact
- **Zod v4.3.5** (14KB): TypeScript-first validation with automatic type inference — integrates with React Hook Form via zodResolver
- **@hookform/resolvers** (2KB): Bridge layer between React Hook Form and Zod
- **@rehookify/datepicker v6.6.8** (8.4KB): Headless date picker matching Headless UI philosophy — fully styleable with Tailwind

**Zero-dependency solutions (113.5KB avoided):**
- **URLSearchParams API** (native): Query string parsing with array support via `getAll()` — no query-string library needed (saves 3.5KB)
- **CSS Grid + Tailwind** (native): Layout presets without react-grid-layout library (saves 122KB+)
- **Native `<input type="range">`** (native): Range sliders with Tailwind styling — no TanStack Ranger needed (saves complexity)
- **Custom tag input component** (150-200 LOC): Simple array state + keyboard handlers — no react-tag-input library (saves 10KB)
- **Zustand persist middleware** (built-in): Parameter persistence using existing Zustand v5.0.11 — no additional state library

**Integration with existing stack:**
- React 19, TypeScript 5.9, Vite 7: All recommended libraries compatible, no breaking changes
- Tailwind CSS 4: Native range input styling via arbitrary variants, CSS Grid utilities replace layout libraries
- Headless UI v2.2.9: @rehookify/datepicker follows same headless philosophy for consistency
- Zustand v5.0.11: Persist middleware already included, form state handled by React Hook Form (clear separation)

### Expected Features

Research into production filter UIs, API testing tools (Postman, Insomnia, Swagger UI), and parameter form patterns reveals clear table stakes vs. differentiators.

**Must have (table stakes):**
- **URL query param parsing** — Parse `?key=value` into form, sync form edits back to URL (zero-dependency URLSearchParams)
- **Parameter grouping by prefix** — Auto-group `ddcFilter[*]` params into logical sections (bracket notation parsing)
- **Smart type inference** — Detect dates, emails, arrays beyond OpenAPI schema (conservative inference with confidence levels)
- **Applied filter chips** — Show active params as removable chips above results (users forget what's filtered without visual state)
- **Clear all filters** — One-click reset to empty state (escape hatch when stuck in filtered view)
- **Layout presets** — Sidebar, centered, drawer (mobile) with user-switchable control (3-4 curated layouts, not freeform)
- **Persist preferences** — Remember layout choice and parameter defaults per endpoint (localStorage with per-URL scoping)
- **Real-time feedback** — Debounced auto-fetch (300-500ms) or clear "Apply" button with loading state (instant feedback expected)

**Should have (competitive differentiators):**
- **Progressive disclosure** — Collapse optional params into "Advanced" section when 5+ total params (reduces overwhelm)
- **Smart defaults from URL** — Pre-populate form on page load from existing query params (seamless transition)
- **Contextual placeholders** — "e.g., 2026-02-05" for date fields outside input, not inline (Nielsen Norman Group: inline placeholders hurt usability)
- **Shareable filter state** — "Copy URL" button with all active filters encoded (already URL-based, just need UI)
- **Contextual help** — Show OpenAPI `description` in tooltip (if available)

**Defer (v1.3+):**
- Query builder with AND/OR logic (complex, high effort)
- Filter presets/history (nice-to-have, not essential)
- Date range unified component (single picker for startDate + endDate — complex pairing logic)
- Layout preview thumbnails (polish, not core functionality)
- Split view with adjustable ratio (requires resize handler, persist ratio — complexity spike)
- Filter impact preview ("~142 results" before apply — requires extra API call or server support)

**Anti-features to avoid:**
- Inline placeholder text in inputs (confuses users, use labels + helper text instead)
- Auto-submit on every keystroke (excessive API calls, use debouncing)
- Hidden filters behind hamburger menu (users overlook, use visible sidebar/topbar)
- Required filters first (feels like form not exploration, show all with visual distinction)
- Auto-clear on navigation (frustrating, persist per endpoint instead)
- Disable filter options (use hide or show "(0)" count instead)

### Architecture Approach

The v1.2 architecture extends existing api2ui components through **format convergence** — converting diverse input sources to unified internal representation early in the pipeline. Query string parsing produces the same `ParsedParameter[]` format that OpenAPI parsing uses, eliminating conditional rendering and making new parameter sources trivial to add later (GraphQL introspection, gRPC reflection).

**Major components:**

1. **Query String Parser** (`services/querystring/parser.ts`) — Parse URL query strings to `ParsedParameter[]` using URLSearchParams, call type inferrer for each param, handle multi-value params via bracket notation detection. Produces same format as OpenAPI parser.

2. **Type Inferrer** (`services/querystring/inferrer.ts`) — Infer parameter types from values with conservative detection (boolean, number, date, email, URL). Returns confidence levels (LOW/MEDIUM/HIGH) with reasoning. Uses multi-signal validation: field name hints + value format + schema hints.

3. **Parameter Persistence** (extend `store/configStore.ts`) — Add `parameterDefaults: Record<string, Record<string, string>>` keyed by endpoint path. Per-URL isolation prevents wrong defaults on related endpoints. Use existing Zustand persist middleware, increment version to 3 for migration.

4. **Layout System** (modify `App.tsx`) — Add `layoutPreset: 'auto' | 'sidebar' | 'centered'` to configStore. Derive actual layout from preference + data: auto mode preserves current heuristic (2+ operations = sidebar), user can force specific layout. Modify layout selection logic only, existing layout structures unchanged.

5. **Enhanced Parameter Form** (modify `components/forms/ParameterForm.tsx`) — Load initial values from `configStore.getParameterDefaults(endpoint)`, persist values on submit. Priority: persisted > schema.default > schema.example > empty. Add `endpoint` prop (optional for backwards compatibility).

**Data flow:**
```
User enters URL with query string
  → parseQueryString(url) → ParsedParameter[]
  → appStore.parsedSpec.operations[0].parameters
  → ParameterForm loads defaults from configStore
  → User submits → persist to configStore, fetch API
```

**Key patterns:**
- **Format convergence**: Parse all parameter sources to `ParsedParameter[]` early
- **Store separation by volatility**: Session data in appStore, preferences in configStore
- **Derived layout state**: Compute `shouldShowSidebar` from preference + data, don't store separately
- **Progressive type inference**: Start with basic detection, extend with new patterns over time
- **Persistence granularity**: Per-endpoint, not global (different endpoints, different semantics)

### Critical Pitfalls

From PITFALLS.md, the top risks for v1.2 integration:

1. **Dual Parameter System Collision** — Adding raw URL parsing alongside existing OpenAPI creates two competing sources of truth. OpenAPI spec defines types, URL provides values, they conflict unpredictably (string "true" vs boolean true). **Prevention:** Single source of truth with merge strategy (OpenAPI schema provides types/validation, URL provides values, user edits override both). Create synthetic `ParsedParameter[]` from URL using type inference, merge with OpenAPI params. Build type coercion layer (`coerceToSchema(urlValue, schemaType)`) before passing to ParameterForm.

2. **Type Inference False Positives Destroying Trust** — Over-aggressive detection (dates, emails, coordinates) produces false positives that break forms. String "2024-01-01" detected as date but it's a product code, date picker appears, user can't enter value. **Prevention:** Conservative detection thresholds with multi-signal validation (field name hints + value format + schema hints + reasonable range). Confidence levels (LOW/MEDIUM/HIGH), only show specialized components on HIGH confidence. Negative patterns (don't detect date on "code", "id", "version" fields). Easy escape hatch UI (component type switcher badge from v1.1).

3. **localStorage Race Conditions in Multi-Tab Scenarios** — Parameter persistence creates race conditions when multiple tabs open. Tab A saves, Tab B overwrites with old state, data corruption cascades. Current vulnerability: configStore uses Zustand persist with no multi-tab protection. **Prevention:** Version tokens with timestamps (reject older versions), storage event handling to merge intelligently, loaded state guard (prevent saves during restoration), per-URL parameter isolation (don't share state globally), debounced persistence (batch saves to reduce race window).

4. **Form Validation UX That Interrupts Flow** — Aggressive inline validation fires too early, error "Invalid email" while user still typing "user@domain.com". Red borders distract from form filling. **Prevention:** Strategic timing (validate on blur not on change, show all errors on submit), progressive disclosure of validation rules upfront (placeholder hints, helper text), error message quality ("Email must include @ and domain" not "Invalid"), accessibility (aria-invalid, error icons not just color), minimal success indicators (only for non-obvious validations).

5. **Layout State Synchronization Complexity** — User-switchable layouts create complex sync between layout choice, panel state, drilldown mode, parameter visibility. User switches to drawer but panelOpen still true from sidebar layout, both open simultaneously. Layout change resets form state. **Prevention:** Single source of truth for layout mode, derive dependent values (don't sync separately), layout-aware components (adapt to layout, not vice versa), state preservation during layout change (use layout as prop not unmount/remount trigger), Zustand with selector pattern (minimize re-renders).

**Integration-specific risks:**
- **Breaking existing OpenAPI flow** — ParameterForm designed for OpenAPI schema, raw URL params are untyped. Must generate synthetic schema from URL, merge with OpenAPI params, add graceful degradation for missing schema.
- **ConfigStore state bloat** — Adding layout, parameterDefaults, parameterGroups, arrayFormat to existing configStore creates monolithic store. Split stores by concern (configStore for visual config, parameterStore for parameter state, uiStore for ephemeral state), selective persistence (don't persist everything), URL-scoped storage with LRU cache (last 10 URLs to prevent localStorage overflow).

## Implications for Roadmap

Based on architecture research and dependency analysis, v1.2 should be implemented in **three phases** with clear separation of concerns:

### Phase 1: URL Parsing & Type Inference Foundation

**Rationale:** Query string parsing is the foundational capability for v1.2 — all smart parameter features depend on it. Must establish parameter architecture before building features on top. Type inference must be conservative from start (hard to walk back if false positives erode trust). Persistence layer is foundational infrastructure.

**Delivers:**
- Parse URL query strings to `ParsedParameter[]` format
- Smart type inference with confidence levels (boolean, number, date, email, URL)
- Multi-value parameter support (bracket notation, repeated keys)
- Merge strategy for OpenAPI params + URL params
- Per-endpoint parameter persistence with race condition protection
- Form validation timing strategy (blur not change)

**Addresses features:**
- URL query param parsing (table stakes)
- Smart type inference (table stakes)
- Smart defaults from URL (differentiator)
- Persist preferences (table stakes)

**Avoids pitfalls:**
- Pitfall 1: Dual parameter collision (merge strategy prevents conflict)
- Pitfall 2: Type inference false positives (conservative thresholds, confidence levels)
- Pitfall 3: localStorage race conditions (version tokens, storage events)
- Pitfall 4: Form validation UX interrupts (validate on blur)
- Pitfall 12: Breaking OpenAPI flow (synthetic schema generation)
- Pitfall 13: ConfigStore bloat (split stores by concern)

**Research flags:** Standard patterns (URLSearchParams, React Hook Form + Zod well-documented), skip deep research.

### Phase 2: Layout System & Parameter Grouping

**Rationale:** Layout system is architecturally independent from parameter parsing — can be built in parallel. Parameter grouping depends on Phase 1 parsing working (need bracket notation support). Layout state must be correct from start (hard to refactor later).

**Delivers:**
- Layout presets: sidebar, centered, drawer (mobile)
- User-switchable layout control with persistence
- Responsive behavior (mobile defaults to drawer)
- Smooth layout transitions without re-mount
- Parameter grouping by prefix (`ddcFilter[*]` → "Filters" section)
- Humanized group labels (ddcFilter → "Filters")

**Addresses features:**
- Layout presets (table stakes)
- Parameter grouping by prefix (table stakes)
- Progressive disclosure (differentiator, if time permits)

**Uses stack:**
- Tailwind CSS Grid utilities (zero dependencies)
- Zustand persist for layout preference
- Custom bracket notation parser from Phase 1

**Implements architecture:**
- Layout preset selector component
- Layout-aware ParameterForm (adapts to layout mode)
- Derived layout state (compute from preference + data)

**Avoids pitfalls:**
- Pitfall 5: Layout state sync (single source of truth, derived state)
- Pitfall 6: Array notation inconsistency (detect and preserve format)
- Pitfall 7: Parameter grouping UI confusion (humanized labels, confidence thresholds)
- Pitfall 11: Layout switch scroll loss (preserve scroll position)

**Research flags:** Layout patterns well-documented (Tailwind Grid, CSS best practices), skip research. Parameter grouping heuristics may need iteration based on real URLs.

### Phase 3: Rich Input Components & UX Polish

**Rationale:** Rich inputs depend on Phase 1 type inference working. UX polish (chips, loading states, contextual help) is final layer after core functionality proven. Date pickers are enhancement not blocker.

**Delivers:**
- Applied filter chips with individual remove
- Clear all filters button
- Date picker integration (@rehookify/datepicker)
- Custom tag input component for multi-value params
- Styled native range inputs
- Real-time feedback with debouncing (300-500ms)
- Contextual placeholders and help tooltips
- Loading states and skeleton screens

**Addresses features:**
- Applied filter chips (table stakes)
- Clear all filters (table stakes)
- Real-time feedback (table stakes)
- Contextual placeholders (differentiator)
- Contextual help (differentiator)
- Shareable filter state / Copy URL (differentiator)

**Uses stack:**
- @rehookify/datepicker for date inputs
- Custom tag input component (no library)
- Native range inputs with Tailwind styling
- React Hook Form validation from Phase 1

**Avoids pitfalls:**
- Pitfall 8: Type coercion on submit (explicit coercion before API call)
- Pitfall 9: Date/time format mismatch (ISO 8601 with timezone awareness)
- Pitfall 10: Form state/URL sync (debounced URL updates, popstate handling)

**Research flags:** Component patterns well-documented (Headless UI approach, Tailwind styling guides), skip research.

### Phase Ordering Rationale

**Dependencies dictate order:**
- Phase 1 must complete before Phase 2 grouping (needs bracket notation parser)
- Phase 1 must complete before Phase 3 rich inputs (needs type inference)
- Phase 2 and Phase 3 can run in parallel if resources available (independent concerns)

**Risk management:**
- Phase 1 addresses highest-severity pitfalls (dual system collision, type inference false positives, race conditions)
- Phase 2 establishes layout architecture before building complex interactions on top
- Phase 3 is polish layer — can be deprioritized if timeline pressure

**Validation strategy:**
- Phase 1: Test with diverse URLs (bracket notation, repeated keys, comma-separated), verify no OpenAPI regression
- Phase 2: Test layout switching preserves state, verify grouping heuristics with real API patterns
- Phase 3: Test UX flows (apply filters, clear all, switch layouts), verify accessibility

### Research Flags

**Needs research (during phase planning):**
- None — v1.2 uses well-documented patterns with high-quality sources

**Standard patterns (skip phase research):**
- **Phase 1:** URLSearchParams, React Hook Form + Zod, Zustand persist all have official docs and ecosystem adoption
- **Phase 2:** Tailwind Grid layouts, CSS-based responsive design well-established
- **Phase 3:** Headless UI patterns, form accessibility guidelines (Nielsen Norman Group, WCAG)

**Iteration likely needed:**
- **Parameter grouping heuristics:** May need adjustment after testing with real API URLs (what prefixes trigger grouping, when to collapse)
- **Type inference thresholds:** Conservative start, may relax confidence thresholds based on false positive rate in testing
- **Layout responsive breakpoints:** May need tuning for specific use cases (when to force drawer vs sidebar)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via official docs, npm package registries, GitHub releases. React Hook Form + Zod are current ecosystem standards. URLSearchParams is native API with MDN documentation. |
| Features | HIGH | Filter UI patterns verified via Nielsen Norman Group, Baymard Institute, UX research. API testing tool comparison (Postman, Insomnia, Swagger UI) provides clear table stakes baseline. |
| Architecture | HIGH | Format convergence pattern proven in codebase analysis. Integration points clearly mapped to existing components (ParameterForm, configStore, App.tsx). Build order respects dependencies. |
| Pitfalls | HIGH | Integration risks identified through codebase analysis (configStore persistence, ParameterForm schema assumptions). Race conditions, validation UX, state sync patterns verified via React docs, Zustand docs, UX research. |

**Overall confidence:** HIGH

All four research areas have multiple verified sources and clear recommendations. Stack choices favor zero-dependency solutions over libraries (conservative, low-risk). Architecture extends existing patterns rather than introducing new paradigms (low integration risk). Pitfalls are clearly mapped to prevention strategies with code examples.

### Gaps to Address

**Type inference accuracy tradeoffs:**
- Research provides conservative starting point (HIGH confidence only), but real-world false positive rate unknown until testing
- **Handling:** Implement confidence levels from start, log inference decisions in dev mode, monitor false positives in testing, adjust thresholds based on data

**Array parameter format detection:**
- Multiple conventions exist (brackets, repeated keys, comma-separated), detection heuristic may fail edge cases
- **Handling:** Default to bracket notation (most common), add config UI for manual override if auto-detection wrong, test with diverse real-world APIs

**Parameter grouping heuristics:**
- When to group (3+ params with shared prefix?), how to humanize labels (ddcFilter → Filters?), max nesting depth (2 levels?) — research suggests ranges but not absolutes
- **Handling:** Start with conservative defaults (3+ params, 2 levels max, common prefix transformations), add config UI for manual grouping later if needed

**Layout system mobile breakpoints:**
- Research suggests drawer for mobile, sidebar for desktop, but specific breakpoints (768px? 1024px?) depend on api2ui usage patterns
- **Handling:** Start with standard Tailwind breakpoints (md: 768px), monitor analytics if available, make configurable in v1.3 if users need customization

**Date/time timezone handling:**
- Research covers format conversion but not timezone display UX (show user's local time? UTC? configurable?)
- **Handling:** Default to user's local timezone with indicator text ("Times in PST"), defer timezone selection UI to v1.3 if requested

## Sources

### Primary (HIGH confidence)

**Stack Research:**
- [React Hook Form v7.71.1 - npm](https://www.npmjs.com/package/react-hook-form)
- [Zod v4.3.5 - npm](https://www.npmjs.com/package/zod)
- [URLSearchParams - MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [Tailwind CSS Grid - Official docs](https://tailwindcss.com/docs/grid-template-columns)
- [Zustand persist middleware - Official docs](https://zustand.docs.pmnd.rs/middlewares/persist)
- [@rehookify/datepicker v6.6.8 - npm](https://www.npmjs.com/package/@rehookify/datepicker)

**Features Research:**
- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Nielsen Norman Group: Form Design Guidelines](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- [Baymard Institute: Horizontal Filtering](https://baymard.com/blog/horizontal-filtering-sorting-design)
- [Algolia: Search Filters Best Practices](https://www.algolia.com/blog/ux/search-filter-ux-best-practices)

**Architecture Research:**
- [Zustand Persist Documentation](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [URLSearchParams TypeScript Guide - DEV](https://dev.to/bugudiramu/a-comprehensive-guide-to-urlsearchparams-in-typescript-51f7)
- [React Admin Layout Component](https://marmelab.com/react-admin/Layout.html)

**Pitfalls Research:**
- [Smashing Magazine: Complete Guide to Live Validation UX](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)
- [Kent C. Dodds: Don't Sync State. Derive It!](https://kentcdodds.com/blog/dont-sync-state-derive-it)
- [React Docs: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- [useSyncExternalStore for persistence - Yeti](https://www.yeti.co/blog/managing-persistent-browser-data-with-usesyncexternalstore)

### Secondary (MEDIUM confidence)

**Features Research:**
- [Filter UI Examples for SaaS - Arounda](https://arounda.agency/blog/filter-ui-examples)
- [Smart Defaults in Form UX - Zuko](https://www.zuko.io/blog/how-to-use-defaults-to-optimize-your-form-ux)
- [Arrays in Query Params - Medium](https://medium.com/raml-api/arrays-in-query-params-33189628fa68)

**Architecture Research:**
- [Modern Layout Design Techniques in React - DEV](https://dev.to/er-raj-aryan/modern-layout-design-techniques-in-reactjs-2025-guide-3868)
- [Building Tag Input Component - LogRocket](https://blog.logrocket.com/building-a-tag-input-field-component-for-react/)

**Pitfalls Research:**
- [Form Validation Best Practices - Userpeek](https://userpeek.com/blog/form-validation-ux-and-best-practices/)
- [Managing Persistent Browser Data - Medium](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c)

### Tertiary (context for completeness)

- [Insomnia vs Postman 2026 - Abstracta](https://abstracta.us/blog/testing-tools/insomnia-vs-postman/)
- [React State Management in 2025 - Developer Way](https://www.developerway.com/posts/react-state-management-2025)

---
**Research completed:** 2026-02-05
**Ready for roadmap:** yes
