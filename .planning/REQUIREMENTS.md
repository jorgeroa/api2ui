# Requirements: api2ui v1.3

**Defined:** 2026-02-07
**Core Value:** Any API becomes instantly usable through a visual interface — paste a URL, see your data rendered as a real UI.

## v1.3 Requirements

### Semantic Detection

- [x] **SEM-01**: Engine detects 20-30 common field name patterns (reviews, images, price, rating, status, tags, specifications, etc.)
- [x] **SEM-02**: Multi-signal detection requires name + type + values to agree for HIGH confidence classification
- [x] **SEM-03**: OpenAPI hints (description, format, title) inform semantic classification when available
- [x] **SEM-04**: Confidence scoring determines when to apply smart defaults vs fall back to type-based defaults
- [ ] **SEM-05**: User overrides always take precedence over smart defaults (explicit beats implicit)

### Array Rendering Intelligence

- [ ] **ARR-01**: Arrays with review/comment semantics default to card layout instead of table
- [ ] **ARR-02**: Arrays with specification/attribute semantics default to key-value pairs
- [ ] **ARR-03**: Arrays of image URLs default to gallery/grid view
- [ ] **ARR-04**: Table vs cards heuristic: <8 fields + rich content → cards; 10+ fields → table
- [ ] **ARR-05**: Rating pattern detection: arrays with rating + comment fields → cards with star ratings
- [ ] **ARR-06**: Timeline detection: arrays with date/timestamp progression → timeline view

### Field Importance & Hierarchy

- [ ] **IMP-01**: Primary fields (name, title, headline) detected and rendered larger/bolder
- [ ] **IMP-02**: Secondary fields (description, content) rendered at normal weight
- [ ] **IMP-03**: Metadata fields (IDs, timestamps, internal fields) de-emphasized with smaller/muted styling
- [ ] **IMP-04**: Importance scoring algorithm combines: name pattern (40%), visual richness (25%), data presence (20%), position (15%)
- [ ] **IMP-05**: Detail views apply visual hierarchy (primary/secondary/tertiary styling)

### Auto-Grouping & Organization

- [ ] **GRP-01**: Prefix-based grouping detects common prefixes (billing*, shipping*, contact*) and creates sections
- [ ] **GRP-02**: Sections use vertical accordions (not horizontal tabs) per UX research
- [ ] **GRP-03**: "Show all (ungrouped)" escape hatch always available
- [ ] **GRP-04**: Semantic clustering groups related fields (email + phone + address → "Contact") even without shared prefix
- [ ] **GRP-05**: Detail views use Hero + Overview + Sections layout pattern
- [ ] **GRP-06**: Maximum two-level grouping to prevent over-nesting

### Context-Aware Components

- [ ] **CTX-01**: Status/state fields render as colored badges
- [ ] **CTX-02**: Tags/categories arrays render as tag chips (pill-shaped labels)
- [ ] **CTX-03**: Rating fields render as star rating display
- [ ] **CTX-04**: Price fields render with currency formatting (Intl.NumberFormat)
- [ ] **CTX-05**: Date fields render as relative or formatted display ("2 days ago" or localized date)

### Integration & Safety

- [ ] **INT-01**: Smart defaults integrate with existing DynamicRenderer without breaking current behavior
- [ ] **INT-02**: Feature flag allows gradual rollout and kill switch
- [ ] **INT-03**: v1.2 configurations preserved during upgrade (config versioning/migration)
- [ ] **INT-04**: Analysis runs once per API response, cached in appStore (performance <100ms overhead)
- [ ] **INT-05**: Component switcher (v1.1) continues to work for user overrides

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
| SEM-05 | Phase 13 | Pending |
| ARR-01 | Phase 14 | Pending |
| ARR-02 | Phase 14 | Pending |
| ARR-03 | Phase 14 | Pending |
| ARR-04 | Phase 14 | Pending |
| ARR-05 | Phase 14 | Pending |
| ARR-06 | Phase 14 | Pending |
| IMP-01 | Phase 13 | Pending |
| IMP-02 | Phase 13 | Pending |
| IMP-03 | Phase 13 | Pending |
| IMP-04 | Phase 13 | Pending |
| IMP-05 | Phase 15 | Pending |
| GRP-01 | Phase 13 | Pending |
| GRP-02 | Phase 15 | Pending |
| GRP-03 | Phase 15 | Pending |
| GRP-04 | Phase 13 | Pending |
| GRP-05 | Phase 15 | Pending |
| GRP-06 | Phase 15 | Pending |
| CTX-01 | Phase 16 | Pending |
| CTX-02 | Phase 16 | Pending |
| CTX-03 | Phase 16 | Pending |
| CTX-04 | Phase 16 | Pending |
| CTX-05 | Phase 16 | Pending |
| INT-01 | Phase 14 | Pending |
| INT-02 | Phase 13 | Pending |
| INT-03 | Phase 13 | Pending |
| INT-04 | Phase 13 | Pending |
| INT-05 | Phase 14 | Pending |

**Coverage:**
- v1.3 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-07 after Phase 12 completion*
