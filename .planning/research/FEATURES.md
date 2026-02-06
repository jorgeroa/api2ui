# Features Research: v1.2 Smart Parameters & Layout System

**Domain:** Filter UIs, Parameter Forms, and Layout Systems for API Testing/Explorer Tools
**Researched:** 2026-02-05
**Focus:** Smart parameter handling, URL-to-form workflows, layout presets
**Confidence:** MEDIUM-HIGH (WebSearch-verified patterns, awaiting Context7 verification on specific libraries)

## Summary

This research examines how production filter UIs, smart parameter forms, and layout systems work in e-commerce, dashboards, and API testing tools. The v1.2 milestone adds smart parameter handling and layout flexibility to api2ui's existing basic parameter forms. Key findings: (1) Filter UIs must provide instant feedback with debouncing, clear visual state of applied filters via chips, and prevent zero-result frustration, (2) URL query param parsing requires handling array notation and bidirectional URL-state synchronization, (3) Smart type inference should cover dates, emails, coordinates, and use contextual placeholders not inline placeholders, (4) Progressive disclosure via expandable sections prevents overwhelming users with 10+ params, (5) Layout systems need 3-4 presets (sidebar, top bar, drawer, split) with user-switchable controls, (6) UX polish comes from real-time updates, clear "Clear All" actions, and count badges showing filter impact.

## Filter UI Patterns

### Table Stakes

Features users expect from any filter UI — missing these = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-select filters | Users need to combine criteria (e.g., color=red OR blue) | Medium | Use checkboxes, not single-select radios |
| Applied filter chips/badges | Users forget what filters are active without visual reminder | Low | Show chips above results with individual X to remove |
| Clear all filters | Users need escape hatch when stuck in filtered state | Low | "Clear All" or "Reset Filters" button, always visible |
| Real-time/instant feedback | Users expect to see results update as they filter | Medium | Requires debouncing (300-500ms) for text inputs |
| Prevent zero results | Showing "0 results" frustrates users, hide unavailable options | High | Dynamically update filter counts or disable options with 0 matches |
| Filter count indicators | Users want to know impact before selecting (e.g., "Size: M (143)") | Medium | Show count next to each filter option |
| Collapsible filter groups | With 5+ filter categories, users need to collapse unused sections | Low | Accordion pattern for filter groups |
| Preserve selections on error | If API call fails, don't clear user's filter state | Low | Maintain filter state in URL or React state |
| Mobile-friendly filters | 70%+ traffic is mobile, filters must work on small screens | Medium | Bottom drawer or sticky filter bar for mobile |
| Visible feedback on apply | When filter changes, show loading state during fetch | Low | Skeleton screens or spinner overlay |

**Dependencies on existing features:**
- Builds on v1.0 parameter forms (enum→dropdown, bool→checkbox)
- Extends required/optional separation to show optional params in expandable sections

### Differentiators

Features that would make api2ui stand out from generic API tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-group by prefix | Parameters like `ddcFilter[status]`, `ddcFilter[date]` auto-group into "Filters" section | Medium | Parse bracket notation, create logical sections |
| Smart defaults from URL | Parse existing query params and pre-populate form | Low | Already have URL state, just need to parse on load |
| Type inference with examples | Show "e.g., 2026-02-05" placeholder for date fields | Medium | Pattern matching on param names/values |
| Progressive disclosure | Show param breakdown first (read-only chips), then "Edit" to open form | Medium | Two-step: display → edit vs always-editable |
| Query builder mode | Advanced users can build AND/OR filter logic visually | High | Complex, defer to post-v1.2 |
| Filter history/presets | Save common filter combinations ("Last week's orders") | Medium | LocalStorage + preset management UI |
| Shareable filter state | Copy URL with all active filters to share with team | Low | Already URL-based, just need "Copy Link" button |
| Contextual help tooltips | Show API docs for each param inline (if OpenAPI spec available) | Low | Use `description` field from OpenAPI |
| Auto-detect related params | Group `startDate`/`endDate` into single date range picker | High | Pattern matching on param names |
| Filter impact preview | "Applying this will show ~142 results" before submit | High | Requires extra API call or server support |

