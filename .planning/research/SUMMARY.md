# Research Summary: api2ui

**Domain:** API-to-UI Runtime Rendering Engine
**Researched:** 2026-02-01
**Overall confidence:** MEDIUM (comprehensive domain analysis, limited live verification)

## Executive Summary

api2ui is an API-to-UI rendering engine that transforms REST API endpoints into interactive web interfaces at runtime, without code generation. The research reveals this is a well-understood domain with clear technology choices (React + TypeScript + Vite), established architectural patterns (pipeline with schema-first design), and known critical pitfalls (CORS, naive schema inference, tight coupling).

The recommended stack prioritizes simplicity and zero-config experience: React 18 for component-based rendering, TypeScript for type safety during dynamic schema mapping, Vite for fast development, Tailwind CSS for rapid UI development, and Zustand for lightweight state management. The architecture follows a clear pipeline: API URL → Schema Provider → Type Mapper → Component Renderer → UI, with proper separation of concerns to avoid the most common failure mode (tight coupling between inference and rendering).

Critical success factors include: (1) handling CORS from day one (proxy or browser extension strategy), (2) multi-sample schema inference to handle API response variance, (3) clean module boundaries between schema inference and UI rendering, (4) virtualization for performance with large datasets, and (5) extensible component mapping system from the start.

The research identified six critical pitfalls that cause rewrites if not addressed early: naive single-response schema inference, CORS as an afterthought, tight coupling between inference and rendering, OpenAPI spec naivety, performance cliffs with large datasets, and inflexible component mapping. These must be addressed in Phases 0-1 of the roadmap.

## Key Findings

**Stack:** React 18 + TypeScript 5.6+ + Vite 6.x + Tailwind CSS 4.x + Zustand for state + native fetch. Start minimal, add swagger-parser for OpenAPI support, defer heavy libraries until complexity demands them.

**Architecture:** Pipeline pattern with UnifiedSchema as convergence point. Two input paths (API inference, OpenAPI parsing) → one schema format → type-to-component mapper → dynamic renderer. Clear module boundaries prevent tight coupling pitfall.

**Critical pitfall:** Naive schema inference from single API response. Must analyze 2-3 responses, track confidence levels, handle nulls vs missing fields, detect array polymorphism. This is foundational and hard to retrofit.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 0: Architecture Decisions (Before coding)
**Focus:** Resolve CORS strategy, confirm UnifiedSchema approach
- **Rationale:** CORS determines if backend needed (breaks "client-only" promise). Must decide before building.
- **Addresses:** Critical Pitfall #2 (CORS afterthought)
- **Avoids:** Building entire app then discovering CORS breaks it
- **Duration:** 1-2 days research + decision

### Phase 1: Foundation (Week 1)
**Focus:** Prove the rendering pipeline with hardcoded schema
- **Rationale:** Validate architecture before complexity. Can we render UI from schema object?
- **Addresses:**
  - Application Shell (routing, mode toggle skeleton)
  - Schema Provider (interface, mock data)
  - Component Registry (2-3 basic components)
  - Component Renderer (basic rendering)
  - View Mode UI
- **Avoids:** Critical Pitfall #3 (tight coupling) by establishing clean boundaries from start
- **Validation:** Hardcoded schema → rendered UI
- **Duration:** 1 week

### Phase 2: Schema Inference (Week 2)
**Focus:** Real API URL → inferred schema → rendered UI
- **Rationale:** Core value proposition. "Paste URL, see UI."
- **Addresses:**
  - API Fetcher (with CORS handling from Phase 0 decision)
  - Schema Inferrer (multi-sample, confidence tracking)
  - Type-to-Component Mapper (default mappings)
  - Expand Component Registry (7 total components)
- **Avoids:**
  - Critical Pitfall #1 (naive inference) via multi-sample analysis
  - Critical Pitfall #5 (performance) via virtualization from start
  - Critical Pitfall #6 (inflexible mapping) via registry pattern
- **Validation:** Real API URL → working UI
- **Duration:** 1 week
- **Research flag:** May need deeper research on type inference heuristics

### Phase 3: OpenAPI Support (Week 3)
**Focus:** OpenAPI spec → same rendered UI quality
- **Rationale:** Industry expects OpenAPI support. Proves UnifiedSchema abstraction works.
- **Addresses:**
  - OpenAPI Parser (defensive, with fallback to inference)
  - Schema Provider.fromOpenAPISpec
  - Spec input UI
- **Avoids:** Critical Pitfall #4 (OpenAPI naivety) via defensive parsing + fallback
- **Validation:** Provide spec → same UI quality as inference
- **Duration:** 1 week
- **Research flag:** May need research on swagger-parser alternatives, quirk handling

### Phase 4: Configuration System (Week 4)
**Focus:** User customization with persistence
- **Rationale:** "Configure mode" is core differentiator vs read-only API explorers
- **Addresses:**
  - Config Store (localStorage)
  - Configure Mode UI
  - Type Mapper override logic
  - CSS customization
