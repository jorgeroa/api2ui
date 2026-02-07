# Project Research Summary

**Project:** api2ui v1.3 - Smart Default Component Selection
**Domain:** Semantic field detection and intelligent UI rendering for API visualization
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

The v1.3 "Smart Default Selection" milestone aims to transform api2ui's detail views from generic data dumps into product-page-quality UIs through semantic field analysis and intelligent component selection. Research across stack analysis, feature landscape, architecture patterns, and domain pitfalls reveals a clear path forward: **extend the existing zero-dependency heuristic pattern** (already proven in `imageDetection.ts` and `primitiveDetection.ts`) with field name pattern matching, add a data transformation pipeline layer between schema inference and rendering, and preserve user overrides with absolute precedence.

The recommended approach combines three techniques: (1) **name-based pattern matching** using regex (reviews/ratings/prices/images → semantic categories), (2) **data shape analysis** (3-6 fields with images → cards; 10+ fields → table), and (3) **field importance scoring** (combining name patterns, visual richness, data presence, and position to rank fields). This builds on the existing type-based component mapping without breaking it. The architecture inserts a new analysis layer that runs once per API response, caches results in appStore, and feeds smart defaults to DynamicRenderer while configStore user overrides always win.

The highest risk is **false positive component selection** destroying user trust. A field named "rating_count" misidentified as a star rating component, or auto-grouping that makes navigation harder instead of easier, will cause users to abandon smart defaults entirely. Prevention requires conservative thresholds (>90% confidence), multi-signal detection (name + type + values must agree), and falling back to v1.2 type-based defaults when uncertain. Secondary risks include breaking existing v1.2 configurations during upgrade and performance degradation from analysis overhead. The research strongly recommends precision over recall: better to show a boring but correct default than a clever but wrong one.

## Key Findings

### Recommended Stack

Research conclusively shows that **zero-dependency custom heuristics** are the right approach for this problem domain. Machine learning, NLP libraries, string similarity algorithms, and embedding models are all **overkill** for mapping field names to component types. The problem is well-defined (limited vocabulary of ~20-30 common field patterns), the solution space is small and stable (6-8 component types), and the existing codebase already demonstrates the pattern successfully.

**Core approach: Rule-based pattern matching (NO external libraries needed)**

The existing codebase in `imageDetection.ts` and `primitiveDetection.ts` already implements the foundation. Research from Google ML guidelines and multiple industry sources confirms that simple rules win when problems are well-defined and data is stable. Field naming conventions in APIs are highly consistent (REST guidelines, OpenAPI best practices), making regex-based classification highly accurate.

**What to extend:**
- **Create `semanticDetection.ts`**: Pattern matching for arrays/objects (reviews → cards, specifications → key-value, images → gallery)
- **Leverage existing OpenAPI hints**: `description`, `format`, `title` fields already parsed in schema provide semantic context
- **Integration points**: Enhance `mapper.ts` with semantic layer before component selection

**Optional enhancement (defer to later phase):**
- **pluralize library (1KB)**: Normalize "review" vs "reviews" if pattern matching becomes complex
- Only add if manual plural/singular handling exceeds 10 edge cases

**DO NOT add:**
- NLP libraries (NLP.js, wink-nlp, Natural) - overkill for field name matching
- ML/embeddings (transformers.js) - 25MB+ for marginal benefit, kills mobile performance
- String similarity (cmpstr, string-similarity) - wrong tool, field names need semantic matching not similarity scoring
- Complex pattern matchers (ts-pattern) - native TypeScript sufficient for this use case

**Confidence: HIGH** - Zero-dependency approach is validated by existing codebase patterns, authoritative sources (Google ML Rules), and alignment with the project's performance requirements.

### Expected Features

The feature landscape research reveals what users expect from "smart defaults" by analyzing production tools (Airtable, Retool, Hasura) and ecommerce product detail pages.

