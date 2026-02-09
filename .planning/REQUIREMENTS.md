# Requirements: api2ui v1.3

**Defined:** 2026-02-07
**Core Value:** Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.

## v1.3 Requirements

### Semantic Detection

- [x] **SEM-01**: Engine detects 20-30 common field name patterns (reviews, images, price, rating, status, tags, specifications, etc.)
- [x] **SEM-02**: Multi-signal detection requires name + type + values to agree for HIGH confidence classification
- [x] **SEM-03**: OpenAPI hints (description, format, title) inform semantic classification when available
- [x] **SEM-04**: Confidence scoring determines when to apply smart defaults vs fall back to type-based defaults
- [x] **SEM-05**: User overrides always take precedence over smart defaults (explicit beats implicit)

### Array Rendering Intelligence

- [x] **ARR-01**: Arrays with review/comment semantics default to card layout instead of table
- [x] **ARR-02**: Arrays with specification/attribute semantics default to key-value pairs
- [x] **ARR-03**: Arrays of image URLs default to gallery/grid view
- [x] **ARR-04**: Table vs cards heuristic: <8 fields + rich content → cards; 10+ fields → table
- [x] **ARR-05**: Rating pattern detection: arrays with rating + comment fields → cards with star ratings
- [x] **ARR-06**: Timeline detection: arrays with date/timestamp progression → timeline view

### Field Importance & Hierarchy

- [x] **IMP-01**: Primary fields (name, title, headline) detected and rendered larger/bolder
- [x] **IMP-02**: Secondary fields (description, content) rendered at normal weight
- [x] **IMP-03**: Metadata fields (IDs, timestamps, internal fields) de-emphasized with smaller/muted styling
- [x] **IMP-04**: Importance scoring algorithm combines: name pattern (40%), visual richness (25%), data presence (20%), position (15%)
- [x] **IMP-05**: Detail views apply visual hierarchy (primary/secondary/tertiary styling)

### Auto-Grouping & Organization

- [x] **GRP-01**: Prefix-based grouping detects common prefixes (billing*, shipping*, contact*) and creates sections
- [x] **GRP-02**: Sections use vertical accordions (not horizontal tabs) per UX research
- [x] **GRP-03**: "Show all (ungrouped)" escape hatch always available
- [x] **GRP-04**: Semantic clustering groups related fields (email + phone + address → "Contact") even without shared prefix
- [x] **GRP-05**: Detail views use Hero + Overview + Sections layout pattern
- [x] **GRP-06**: Maximum two-level grouping to prevent over-nesting

### Context-Aware Components

- [x] **CTX-01**: Status/state fields render as colored badges
- [x] **CTX-02**: Tags/categories arrays render as tag chips (pill-shaped labels)
- [x] **CTX-03**: Rating fields render as star rating display
- [x] **CTX-04**: Price fields render with currency formatting (Intl.NumberFormat)
- [x] **CTX-05**: Date fields render as formatted display with localization (absolute only per user decision)

### Integration & Safety

- [x] **INT-01**: Smart defaults integrate with existing DynamicRenderer without breaking current behavior
- [x] **INT-02**: Feature flag allows gradual rollout and kill switch
- [x] **INT-03**: v1.2 configurations preserved during upgrade (config versioning/migration)
- [x] **INT-04**: Analysis runs once per API response, cached in appStore (performance <100ms overhead)
- [x] **INT-05**: Component switcher (v1.1) continues to work for user overrides

## Future Requirements (v1.4+)

### Smart Tabs
- **TAB-01**: Automatic tab generation based on semantic categories
- **TAB-02**: Tab content balancing (no tab with <3 fields)

### ML-Enhanced Detection
- **ML-01**: Machine learning for edge cases where heuristics fail
- **ML-02**: Learning from user override patterns

### Extended Patterns
- **EXT-01**: Date range pairing (startDate + endDate → range picker)
- **EXT-02**: Custom pattern library (user-defined field patterns)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Horizontal tabs for organization | UX research shows 27% overlooked vs 8% for accordions |
| ML/NLP libraries for detection | Overkill for well-defined problem, zero-dependency heuristics sufficient |
| User pattern customization | Adds complexity, defer to v1.4 |
| Smart defaults for top-level views | Focus on detail views first, extend later |
| Write operation intelligence | v1.x remains read-only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEM-01 | Phase 12 | Complete |
| SEM-02 | Phase 12 | Complete |
| SEM-03 | Phase 12 | Complete |
| SEM-04 | Phase 12 | Complete |
| SEM-05 | Phase 13 | Complete |
| ARR-01 | Phase 14 | Complete |
| ARR-02 | Phase 14 | Complete |
| ARR-03 | Phase 14 | Complete |
| ARR-04 | Phase 14 | Complete |
| ARR-05 | Phase 14 | Complete |
| ARR-06 | Phase 14 | Complete |
| IMP-01 | Phase 13 | Complete |
| IMP-02 | Phase 13 | Complete |
| IMP-03 | Phase 13 | Complete |
| IMP-04 | Phase 13 | Complete |
| IMP-05 | Phase 15 | Complete |
| GRP-01 | Phase 13 | Complete |
| GRP-02 | Phase 15 | Complete |
| GRP-03 | Phase 15 | Complete |
| GRP-04 | Phase 13 | Complete |
| GRP-05 | Phase 15 | Complete |
| GRP-06 | Phase 15 | Complete |
| CTX-01 | Phase 16 | Complete |
| CTX-02 | Phase 16 | Complete |
| CTX-03 | Phase 16 | Complete |
| CTX-04 | Phase 16 | Complete |
| CTX-05 | Phase 16 | Complete |
| INT-01 | Phase 14 | Complete |
| INT-02 | Phase 13 | Complete |
| INT-03 | Phase 13 | Complete |
| INT-04 | Phase 13 | Complete |
| INT-05 | Phase 14 | Complete |

**Coverage:**
- v1.3 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-09 after Phase 16 completion — all 28 requirements complete*