- **Avoids:** Moderate Pitfall #7 (no caching) by implementing persistence
- **Validation:** Override component, reload → persists
- **Duration:** 1 week

### Phase 5: Navigation & Polish (Week 5)
**Focus:** Multi-endpoint support, master-detail pattern
- **Rationale:** Real APIs have multiple endpoints. Master-detail is table stakes for nested data.
- **Addresses:**
  - Endpoint Navigator
  - Master-detail components
  - Multi-endpoint schema support
- **Avoids:** Moderate Pitfall #9 (master-detail state loss) via URL-based navigation
- **Validation:** Multi-endpoint API with nested data works smoothly
- **Duration:** 1 week

### Phase 6: Production Polish (Week 6)
**Focus:** Landing page, error handling, examples
- **Rationale:** Make it usable for real users
- **Addresses:**
  - Landing page with example APIs
  - Comprehensive error handling (specific error types)
  - Loading states, empty states
  - Example API gallery
- **Avoids:** Moderate Pitfall #12 (error ambiguity) via specific error types
- **Validation:** Non-technical user can paste URL and get value
- **Duration:** 1 week

**Total MVP timeline:** 6 weeks

## Phase Ordering Rationale

1. **Architecture Decisions before coding:** CORS strategy determines if backend needed. Can't defer this.

2. **Foundation before inference:** Prove rendering pipeline works with mock data before adding inference complexity. Establishes clean boundaries that prevent Critical Pitfall #3 (tight coupling).

3. **Inference before OpenAPI:**
   - Inference is harder (no schema provided), so tackle first
   - OpenAPI reuses inference output format (UnifiedSchema)
   - Proves UnifiedSchema abstraction works
   - Defers swagger-parser dependency until core value proven

4. **Configuration after rendering:** Need working UI before customization makes sense. Users can't configure what doesn't render.

5. **Multi-endpoint after single-endpoint:** Get the core flow right for one endpoint before handling multiple. Navigation complexity deferred.

6. **Polish last:** Don't polish before core features work. Landing page needs example of working renderer.