**Recommendation for v1.2:**
- Auto-group by prefix (MUST HAVE for ddcFilter use case)
- Smart defaults from URL (MUST HAVE)
- Type inference with examples (MUST HAVE)
- Progressive disclosure (NICE TO HAVE)
- Shareable filter state (EASY WIN)
- Contextual help tooltips (EASY WIN if OpenAPI)

### Anti-Features

Things to deliberately NOT build — common mistakes in filter UI design.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Inline placeholder text | Nielsen Norman Group study: placeholders hurt usability, users confuse them with pre-filled values | Use label above field + helper text below or contextual examples outside input |
| Auto-submit on every keystroke | Causes excessive API calls, poor UX for slow typers | Debounce 300-500ms or require explicit "Apply" button |
| Hidden filters behind menu | Users overlook filters buried in hamburger menus | Use visible sidebar or top bar, reserve drawer for mobile only |
| Complex nested filter UI | More than 2 disclosure levels = users get lost | Limit to 2 levels: Category → Options, not Category → Subcategory → Options → Sub-options |
| Required filters first | Forcing users to fill required params before showing optional ones feels like a form, not exploration | Show all params, use visual distinction (bold label, asterisk) for required |
| Auto-clear on navigation | Clearing filters when user switches endpoints is frustrating | Persist filters per endpoint in localStorage |
| Filter modal overlays | Full-screen modals force context switch, user can't see results while filtering | Use sidebar or drawer that shows results alongside filters |
| Overly smart grouping | Auto-grouping unrelated params confuses users | Only group when clear semantic relationship (shared prefix, OpenAPI tags) |
| Disable filter options | Disabled checkboxes frustrate users ("Why can't I select this?") | Hide options with 0 results or show with "(0)" count |
| Single-select filters | Forcing "pick one" when users want "any of these" | Use checkboxes for multi-select, radio only for mutually exclusive options |

## Smart Type Inference

### Table Stakes

Basic inference users expect from any smart form.

| Feature | Expected Behavior | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| Date detection | Params named `date`, `createdAt`, `start`, `end` → date picker | Low | Regex match on param name + value pattern (ISO 8601) |
| Number detection | Params with numeric values → number input with step | Low | Already have from v1.0, verify it works for query params |
| Boolean detection | Params with `true/false`, `yes/no`, `0/1` → toggle/checkbox | Low | Already have from v1.0 |
| Enum detection | Params with OpenAPI enum definition → dropdown | Low | Already have from v1.0, verify for non-OpenAPI URLs |
| Array detection | Params with bracket notation `tag[]=x&tag[]=y` → multi-select or tag input | Medium | Parse repeated keys or bracket notation |
| Email detection | Params named `email`, `userEmail` → email input with validation | Low | Pattern match on name + basic validation |
| URL detection | Params named `url`, `website`, `callback` → URL input with validation | Low | Pattern match on name + URL validation |
| Coordinate detection | Params named `lat`, `lng`, `latitude`, `longitude` → paired number inputs | Medium | Pattern match on name + optional map picker later |

**Confidence:** HIGH — These patterns are standard across form libraries and API tools like Postman, Insomnia.

### Differentiators

Advanced inference that adds value beyond basic type detection.

| Feature | Value Add | Complexity | Notes |
|---------|-----------|------------|-------|
| Zip code detection | Params named `zip`, `zipCode`, `postalCode` → formatted input (US: 12345 or 12345-6789) | Low | Pattern + input mask |
| Phone number detection | Params named `phone`, `mobile` → formatted input with country code | Medium | Requires formatting library |
| Date range inference | Params `startDate` + `endDate` → single date range picker | High | Group related params, render as unified component |
| Multi-value CSV parsing | Param `tags=apple,orange,banana` → tag input with chips | Medium | Split on comma, render as editable chips |
| Keyword search detection | Params named `q`, `query`, `search`, `keyword` → search input with icon | Low | Just styling + icon, maybe autocomplete later |
| Currency detection | Params named `price`, `amount`, `cost` with numeric values → currency input | Medium | Format with $ prefix, 2 decimals |
| Color detection | Params named `color`, `backgroundColor` with hex values → color picker | Low | Pattern match hex, render color input |
| File path detection | Params with `/path/to/file` structure → read-only code display | Low | Pattern match, render in monospace |
| JSON detection | Params with stringified JSON → expandable JSON editor | High | Detect `{` or `[` start, use CodeMirror or similar |
| Relative date inference | Values like `7d`, `1w`, `30d` → dropdown with presets + custom picker | Medium | Parse shorthand, provide common presets |