**Must have (table stakes):**
- **Field name pattern recognition** - "name", "title", "description" automatically emphasized
- **Array content differentiation** - Reviews/comments render as cards, not tables
- **Primary field emphasis** - Name/title fields larger, bolder; IDs smaller, de-emphasized
- **Image field detection** - Already in v1.1, extend to influence layout decisions
- **Basic semantic types** - Detect 20-30 common patterns (reviews, ratings, prices, images, dates)
- **Table vs cards heuristic** - <8 fields + rich content → cards; 10+ fields → table
- **Preserve manual overrides** - User choices always win over smart defaults

**Should have (differentiators):**
- **Semantic section auto-grouping** (HIGH VALUE) - Group related fields (billing*, shipping*) into visual sections
- **Rating/review pattern detection** (HIGH VALUE) - Arrays with "rating" + "comment" → card layout with stars
- **Field importance scoring** (HIGH VALUE) - Rank fields by name (40%), visual richness (25%), data presence (20%), position (15%)
- **Gallery detection** (MEDIUM VALUE) - Array of image URLs → image grid, not cards
- **Context-aware components** (MEDIUM VALUE) - "status" enum → badge; "tags" → tag chips

**Defer to v1.4:**
- Smart tab generation (complex, needs user research on categorization)
- Date range pairing (complex relationship detection)
- ML-based importance scoring (unnecessary for v1.3)

**Critical UX finding:** Vertical accordions outperform horizontal tabs (8% content overlooked vs 27% with tabs per Baymard research). Never use horizontal tabs for detail view organization.

**Confidence: MEDIUM-HIGH** - Patterns verified across design systems and ecommerce PDPs, but threshold values (card vs table at 8 fields) require field testing.

### Architecture Approach

The architecture research identifies where and when to perform semantic analysis while preserving clean separation of concerns and user overrides.

**Recommended: Data transformation pipeline with cached analysis metadata**

```
API Response → Schema Inference → Field Analysis → Enriched Schema → DynamicRenderer
                                        ↓
                               AnalysisMetadata
                               (cached in appStore)
```

**Major components:**

1. **Analysis Layer** (`src/services/analysis/`) - Runs once per API response, before rendering
   - `fieldClassifier.ts` - Pattern matching for semantic categories (primary, review, rating, image, price, spec, metadata)
   - `groupingAnalyzer.ts` - Detect tab/section opportunities based on field clusters
   - `componentSuggester.ts` - Map semantic categories to component types
   - `fieldAnalyzer.ts` - Orchestrator combining classification, grouping, suggestion

2. **Storage Integration** (`appStore.ts`) - Add `analysisMetadata` field alongside `schema` and `data`
   - Analysis runs after schema inference, before storage
   - Metadata cached for performance (<2ms for 100 fields)
   - Invalidated on new API fetch

3. **Smart Selection** (`DynamicRenderer.tsx`) - Modified to read metadata for defaults
   - Replace `getDefaultTypeName()` with `getSmartDefaultTypeName()`
   - Falls back to structural defaults when metadata missing or low confidence
   - User overrides in configStore always take precedence (no changes needed)

4. **Smart Grouping** (`DetailRenderer.tsx`) - Use metadata for section organization
   - Check grouping strategy (tabs/sections/flat)
   - Conditionally render TabsRenderer or SectionRenderer
   - Fall back to existing flat layout

**Integration principle: Explicit beats implicit**
- Priority hierarchy: User override (configStore) > Smart default (metadata) > Type-based default
- Existing override mechanism preserved unchanged
- Smart defaults never overwrite explicit user choices

**Build order:**
1. **Phase 1**: Analysis layer (independent, testable in isolation)
2. **Phase 2**: Storage integration (low risk, additive change)
3. **Phase 3**: Smart selection (medium risk, uses metadata)
4. **Phase 4**: Smart grouping (high risk, complex UX changes)

**Confidence: HIGH** - Architecture patterns are well-established, integration points are clean, existing override mechanism provides safety net.

### Critical Pitfalls

Research on domain pitfalls identifies five critical risks that must be addressed in Phase 1:

1. **False Positive Component Selection** (SEVERITY: CRITICAL)
   - **Risk:** Heuristics misidentify field semantics. "rating_count" becomes star rating, "status" becomes badge when it should be text.
   - **Prevention:** Precision over recall. Require HIGH confidence (>90%). Multi-signal detection (name + type + values must agree). Fallback to type-based defaults when uncertain.
   - **Detection:** Override rate >20% signals users don't trust defaults.