**Critical path dependencies:**
- Schema Provider → Type Mapper → Renderer (can't skip any)
- Inference proven → OpenAPI added (reuses schema format)
- Renderer working → Configuration added (overrides rendering)
- Single endpoint proven → Multi-endpoint added (extends pattern)

## Research Flags for Phases

**Phase 0 - High research need:**
- CORS proxy options (architecture decision)
- Browser extension feasibility (alternative to proxy)

**Phase 2 - Medium research need:**
- Type inference algorithms (multi-sample analysis, confidence scoring)
- Virtualization library choice (react-window vs alternatives)
- Performance benchmarking approach

**Phase 3 - Low-Medium research need:**
- swagger-parser alternatives (current best option?)
- OpenAPI quirk database (common spec issues)

**Phase 4-6 - Low research need:**
- Standard patterns, unlikely to need deep research
- May need spot research on specific UI libraries (table, form)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core choices (React, TS, Vite) are solid. Versions unverified due to limited web access. |
| Features | MEDIUM | Feature landscape well-understood from competitor analysis. User priorities need validation. |
| Architecture | MEDIUM-HIGH | Pipeline pattern is proven. UnifiedSchema approach is sound. Module boundaries clear. |
| Pitfalls | HIGH | Critical pitfalls well-documented in domain. Prevention strategies established. |

**Confidence limitations:**
- Unable to verify exact current versions (WebSearch/WebFetch unavailable)
- Library recommendations based on Jan 2025 training data
- User persona priorities hypothetical (need real user research)
- Competitor feature sets may have changed since training

**High confidence areas:**
- Architectural patterns (pipeline, schema-first, separation of concerns)
- Critical pitfall identification (CORS, naive inference, tight coupling, performance)
- Technology category choices (React for dynamic rendering, TypeScript for type safety)
- Anti-patterns (what NOT to build: code generation, drag-drop builder, custom DSL)

## Gaps to Address

### Research gaps (couldn't verify):
1. **Current library versions:** React 18.3.x vs 18.4.x vs 19.x? Vite 5.x vs 6.x? Tailwind 4.x status?
2. **OpenAPI parser landscape:** Is swagger-parser still best option in 2026? New alternatives?
3. **State management evolution:** Has Zustand maintained dominance? New lightweight alternatives?
4. **Virtualization libraries:** Is react-window still standard? Better options in 2026?

**Mitigation:** Verify before Phase 1:
```bash
npm info react version
npm info vite version
npm info tailwindcss version
npm info swagger-parser version
npm info zustand version
```

### User research gaps (need validation):
1. **CORS tolerance:** Will users accept proxy requirement or does it kill adoption?
2. **Configuration UX:** Is inline editing better than sidebar settings? Need usability testing.
3. **OpenAPI prevalence:** What % of users have specs vs rely on inference?
4. **Component preferences:** Do users prefer tables, cards, or lists for array data?

**Mitigation:**
- Ship MVP with basic analytics
- A/B test configuration UX approaches
- Survey early users on API spec availability
- Instrument which components users choose

### Technical unknowns (need implementation):
1. **Schema inference accuracy:** How many samples needed for 95% confidence?
2. **Performance thresholds:** At what dataset size does virtualization become critical?
3. **OpenAPI quirk frequency:** How often do real specs fail parsing?
4. **CORS failure rate:** What % of target APIs are CORS-blocked?

**Mitigation:**
- Phase 2: Implement multi-sample inference, measure confidence metrics
- Phase 2: Performance test with 100, 1K, 10K, 100K item datasets
- Phase 3: Parse 100 real OpenAPI specs from APIs.guru, measure failures
- Phase 0: Test CORS on 50 popular public APIs, document success rate

## Technology Selection Rationale

### Why React over Vue/Svelte
- **React:** Largest ecosystem for dynamic rendering patterns, proven at scale, component model perfect for runtime composition
- **Not Vue:** Smaller ecosystem, fewer examples of dynamic runtime rendering
- **Not Svelte:** Compile-time framework, less suited for unknown runtime schemas

### Why TypeScript (non-negotiable)
- Inferring types from API responses → mapping to UI components requires type manipulation
- Catch errors at compile time that would be runtime bugs
- Intellisense for complex schema objects
- **No alternative:** Vanilla JS would be unmaintainable for this use case

### Why Vite over Webpack
- **Vite:** Fast dev server (ESBuild), simple config, native TypeScript, modern
- **Not Webpack:** Legacy, complex config, slower, overkill for SPA
- **Not Parcel:** Less mature, smaller ecosystem

### Why Tailwind over CSS-in-JS
- **Tailwind:** Compile-time CSS (fast), easy customization via config, design system out of box
- **Not Styled Components/Emotion:** Runtime performance cost, CSS-in-JS falling out of favor
- **Not CSS Modules alone:** More verbose for rapid prototyping (but valid alternative)

### Why Zustand over Redux
- **Zustand:** Minimal boilerplate (1KB), built-in persistence, perfect for config storage
- **Not Redux:** Massive overkill for storing UI configs
- **Not Context alone:** Lacks persistence, more boilerplate than Zustand

### Why fetch over Axios (for v1)
- **fetch:** Native, zero dependencies, sufficient for GET-only public APIs
- **Axios:** Useful later (interceptors, retries, better error handling) but premature for v1
- **Migration path:** Start fetch, add Axios when needed

### Why custom components over libraries (for v1)
- **Custom:** Full control, no learning curve, lighter bundle
- **TanStack Table:** Powerful but complex, defer until v2
- **React Hook Form:** Useful but may be overkill for simple parameter forms
- **Strategy:** Build custom for MVP, add libraries when complexity demands

## Recommended Next Steps

### Immediate (Before Phase 1):
1. **Verify library versions:**
   ```bash
   npm info react version
   npm info typescript version
   npm info vite version
   npm info tailwindcss version
   ```

2. **CORS research:**
   - Test 20-30 target public APIs for CORS
   - Evaluate CORS proxy options (cors-anywhere, allorigins, custom)
   - Decide: client-only + CORS limitation, or proxy requirement
   - Document decision in architecture doc

3. **Schema inference spike:**
   - Prototype multi-sample inference algorithm
   - Test with 10 real APIs, measure accuracy
   - Validate confidence scoring approach

### Phase 1 Prep:
4. **Initialize project:**
   ```bash
   npm create vite@latest api2ui -- --template react-ts
   npm install zustand
   npm install -D tailwindcss postcss autoprefixer
   ```

5. **Set up architecture boundaries:**
   - Create module structure: services/, components/, types/, store/
   - Define UnifiedSchema interface
   - Implement Schema Provider skeleton with mock data

6. **Establish testing:**
   ```bash
   npm install -D vitest @testing-library/react
   ```
   - Write first tests for schema inference (when implemented)

## Ready for Roadmap

Research is comprehensive and actionable. Key outputs:

1. **STACK.md:** Technology choices with rationale (React, TS, Vite, Tailwind, Zustand)
2. **ARCHITECTURE.md:** Pipeline pattern, component boundaries, data flow
3. **FEATURES.md:** Table stakes vs differentiators vs anti-features, MVP scope
4. **PITFALLS.md:** 6 critical pitfalls, 6 moderate pitfalls, prevention strategies

**Roadmap creators can:**
- Structure phases based on recommended ordering (Foundation → Inference → OpenAPI → Config → Navigation → Polish)
- Avoid critical pitfalls by addressing them in correct phases (CORS in Phase 0, naive inference in Phase 2)
- Choose appropriate technologies from STACK.md recommendations
- Implement architecture from ARCHITECTURE.md patterns
- Prioritize features from FEATURES.md MVP list

**Confidence in roadmap input:** MEDIUM-HIGH
- Architecture is sound and proven
- Technology choices are well-justified
- Pitfall identification is comprehensive
- Phase ordering has clear rationale
- Only uncertainty is exact library versions (need verification)

**Research complete. Proceeding to roadmap creation.**