**Recommendation for v1.2:**
- Date range inference (HIGH VALUE for filter UIs)
- Multi-value CSV parsing (COMMON PATTERN)
- Keyword search detection (EASY WIN)
- Zip code detection (NICE TO HAVE)
- Defer: phone, currency, color, JSON (complex, less common in filters)

### Anti-Features

Inference behaviors that frustrate users.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Overly aggressive inference | Inferring `name` param as "person name" and applying title case auto-formatting | Only infer when high confidence (90%+), never auto-format user input |
| Inference without escape hatch | Forcing date picker when user wants to manually type `2026-02-05` | Always allow text input fallback, picker is enhancement |
| Hidden raw value | Showing formatted value but hiding actual param value sent to API | Show both: formatted in UI, raw in tooltip or "View as URL" mode |
| Inference breaking paste | Date picker rejecting pasted text like "tomorrow" or "last week" | Accept text input, attempt to parse, show error inline if invalid |
| Required format validation | Forcing specific format (MM/DD/YYYY vs DD/MM/YYYY) when API accepts ISO 8601 | Accept multiple formats, normalize to API format on submit |

## URL Query Param Parsing

### Table Stakes

| Feature | Expected Behavior | Complexity | Notes |
|---------|-------------------|------------|-------|
| Parse standard params | `?key=value&key2=value2` → form fields | Low | URLSearchParams API (built into browsers) |
| Parse array notation | `?tag[]=x&tag[]=y` or `?tag=x&tag=y` → multi-value field | Medium | No universal standard, support both repeated keys and brackets |
| Parse nested objects | `?filter[status]=active&filter[date]=2026` → grouped fields | Medium | Parse bracket notation into nested structure |
| URL → form sync | On page load, populate form from URL query params | Low | Parse on mount, set form state |
| Form → URL sync | When user edits form, update URL without reload | Low | Use React Router's `useSearchParams` or similar |
| Preserve param order | Maintain order of params when rendering form | Low | Use array/map instead of plain object |
| Handle special characters | URL-encoded values like `%20`, `%2C` decode correctly | Low | Built into URLSearchParams |
| Handle empty values | `?foo=&bar=` → empty string, not `null` or omitted | Low | Distinguish empty from missing |

**Confidence:** HIGH — Standard browser APIs and React libraries (nuqs, use-query-params) handle this.

### Differentiators

| Feature | Value Add | Complexity | Notes |
|---------|-----------|------------|-------|
| Auto-detect array format | Guess if API uses `tag[]=x` vs `tag=x` vs `tag=x,y` from existing URL | Medium | Parse first, remember format, maintain on edit |
| URL history | Show recently used URLs for quick re-filter | Low | LocalStorage + dropdown |
| Diff view | Show "what changed" when user edits URL params | Medium | Compare before/after, highlight diffs |
| Copy as cURL | Generate cURL command from current filter state | Low | Useful for developers |
| Import from URL | Paste full URL from browser address bar, extract params | Low | Strip base URL, parse query string |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Lossy parsing | Converting `tag[0]=x` to just `tag=x`, losing array index info | Preserve exact format, even if not used by form |
| Auto-clean URL | Removing "empty" params like `?foo=` from URL (some APIs treat `foo=` differently from omitting `foo`) | Preserve all params as-is unless user explicitly removes |
| Force canonical format | Rewriting user's URL from `tag=x&tag=y` to `tag[]=x&tag[]=y` without asking | Preserve original format, only normalize when needed for API |

## Progressive Disclosure for Complex Params

### Table Stakes