2. **Breaking Existing v1.2 Configurations** (SEVERITY: CRITICAL)
   - **Risk:** Users with saved configs see their UI break when v1.3 ships. Smart defaults override explicit user choices.
   - **Prevention:** Config versioning. Explicit beats implicit (user overrides ALWAYS win). Opt-in for existing endpoints. Feature flag with gradual rollout.
   - **Detection:** Spike in localStorage changes, "my view broke" reports.

3. **Auto-Grouping Creates Worse UX** (SEVERITY: CRITICAL)
   - **Risk:** Grouping 15 fields into 5 tabs adds clicks instead of clarity. Poor group naming. Z-pattern scanning breaks.
   - **Prevention:** Conservative thresholds (only group when >8 fields AND clear clusters). Never exceed 2 nesting levels. No tab with <3 fields. "Show all ungrouped" always available.
   - **Detection:** Users clicking "show all" more than exploring tabs, increased time-to-information.

4. **Performance Degradation** (SEVERITY: MODERATE)
   - **Risk:** Running semantic analysis on every field on every render causes lag.
   - **Prevention:** Schema-level detection (once per schema, not per row). Memoization. Performance budget <100ms overhead vs v1.2.
   - **Detection:** Lighthouse score drops, time-to-interactive increases.

5. **Override Conflicts** (SEVERITY: MODERATE)
   - **Risk:** User manually changes component, next API call re-runs detection and switches it back.
   - **Prevention:** Three-tier state model. Sticky overrides (once user changes, lock it). Visual distinction showing semantic vs user choice.
   - **Detection:** "Settings won't save" complaints, high re-configuration rate.

**Key insight:** Unlike building from scratch, integration pitfalls with existing v1.2 system dominate the risk landscape. This is about making an already-working system smarter without making it worse.

## Implications for Roadmap

Based on combined research, the recommended phase structure follows the architecture build order with risk mitigation at each step.

### Phase 1: Core Semantic Detection
**Rationale:** Build the foundation (analysis layer) independently from the rest of the system. This allows testing pattern matching in isolation before integration. Addresses the highest risk (false positives) early.

**Delivers:**
- `fieldClassifier.ts` with pattern library for 20-30 common field types
- `componentSuggester.ts` mapping semantic categories to components
- `fieldAnalyzer.ts` orchestrator
- Comprehensive unit tests with diverse real-world APIs

**Addresses (from FEATURES.md):**
- Field name pattern recognition (table stakes)
- Basic semantic field types (table stakes)
- Context-aware component selection (differentiator)

**Avoids (from PITFALLS.md):**
- False positive selection (multi-signal detection, high precision thresholds)
- Overfitting to test APIs (diverse 20+ API test corpus)
- Ambiguous field names (value validation, not just name matching)

**Stack elements (from STACK.md):**
- Zero-dependency pattern matching
- Extend existing `imageDetection.ts` pattern
- Leverage OpenAPI `description`/`format`/`title` hints

**Research flag:** STANDARD PATTERNS - Pattern matching is well-documented, no additional research needed

### Phase 2: Field Importance & Grouping Analysis
**Rationale:** Once classification works, add intelligence about which fields are important and how to group them. Still independent of rendering integration.

**Delivers:**
- `groupingAnalyzer.ts` for tab/section detection
- Field importance scoring algorithm (name 40%, visual richness 25%, data presence 20%, position 15%)
- Conservative grouping thresholds (>8 fields, clear clusters)

**Addresses (from FEATURES.md):**
- Primary field emphasis (table stakes)
- Field importance scoring (differentiator)
- Semantic section auto-grouping (differentiator)

**Avoids (from PITFALLS.md):**
- Auto-grouping creates worse UX (conservative thresholds, field count balance)
- Hiding critical data (never hide >30% of fields)

**Architecture (from ARCHITECTURE.md):**
- Grouping heuristics: Only group when >8 fields AND clear semantic clusters
- Two-level limit on nesting
- Flat-first philosophy