| Feature | Expected Behavior | Complexity | Notes |
|---------|-------------------|------------|-------|
| Collapsible sections | Group related params (Filters, Pagination, Sorting) into expandable sections | Low | Headless UI Disclosure component |
| Required params always visible | Show required params first, optional in "Advanced" or "More Filters" section | Low | Filter by `required` flag from OpenAPI |
| Show count of hidden params | "Show 12 more filters" or "Advanced (8)" to indicate what's collapsed | Low | Count optional params |
| Remember disclosure state | If user expands "Advanced", keep it open on next visit | Low | Persist in localStorage |
| Default to collapsed | Start with optional params hidden to reduce overwhelm | Low | Expand only required or previously used |

**Confidence:** HIGH — Nielsen Norman Group research on progressive disclosure, widely adopted pattern.

### Differentiators

| Feature | Value Add | Complexity | Notes |
|---------|-----------|------------|-------|
| Smart defaults visible | Show params with values (even optional) in collapsed state as read-only chips | Medium | "Filters: status=active, date=2026-02 [Edit]" |
| Two-step flow | (1) Show current filter state as chips, (2) Click "Edit" to open form | Medium | Reduces visual noise, makes clear what's active |
| Contextual expansion | Auto-expand section if param has error or was just edited | Low | UX polish, focus management |
| Progressive form | Ask for basic params first (keyword search), then suggest refinements | High | Requires multi-step wizard, complex for v1.2 |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| More than 2 nesting levels | Users get lost with Category → Subcategory → Sub-sub-category | Limit to 2 levels: Section → Fields |
| Hide all params by default | If everything is collapsed, users don't know what's available | Always show required params or most-used params |
| Bury important filters | Hiding high-impact filters (date range, status) in "Advanced" frustrates power users | Put common filters in main view, truly rare ones in "Advanced" |

## Layout System

### Table Stakes

Core layout expectations for any UI with switchable layouts.

| Feature | Expected Behavior | Complexity | Notes |
|---------|-------------------|------------|-------|
| 3-4 layout presets | Sidebar (left), Top bar (horizontal), Drawer (slide-out), Split view (left/right columns) | Medium | Each layout needs separate CSS + component arrangement |
| User-switchable control | Icon/dropdown in header to switch layouts | Low | Store preference in localStorage |
| Persist preference | Remember user's layout choice per endpoint | Low | Key by endpoint URL in localStorage |
| Responsive behavior | Mobile defaults to drawer, desktop defaults to sidebar | Medium | Media queries + auto-switch logic |
| Smooth transitions | Layout change animates (slide, fade) not instant snap | Low | CSS transitions |
| Clear visual affordance | Icon for layout switcher is recognizable (grid icon, layout icon) | Low | Use standard icons (Heroicons layout variants) |

**Confidence:** MEDIUM — Common in dashboards (Grafana, Datadog) but less standardized than filter patterns.

### Differentiators

Layout features that add value beyond basic switching.

| Feature | Value Add | Complexity | Notes |
|---------|-----------|------------|-------|
| Layout preview | Hover over layout option shows thumbnail preview | Medium | Render mini preview or use static images |
| Keyboard shortcuts | `L` key cycles through layouts, `Cmd+1/2/3` for specific layouts | Low | Add global keyboard handler |
| Per-endpoint defaults | Different endpoints default to different layouts (e.g., filters in sidebar, single-op in top bar) | Low | Heuristic based on param count |
| Collapsible sidebar | In sidebar layout, allow collapsing to icons-only | Medium | Adds complexity to sidebar component |
| Split view ratio adjustment | Drag divider to resize left/right panels in split view | Medium | Requires resize handler, persist ratio |
| Layout templates | "Gallery view" (top bar + cards), "Data table view" (sidebar + table) — named presets that combine layout + component choice | High | Complex, couples layout to component type |

**Recommendation for v1.2:**
- 3-4 layout presets (MUST HAVE)
- User-switchable control (MUST HAVE)
- Persist preference (MUST HAVE)
- Responsive behavior (MUST HAVE)
- Smooth transitions (NICE TO HAVE)
- Defer: preview, keyboard shortcuts, split ratio (polish for v1.3)

### Anti-Features

Layout complexity to avoid.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Freeform drag-and-drop layout | Letting users drag param form anywhere on screen is overwhelming | Provide 3-4 curated layouts, not infinite customization |
| Layout builder UI | Modal with "design your layout" tools is too complex for a simple filter form | Preset layouts only |
| Per-field layout control | Letting users position each field individually creates chaos | Layout applies to whole param form, not individual fields |
| Layout affects data view | Coupling param layout to data component layout (e.g., sidebar forces table) confuses users | Param layout is independent of data component type |
| Auto-switch without consent | Automatically changing layout based on screen size without user action is disorienting | Suggest layout on first mobile visit, don't force switch |

## UX Polish Expectations

What makes a filter UI feel like a "real product" not a dev tool — the intangibles.

### Instant Feedback & Loading States

| Pattern | Why It Matters | Implementation |
|---------|----------------|----------------|
| Debounced real-time search | Users expect search-as-you-type, but 100ms per keystroke is excessive | Debounce 300-500ms on text inputs, instant on checkboxes/dropdowns |
| Skeleton screens during fetch | Blank screen after clicking "Apply" feels broken | Show skeleton loader or fade existing results |
| Optimistic UI updates | Showing filter chip immediately (before API response) feels faster | Add chip to UI, remove if fetch fails |
| Error recovery | If fetch fails, show error but keep form state intact | Don't clear params, show retry button |
| Loading progress | For slow APIs, show "Loading... 3s" to indicate it's working | Use timeout to show duration if >2s |

### Clear Visual State

| Pattern | Why It Matters | Implementation |
|---------|----------------|----------------|
| Applied filter chips/badges | Users forget what filters are active without visual reminder | Chips above results with individual X icons |
| Count badges | Show "Filters (3)" or "Active: 3" to indicate how many applied | Count non-empty params |
| Clear visual hierarchy | Primary params (search) bigger/bolder than secondary (advanced filters) | Typography scale: text-lg for search, text-sm for advanced |
| Highlight active filters | Active filter options have blue background, inactive are gray | Use `data-active` state in CSS |
| "Showing X of Y results" | Users want to know if filters are working | Display count above results |

### Discoverability

| Pattern | Why It Matters | Implementation |
|---------|----------------|----------------|
| Onboarding tooltip | First-time users need hint: "Click here to change layout" | Show once, dismiss forever (localStorage flag) |
| Empty state guidance | When no params provided, show "Start by entering a keyword" | Helpful empty state, not blank form |
| Contextual help | Question mark icon next to params shows API docs | Pull from OpenAPI `description` field |
| Keyboard hints | Show "Press Enter to apply" in search input | Subtle text-xs hint below input |
| Undo support | After clearing all filters, show "Undo" toast | Store previous state, restore on undo |

### Performance & Responsiveness

| Pattern | Why It Matters | Implementation |
|---------|----------------|----------------|
| Fast initial load | Form renders in <500ms even with 20+ params | Progressive rendering, virtualize long lists |
| No layout shift | Expanding "Advanced" section doesn't jump page | Reserve space or smooth slide transition |
| Smooth animations | Layout switch, chip removal, section expand all animate at 200-300ms | CSS transitions, not JavaScript animation |
| Mobile-first interactions | Touch targets 44x44px minimum, swipe to dismiss chips | Mobile UX best practices |

## Comparison to API Testing Tools

How do Postman, Insomnia, and similar tools handle parameters?

| Tool | Param UI Pattern | Strengths | Gaps for api2ui |
|------|------------------|-----------|-----------------|
| **Postman** | Table with Key/Value/Description columns, checkbox to enable/disable each param | Clean, familiar spreadsheet metaphor, bulk editing easy | No smart grouping, no type inference beyond text/number, not beginner-friendly |
| **Insomnia** | Simple key-value pairs in sidebar, environment variables for reuse | Minimalist, fast, supports autocomplete from environment | No progressive disclosure, assumes user knows all params upfront |
| **Swagger UI** | Auto-generated form from OpenAPI spec with type-appropriate inputs | Automatic, no manual config, shows descriptions from spec | Ugly default styling, no grouping, all params always visible |
| **Hoppscotch** | Key-value editor with type dropdown (text, file, etc.), import from URL | Modern UI, supports GraphQL, REST, WebSocket | Still dev-focused, no smart defaults for non-technical users |
| **api2ui (current v1.0)** | Basic parameter form from OpenAPI spec, enum→dropdown, bool→checkbox | Already type-aware, already has required/optional separation | No URL parsing, no grouping, no progressive disclosure, no layout switching |