**Research flag:** NEEDS USER TESTING - Grouping thresholds (8 fields, 3-4 tabs max) need validation with real users

### Phase 3: Storage & Integration
**Rationale:** Connect analysis layer to existing system. This is where backwards compatibility risk materializes. Must handle v1.2 config migration carefully.

**Delivers:**
- Extend `appStore.ts` with `analysisMetadata` field
- Modify pipeline to call `analyzeFields()` after schema inference
- Config versioning for v1.2 migration
- Feature flag for gradual rollout

**Addresses (from FEATURES.md):**
- Preserve manual overrides (table stakes)

**Avoids (from PITFALLS.md):**
- Breaking existing behavior (config versioning, explicit > implicit)
- Override conflicts (three-tier state model)
- Performance degradation (analysis runs once, cached in appStore)

**Architecture (from ARCHITECTURE.md):**
- Analysis before render (preprocessing layer)
- User overrides always win (priority hierarchy)
- Graceful degradation (fall back to type-based defaults)

**Research flag:** NEEDS MIGRATION TESTING - Must validate with actual v1.2 localStorage configs

### Phase 4: Smart Component Selection
**Rationale:** Enable smart defaults in DynamicRenderer. This is the first user-visible change. Keep it conservative - only apply HIGH confidence suggestions.

**Delivers:**
- Modify `DynamicRenderer.tsx` to use `getSmartDefaultTypeName()`
- Smart defaults for arrays (reviews → cards, specs → table)
- Image gallery detection (array of image URLs)
- Fallback to type-based defaults when confidence <90%

**Addresses (from FEATURES.md):**
- Array content differentiation (table stakes)
- Table vs cards heuristic (table stakes)
- Gallery detection (differentiator)

**Avoids (from PITFALLS.md):**
- False positive selection (high confidence threshold, fallback chain)
- Component library gaps (only suggest existing components)

**Stack elements (from STACK.md):**
- Integration into existing `mapper.ts` pattern
- Type-based defaults as fallback

**Research flag:** STANDARD PATTERNS - Component selection logic follows existing patterns

### Phase 5: Smart Grouping & Visual Hierarchy
**Rationale:** Most complex UX change. Requires new components (TabsRenderer, SectionRenderer). Highest risk of making UX worse. Build escape hatches first.

**Delivers:**
- Modify `DetailRenderer.tsx` to check grouping strategy
- TabsRenderer component (if tabs strategy applies)
- SectionRenderer with visual separators
- "Show all (ungrouped)" escape hatch
- Visual hierarchy (hero/primary/secondary/tertiary styling)

**Addresses (from FEATURES.md):**
- Semantic section auto-grouping (differentiator)
- Rating/review pattern detection (differentiator)
- Hero image detection (extend v1.1)

**Avoids (from PITFALLS.md):**
- Auto-grouping creates worse UX (vertical accordions, not tabs; conservative thresholds)
- Hiding critical data (importance-based styling, not hiding)
- Too smart creepiness (explain decisions, visual indicators)

**Architecture (from ARCHITECTURE.md):**
- Vertical accordions preferred (Baymard research: 8% overlook vs 27% for tabs)
- Hero + Overview + Sections pattern (from ecommerce PDPs)
- Two-level grouping limit

**Research flag:** NEEDS USER TESTING - Group organization, tab categories, accordion vs tabs tradeoffs need field validation

### Phase 6: Polish & Context-Aware Components
**Rationale:** Add specialized components for detected semantic types. Optional enhancements that improve polish without affecting core functionality.

**Delivers:**
- Badge component for status/state fields
- Tag chips for tags/categories arrays
- Star rating component for rating fields
- Price formatting (Intl.NumberFormat)
- Date formatting (relative or absolute)

**Addresses (from FEATURES.md):**
- Context-aware components (differentiator)

**Architecture (from ARCHITECTURE.md):**
- Component variety beyond table/cards/detail
- Read vs write contexts (badge in read, dropdown in forms)

**Research flag:** STANDARD PATTERNS - Component libraries well-documented

### Phase Ordering Rationale

1. **Analysis layer first (Phases 1-2)** - Independent development, testable in isolation, addresses highest risks (false positives, overfitting) early
2. **Integration next (Phase 3)** - Clean boundary between analysis and rendering, handles backwards compatibility before user-facing changes
3. **Conservative rollout (Phases 4-6)** - Smart selection before grouping, escape hatches before complex UX, polish last

**Dependency chain:**
```
Phase 1 (Detection) ← Phase 2 (Grouping) ← Phase 3 (Storage) ← Phase 4 (Selection) ← Phase 5 (Grouping UI) ← Phase 6 (Polish)
```

**Risk mitigation strategy:**
- Build escape hatches before complex features (Phase 4 includes fallbacks before Phase 5 adds grouping)
- Feature flag at Phase 3 allows kill switch if issues arise
- User testing gates at Phases 2 and 5 validate assumptions before shipping

### Research Flags

**Needs user testing:**
- **Phase 2:** Grouping thresholds, field importance weights
- **Phase 5:** Tab categories, accordion vs tabs tradeoffs, section organization

**Needs migration testing:**
- **Phase 3:** v1.2 config compatibility, localStorage migration

**Standard patterns (skip research-phase):**
- **Phase 1:** Pattern matching well-documented
- **Phase 4:** Component selection follows existing mapper.ts
- **Phase 6:** Component libraries standard

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency approach validated by existing codebase (imageDetection.ts, primitiveDetection.ts) and authoritative sources (Google ML Rules). Decision to NOT add ML/NLP libraries is strongly supported. |
| Features | MEDIUM-HIGH | Patterns verified across design systems (Airtable, Retool), ecommerce PDPs (Baymard research), and admin panel generators (Hasura). Threshold values (8 fields for cards) need field testing. |
| Architecture | HIGH | Data transformation pipeline pattern is well-established. Integration points are clean. Override precedence mechanism already exists and works. Build order validated by risk analysis. |
| Pitfalls | MEDIUM | WebSearch-informed findings corroborated across multiple authoritative sources (NN/G, IxDF, Google ML). General UX principles applied to specific api2ui context. No official docs for this niche domain, but existing codebase analysis provides HIGH confidence on integration risks. |

**Overall confidence: HIGH**

Research is comprehensive across all four dimensions. Stack recommendation (zero-dependency heuristics) is definitively validated. Architecture approach builds cleanly on existing patterns. Feature research identifies clear table stakes vs differentiators. Pitfall analysis provides concrete prevention strategies for all critical risks.

### Gaps to Address

**Threshold calibration:**
- Card vs table threshold (currently 8 fields) needs validation with real APIs
- Confidence threshold (currently 90%) may need tuning based on precision/recall tradeoff
- Grouping field count balance (<3 fields or >60% flags issues) requires user testing

**How to handle:** Build with configurable thresholds. Gather telemetry during alpha testing. Tune based on user override rates and satisfaction surveys.

**Pattern library completeness:**
- Initial 20-30 field patterns may miss domain-specific conventions
- Non-English field names not addressed (but API field names typically English)

**How to handle:** Start with conservative pattern set. Add patterns incrementally based on user feedback. Document pattern addition process for community contributions.

**Performance benchmarks:**
- <100ms overhead target is estimated, needs validation across device types
- Large response handling (1000+ fields) performance unknown

**How to handle:** Establish baseline from v1.2. Profile with React DevTools. Test on throttled mobile devices. Add performance budgets to CI.

**v1.2 config migration:**
- Exact localStorage schema for v1.2 configs needs examination
- Migration logic requires testing with actual saved configs

**How to handle:** Audit v1.2 localStorage structure before Phase 3. Create migration test suite with real user configs (anonymized). Feature flag allows rollback.

## Sources

### Primary (HIGH confidence)