**Key insight:** API testing tools focus on developer power users who know what params they need. api2ui's opportunity is making parameter forms accessible to non-technical users through smart defaults, progressive disclosure, and polished UX.

## MVP Feature Prioritization for v1.2

Based on research, recommended priority for v1.2 milestone:

### Must Have (Table Stakes)

1. **URL query param parsing** — Parse `?key=value` into form, sync form edits back to URL
2. **Parameter grouping by prefix** — Auto-group `ddcFilter[*]` into sections
3. **Smart type inference** — Date detection, email detection, array detection beyond OpenAPI
4. **Applied filter chips** — Show active params as chips with individual remove
5. **Clear all filters** — One-click reset to empty state
6. **Layout presets** — Sidebar, Top bar, Drawer (mobile) with user switcher
7. **Persist preferences** — Remember layout choice per endpoint
8. **Real-time feedback** — Debounced auto-fetch or clear "Apply" button with loading state

### Nice to Have (Differentiators)

9. **Progressive disclosure** — Collapse optional params into "Advanced" section
10. **Smart defaults from URL** — Pre-populate form on page load
11. **Contextual placeholders** — "e.g., 2026-02-05" for date fields (NOT inline placeholders)
12. **Shareable filter state** — "Copy URL" button
13. **Contextual help** — Show OpenAPI `description` in tooltip

### Defer to v1.3 (Complex)

- Query builder (AND/OR logic)
- Filter presets/history
- Date range unified component
- Layout preview thumbnails
- Split view with adjustable ratio
- Filter impact preview ("~142 results")

## Feature Dependencies

```
v1.0 Foundation (Shipped):
  Parameter Forms (enum→dropdown, bool→checkbox)
    ↓
  Required/Optional Separation
    ↓
v1.2 Smart Parameters:
  URL Query Param Parsing
    ↓
    ├─→ Smart Type Inference (dates, emails, arrays)
    ├─→ Parameter Grouping by Prefix
    └─→ Smart Defaults from URL
    ↓
  Applied Filter Chips + Clear All
    ↓
  Progressive Disclosure (collapsible sections)
    ↓
  Layout System (sidebar, top bar, drawer)
    ↓
  Debounced Real-time Feedback
```

**Critical path for v1.2:**
1. URL parsing (can't skip — core feature)
2. Type inference (needed for smart inputs)
3. Grouping by prefix (key UX improvement)
4. Filter chips (makes active state visible)
5. Layout presets (key differentiator)

**Can be done in parallel:**
- Progressive disclosure (independent of parsing)
- Layout system (independent of params)
- UX polish (chips, loading states)

## Success Criteria for v1.2 Research

Research is complete when these questions are answered:

- [x] What are table stakes for filter UIs? — Multi-select, chips, clear all, instant feedback, prevent zero results, collapse groups
- [x] How do you parse URL query params into forms? — URLSearchParams API, handle array notation (brackets or repeated keys), sync bidirectionally
- [x] What types should smart inference detect? — Dates, emails, coords, arrays, booleans, numbers — pattern match on name + value
- [x] How does progressive disclosure work? — Collapse optional params, show count, remember state, max 2 nesting levels
- [x] What layout presets are expected? — Sidebar (desktop default), top bar (horizontal), drawer (mobile), split view (advanced)
- [x] What makes filter UX feel polished? — Debounced real-time, skeleton loaders, applied filter chips, count badges, clear hierarchy, undo support

## Sources

### Filter UI Patterns
- [Filter UX Design Patterns & Best Practices - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)
- [20 Filter UI Examples for SaaS - Arounda](https://arounda.agency/blog/filter-ui-examples)
- [Filter UI and UX 101 - UXPin](https://www.uxpin.com/studio/blog/filter-ui-and-ux/)
- [Algolia Search Filters Best Practices](https://www.algolia.com/blog/ux/search-filter-ux-best-practices)
- [Filter Groups Best Practice - DEV Community](https://dev.to/jurooravec/filter-groups-the-best-practice-of-filtering-just-about-anything-18ei)
- [Complex Filters UX - Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/complex-filtering/)

### Progressive Disclosure
- [Progressive Disclosure - Nielsen Norman Group](https://www.nngroup.com/articles/progressive-disclosure/)
- [Progressive Disclosure UX - Interaction Design Foundation](https://www.interaction-design.org/literature/topics/progressive-disclosure)
- [Progressive Disclosure for SaaS - UserPilot](https://userpilot.com/blog/progressive-disclosure-examples/)
- [Progressive Disclosure in UX Design - LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)

### URL Query Parameters & State Management
- [URLSearchParams - MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [URL State Management in React - LogRocket](https://blog.logrocket.com/url-state-usesearchparams/)
- [nuqs - Type-safe URL search params state management](https://nuqs.dev)
- [Array Parameters in Query Strings - REST API Best Practices](https://www.moesif.com/blog/technical/api-design/REST-API-Design-Best-Practices-for-Parameters-and-Query-String-Usage/)
- [Arrays in Query Params - RAML by Example](https://medium.com/raml-api/arrays-in-query-params-33189628fa68)

### Layout Systems & UI Patterns
- [Filter Drawer vs Sidebar vs Top Bar - UX for the Masses](https://www.uxforthemasses.com/filter-bars/)
- [Horizontal Filtering Toolbars - Baymard](https://baymard.com/blog/horizontal-filtering-sorting-design)
- [Drawer UI Design Best Practices - Mobbin](https://mobbin.com/glossary/drawer)
- [Dashboard Layout Systems - SaaS Frame](https://www.saasframe.io/categories/dashboard)

### Smart Defaults & Type Inference
- [Smart Defaults in Form UX - Zuko](https://www.zuko.io/blog/how-to-use-defaults-to-optimize-your-form-ux)
- [Cognitive Load and Smart Defaults - Shopify](https://www.shopify.com/partners/blog/cognitive-load)
- [Form Design Guidelines - UW UX Design](https://uxdesign.uw.edu/interaction/forms.html)
- [Placeholders Are Harmful - Nielsen Norman Group](https://www.nngroup.com/articles/form-design-placeholders/)

### Zero Results & Empty States
- [Empty State UX Best Practices - Pencil & Paper](https://www.pencilandpaper.io/articles/empty-states)
- [No Results Pages Strategies - Baymard](https://baymard.com/blog/no-results-page)
- [Empty State Design - Toptal](https://www.toptal.com/designers/ux/empty-state-ux-design)
- [No Results Found UX - LogRocket](https://blog.logrocket.com/ux-design/no-results-found-page-ux/)

### Filter Badges & Chips
- [Filter Chips Design - Good Practices](https://goodpractices.design/components/filter-chips)
- [Badges vs Pills vs Chips - Smart Interface Design Patterns](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/)
- [Enhancing Fluent UI with Filter Chips - Perficient](https://blogs.perficient.com/2026/02/04/enhancing-fluent-ui-detailslist-with-custom-sorting-filtering-lazy-loading-and-filter-chips/)
- [Table Filters - Innovaccer Design](https://design.innovaccer.com/patterns/tableFilters/usage/)

### API Testing Tools
- [Insomnia vs Postman 2026 - Abstracta](https://abstracta.us/blog/testing-tools/insomnia-vs-postman/)
- [Postman Alternatives 2026 - Apidog](https://apidog.com/blog/top-postman-alternative-open-source/)
- [API Testing Tools Guide 2026 - Tusk](https://www.usetusk.ai/resources/the-definitive-guide-to-api-testing-tools-in-2026)

### Inline Editing & Debouncing
- [Debounce Sources - Algolia](https://www.algolia.com/doc/ui-libraries/autocomplete/guides/debouncing-sources)
- [Filter UI Inline Edit Best Practices - Eleken](https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas)
- [React Search Bar Filtering - Refine](https://refine.dev/blog/react-search-bar-and-filtering/)