**Technology Stack:**
- [Google ML Rules: First Rule of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml) - Don't use ML until you have data
- [Cortance: ML vs Heuristics](https://cortance.com/answers/machine-learning/machine-learning-vs-heuristics-when-do-simple-rules-win) - Simple rules win for well-defined problems
- [OpenAPI Format Registry](https://spec.openapis.org/registry/format/) - Schema hint standardization
- [OpenAPI Data Types - Swagger](https://swagger.io/docs/specification/v3_0/data-models/data-types/) - Type and format specifications

**Feature Landscape:**
- [Baymard Institute: Product Page UX](https://baymard.com/research/product-page) - 27% overlook horizontal tabs vs 8% for vertical sections
- [Baymard: Current State 2025](https://baymard.com/blog/current-state-ecommerce-product-page-ux) - Product detail page best practices
- [Airtable Field Types](https://support.airtable.com/docs/supported-field-types-in-airtable-overview) - Auto-detection patterns
- [Retool vs Appsmith](https://www.jetadmin.io/appsmith-vs-retool) - Smart component defaults in low-code builders

**Architecture Patterns:**
- [React Memoization](https://www.toptal.com/react/react-memoization) - Caching expensive computations
- [Data Pipeline Transformation](https://dev.to/jajibhee/solving-frontend-performance-the-data-pipeline-transformation-2206) - Preprocessing architecture
- [Frontend Performance Architecture](https://www.debugbear.com/blog/performant-front-end-architecture) - Caching strategies

**Domain Pitfalls:**
- [Google ML: Classification Precision/Recall](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) - Threshold balance
- [NN/G: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) - UX research on grouping
- [NN/G: Form Design White Space](https://www.nngroup.com/articles/form-design-white-space/) - Field grouping patterns

### Secondary (MEDIUM confidence)

**Feature Patterns:**
- [UX Patterns: Table vs List vs Cards](https://uxpatterns.dev/pattern-guide/table-vs-list-vs-cards) - Data display patterns
- [Medium: Product Detail Page Tabs](https://medium.com/@pio.oleksy/are-you-using-tabs-on-the-product-detail-page-for-organizing-content-013dea4e1e83) - Tab UX research
- [Schema.org Semantic Value](https://www.schemaapp.com/schema-markup/the-semantic-value-of-schema-markup-in-2025/) - Structured data patterns

**Architecture Integration:**
- [Semantic UI React](https://react.semantic-ui.com/) - Component selection patterns
- [CSS Inheritance and Overrides](https://thelinuxcode.com/applying-inheritance-in-css-2026-predictable-styling-theming-and-safe-overrides/) - Override precedence patterns
- [Android State Preservation](https://developer.android.com/guide/topics/resources/runtime-changes) - Config migration patterns

**Pitfall Mitigation:**
- [IxDF: Progressive Disclosure](https://www.interaction-design.org/literature/topics/progressive-disclosure) - Grouping limits
- [Feature Flags Best Practices](https://octopus.com/devops/feature-flags/feature-flag-best-practices/) - Gradual rollout
- [Backwards Compatibility - Stack Overflow](https://stackoverflow.blog/2020/05/13/ensuring-backwards-compatibility-in-distributed-systems/) - Breaking change prevention

### Tertiary (LOW confidence, needs validation)

**Semantic Detection:**
- [Megagon Labs: Semantic Type Detection](https://megagonlabs.medium.com/semantic-type-detection-why-it-matters-current-approaches-and-how-to-improve-it-62027bf8632f) - Industry approaches
- [BigID: Classification for Data Attributes](https://bigid.com/blog/smarter-classification-for-data-attributes-metadata-and-files/) - Pattern matching systems

**Generative UI:**
- [Complete Guide to Generative UI Frameworks 2026](https://medium.com/@akshaychame2/the-complete-guide-to-generative-ui-frameworks-in-2026-fde71c4fa8cc) - AI-driven component selection trends
- [Top 10 AI Data Visualization Tools 2026](https://www.fusioncharts.com/blog/top-ai-data-visualization-tools/) - Smart insights approaches

---

*Research completed: 2026-02-07*

*Ready for roadmap: YES*

**Next steps for orchestrator:**
1. Use Phase 1-6 structure as roadmap foundation
2. Flag Phases 2 and 5 for user testing during planning
3. Flag Phase 3 for migration testing with v1.2 configs
4. Proceed to requirements definition with high confidence
