# Architecture Patterns: Smart Default Selection

**Domain:** Semantic component selection for data-to-UI rendering
**Researched:** 2026-02-07
**Confidence:** HIGH

## Executive Summary

This research addresses how semantic component selection should integrate with api2ui's existing rendering pipeline. The core architectural challenge is **where** and **when** to perform field classification while preserving user overrides and maintaining clean separation of concerns.

**Key finding:** Analysis belongs **before render**, in a preprocessing layer that transforms schema + data into enriched metadata. DynamicRenderer consumes this metadata to make smarter default selections, while configStore continues to hold user overrides that take precedence.

**Recommended approach:** Data transformation pipeline architecture with cached analysis results stored alongside schema in appStore.

## Current Architecture Analysis

### Existing Rendering Pipeline

```
API Response → Schema Inference → DynamicRenderer → Component Selection → Render
                    ↓                    ↓                    ↓
                appStore            configStore         ComponentRegistry
                                   (user overrides)
```

**Current flow (DynamicRenderer.tsx:24-30):**
```typescript
function getDefaultTypeName(schema: TypeSignature): string {
  if (schema.kind === 'array' && schema.items.kind === 'object') return 'table'
  if (schema.kind === 'array' && schema.items.kind === 'primitive') return 'primitive-list'
  if (schema.kind === 'object') return 'detail'
  if (schema.kind === 'primitive') return 'primitive'
  return 'json'
}
```

This is **structural** selection (based on schema shape). Smart defaults need **semantic** selection (based on field names, data patterns, content).

### Integration Points

| Component | Current Role | Integration Point for Smart Defaults |
|-----------|--------------|-------------------------------------|
| `appStore.ts` | Holds `data` + `schema` | Add `analysisMetadata` field |
| `DynamicRenderer.tsx` | Selects component via `getDefaultTypeName()` | Replace with `getSmartDefaultTypeName()` that reads metadata |
| `configStore.ts` | Holds user overrides in `fieldConfigs` | Unchanged - continues to override defaults |
| `ComponentRegistry.tsx` | Maps type names to components | Unchanged - registry stays same |
| `DetailRenderer.tsx` | Already groups fields (primary/metadata/images/nested) | Consume analysis metadata for grouping decisions |

### Current Field Classification

DetailRenderer (lines 14-27) already implements **basic** semantic classification:

```typescript
function isPrimaryField(fieldName: string): boolean {
  const nameLower = fieldName.toLowerCase()
  const primaryExact = ['name', 'title', 'label', 'heading', 'subject']
  if (primaryExact.includes(nameLower)) return true
  const primarySuffixes = ['_name', '_title', '_label', '-name', '-title', '-label', 'Name', 'Title']
  return primarySuffixes.some(suffix => fieldName.endsWith(suffix))
}

function isMetadataField(fieldName: string): boolean {
  return /created|updated|modified|timestamp|date/i.test(fieldName)
}
```

And `imageDetection.ts` implements URL pattern matching:

```typescript
export function isImageUrl(value: unknown): boolean {
  if (!value || typeof value !== 'string' || !/^https?:\/\//i.test(value)) {
    return false
  }
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
  const url = new URL(value)
  const pathname = url.pathname.toLowerCase()
  return imageExtensions.some(ext => pathname.endsWith(ext))
}
```

**Gap:** These classifications are **local** (per-component) and **runtime** (executed during render). Smart defaults need **global** (cross-field relationships) and **cached** (execute once per schema).

## Recommended Architecture

### Data Transformation Pipeline

```
API Response → Schema Inference → Field Analysis → Enriched Schema → DynamicRenderer
                                        ↓
                               AnalysisMetadata
                               (cached in appStore)
```

**New architecture flow:**

1. **Schema Inference** (existing): `inferSchema()` creates TypeSignature
2. **Field Analysis** (new): `analyzeFields()` creates AnalysisMetadata
3. **Enriched Schema** (new): appStore holds both schema + metadata
4. **Smart Selection** (modified): DynamicRenderer reads metadata for defaults
5. **User Override** (existing): configStore continues to override any default

### Component Structure

```
src/
├── services/
│   └── analysis/
│       ├── fieldAnalyzer.ts          # Main analysis orchestrator
│       ├── fieldClassifier.ts        # Pattern matching for field types
│       ├── groupingAnalyzer.ts       # Tab/section detection
│       └── componentSuggester.ts     # Map classifications to components
├── store/
│   └── appStore.ts                   # Add analysisMetadata field
├── components/
│   └── DynamicRenderer.tsx           # Read metadata for smart defaults
└── utils/
    ├── imageDetection.ts             # Existing - keep for validation
    └── fieldPatterns.ts              # NEW - shared pattern constants
```

### New Services/Utilities Needed

#### 1. `fieldAnalyzer.ts` - Analysis Orchestrator

**Responsibility:** Coordinate field classification and grouping analysis.

```typescript
import type { TypeSignature, FieldDefinition } from '../types/schema'
import type { AnalysisMetadata } from '../types/analysis'

export function analyzeFields(
  schema: TypeSignature,
  data: unknown,
  path: string = '$'
): AnalysisMetadata {
  const classifier = new FieldClassifier()
  const groupingAnalyzer = new GroupingAnalyzer()
  const suggester = new ComponentSuggester()

  // Classify fields based on names and values
  const classifications = classifier.classify(schema, data, path)

  // Detect grouping opportunities (tabs, sections)
  const groupings = groupingAnalyzer.analyze(classifications)

  // Suggest component types based on classifications
  const suggestions = suggester.suggest(classifications, groupings)

  return {
    path,
    classifications,
    groupings,
    suggestions,
    analyzedAt: Date.now(),
  }
}
```

**When to call:** After `fetchSuccess()` in pipeline, before storing in appStore.

**Confidence:** HIGH - This is a standard data transformation pattern in frontend architectures.

#### 2. `fieldClassifier.ts` - Pattern Matching

**Responsibility:** Classify fields into semantic categories.

```typescript
export type FieldCategory =
  | 'primary'      // name, title (hero fields)
  | 'description'  // long text content
  | 'review'       // reviews, comments, feedback
  | 'rating'       // stars, scores, ratings
  | 'image'        // image URLs
  | 'price'        // currency, cost
  | 'spec'         // key-value attributes (color, size, weight)
  | 'metadata'     // timestamps, IDs, system fields
  | 'nested-collection' // arrays of objects
  | 'regular'      // default category

export interface FieldClassification {
  fieldPath: string
  fieldName: string
  category: FieldCategory
  confidence: 'high' | 'medium' | 'low'
  reason: string  // Why this classification was chosen
}

export class FieldClassifier {
  classify(schema: TypeSignature, data: unknown, path: string): FieldClassification[] {
    // Pattern matching based on field names, data patterns, content
    // Similar to existing isPrimaryField/isMetadataField but comprehensive
  }
}
```

**Pattern library:**

| Category | Field Name Patterns | Data Patterns | Example Fields |
|----------|-------------------|---------------|----------------|
| `primary` | `name`, `title`, `label`, `heading`, `subject`, `*_name`, `*_title` | String, 10-100 chars | `product_name`, `title` |
| `description` | `description`, `summary`, `body`, `content`, `details`, `about`, `bio` | String, >100 chars | `description`, `long_description` |
| `review` | `review`, `comment`, `feedback`, `testimonial`, `opinion`, `*_review` | String or object with text field | `customer_reviews`, `comments` |
| `rating` | `rating`, `score`, `stars`, `rank`, `*_rating`, `*_score` | Number 0-5 or 0-100 | `rating`, `average_rating` |
| `image` | `image`, `photo`, `picture`, `thumbnail`, `avatar`, `icon`, `*_url`, `*_image` | URL string ending in image extension | `image_url`, `thumbnail` |
| `price` | `price`, `cost`, `amount`, `fee`, `rate`, `*_price`, `*_cost` | Number, often with currency | `price`, `unit_price` |
| `spec` | `specs`, `specifications`, `attributes`, `properties`, `features` | Object with short key-value pairs | `specifications`, `attributes` |
| `metadata` | `id`, `*_id`, `created`, `updated`, `modified`, `timestamp`, `date`, `status` | System-generated values | `created_at`, `id`, `status` |
| `nested-collection` | `reviews`, `images`, `items`, `products`, `users`, `comments` | Array of objects | `reviews`, `related_products` |

**Source:** Pattern library synthesized from research on [metadata filtering best practices](https://lakefs.io/blog/metadata-filtering/) and [classification patterns](https://bigid.com/blog/smarter-classification-for-data-attributes-metadata-and-files/).

**Confidence:** HIGH - These patterns are well-established in data classification systems.

#### 3. `groupingAnalyzer.ts` - Tab/Section Detection

**Responsibility:** Detect when fields should be grouped into tabs or sections.

```typescript
export type GroupingStrategy =
  | 'tabs'         // Complex objects with 3+ logical groups
  | 'sections'     // Moderate objects with 2-3 groups
  | 'flat'         // Simple objects, no grouping needed

export interface FieldGrouping {
  strategy: GroupingStrategy
  groups: Array<{
    id: string
    label: string
    fieldPaths: string[]
    priority: number  // Display order
  }>
}

export class GroupingAnalyzer {
  analyze(classifications: FieldClassification[]): FieldGrouping {
    // Detect natural groupings based on field categories
    // Example: reviews + ratings = "Reviews" tab
    //          specs + attributes = "Specifications" tab
    //          images = "Gallery" tab
  }
}
```

**Grouping heuristics:**

| Condition | Strategy | Example Groups |
|-----------|----------|----------------|
| 5+ categories present, 3+ with 2+ fields | `tabs` | "Overview", "Reviews", "Specifications", "Gallery" |
| 3-4 categories present | `sections` | "Details", "Metadata" |
| <3 categories | `flat` | No grouping |
| Nested collections present | `sections` | Each collection becomes a section |

**Tab creation triggers:**

- **Reviews tab:** 2+ fields in `review` or `rating` categories
- **Specifications tab:** 3+ fields in `spec` category
- **Gallery tab:** 3+ fields in `image` category
- **About/Overview tab:** Default group for `primary`, `description`, `regular`

**Source:** Based on [nested tab UI patterns](https://www.designmonks.co/blog/nested-tab-ui) and [semantic UI component grouping research](https://arxiv.org/html/2403.04984v1).

**Confidence:** MEDIUM - Heuristics require tuning based on real data patterns.

#### 4. `componentSuggester.ts` - Map to Components

**Responsibility:** Suggest component types based on classifications.

```typescript
export interface ComponentSuggestion {
  fieldPath: string
  suggestedType: string  // Component type name from registry
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

export class ComponentSuggester {
  suggest(
    classifications: FieldClassification[],
    groupings: FieldGrouping
  ): ComponentSuggestion[] {
    // Map field categories to component types
  }
}
```

**Mapping rules:**

| Field Category | Schema Kind | Suggested Component | Rationale |
|----------------|-------------|---------------------|-----------|
| `review` + `rating` | `array<object>` | `card-list` | Reviews need visual separation, rich content |
| `nested-collection` | `array<object>` | `card-list` | Better for heterogeneous or text-heavy items |
| `regular` | `array<object>` | `table` | Default for homogeneous data |
| `image` | `array<string>` | `gallery` | Image URLs best displayed as gallery |
| `spec` | `object` | `detail` (with key-value layout) | Specifications are key-value pairs |
| `primary` + `description` + `image` | `object` | `hero` | Product-like objects get hero layout |
| `regular` | `object` | `detail` | Default for objects |
| `metadata` | `object` fields | Hidden by default or footer section | De-emphasize system fields |

**Confidence:** HIGH - Mappings are derived from existing component patterns in api2ui.

### Data Flow Changes

#### Before (Current)

```typescript
// In pipeline service
const schema = inferSchema(data)
appStore.fetchSuccess(data, schema)

// In DynamicRenderer
const defaultType = getDefaultTypeName(schema)  // Structural selection
const override = fieldConfigs[path]?.componentType
const Component = getComponent(schema, override || defaultType)
```

#### After (Smart Defaults)

```typescript
// In pipeline service
const schema = inferSchema(data)
const analysisMetadata = analyzeFields(schema, data)  // NEW
appStore.fetchSuccess(data, schema, analysisMetadata)  // MODIFIED

// In DynamicRenderer
const metadata = appStore.analysisMetadata  // NEW
const defaultType = getSmartDefaultTypeName(schema, path, metadata)  // MODIFIED
const override = fieldConfigs[path]?.componentType
const Component = getComponent(schema, override || defaultType)  // Unchanged
```

**Key principle:** User overrides (`fieldConfigs`) **always** take precedence over smart defaults.

## Preserving User Overrides

### Architecture Pattern: Explicit Over Implicit

```
Priority hierarchy:
1. User explicit override (fieldConfigs[path].componentType) → HIGHEST
2. Smart default (analysisMetadata suggestions)              → MEDIUM
3. Structural default (getDefaultTypeName)                   → LOWEST
```

**Implementation strategy:**

```typescript
function getSmartDefaultTypeName(
  schema: TypeSignature,
  path: string,
  metadata: AnalysisMetadata | null
): string {
  // 1. Check if smart analysis has a suggestion
  if (metadata) {
    const suggestion = metadata.suggestions.find(s => s.fieldPath === path)
    if (suggestion && suggestion.confidence !== 'low') {
      return suggestion.suggestedType
    }
  }

  // 2. Fall back to structural default
  return getDefaultTypeName(schema)
}
```

**User override preservation:**

```typescript
// In DynamicRenderer (no change needed)
const override = fieldConfigs[path]?.componentType
const Component = getComponent(schema, override || defaultType)
```

The override check **already exists** and runs **before** defaults are used. No modification needed to preserve overrides.

**When defaults change:**

| Scenario | Current Behavior | Smart Defaults Behavior |
|----------|------------------|------------------------|
| User has override set | Override used, default ignored | Override used, smart default ignored |
| User has no override | Structural default used | Smart default used |
| Schema changes | Structural default recalculated | Smart default recalculated |
| User clears override | Returns to structural default | Returns to smart default |

**Source:** Based on [CSS inheritance and override patterns](https://thelinuxcode.com/applying-inheritance-in-css-2026-predictable-styling-theming-and-safe-overrides/) and [Android ViewModel state preservation](https://developer.android.com/guide/topics/resources/runtime-changes).

**Confidence:** HIGH - Override pattern already exists and works correctly.

## Caching Analysis Results

### Storage Location: appStore

```typescript
// src/store/appStore.ts
interface AppState {
  // Existing fields
  data: unknown
  schema: UnifiedSchema | null

  // NEW
  analysisMetadata: AnalysisMetadata | null

  // Actions
  fetchSuccess: (data: unknown, schema: UnifiedSchema, metadata: AnalysisMetadata) => void
}
```

**Why appStore:** Analysis metadata is **derived from schema + data**, not user configuration. It belongs with the data it describes, not with user preferences.

### Cache Invalidation Strategy

```typescript
// Analysis results are valid until:
// 1. New API response fetched (different data)
// 2. User manually triggers re-analysis
// 3. Schema structure changes (different endpoint)

// In appStore
startFetch: () => set({
  loading: true,
  error: null,
  data: null,
  schema: null,
  analysisMetadata: null  // Invalidate on new fetch
})
```

**Caching benefits:**

- **Performance:** Analysis runs once per response, not on every render
- **Consistency:** Same analysis results across all components
- **Debugging:** Analysis metadata visible in state for inspection

**Source:** Caching strategy follows [React memoization best practices](https://www.toptal.com/react/react-memoization) and [frontend data transformation pipeline patterns](https://dev.to/jajibhee/solving-frontend-performance-the-data-pipeline-transformation-2206).

**Confidence:** HIGH - Standard caching pattern for derived data.

### Memoization Within Analysis

```typescript
// In fieldAnalyzer.ts
import { useMemo } from 'react'

// For expensive pattern matching
const FIELD_PATTERNS = {
  primary: /^(name|title|label|heading|subject)$/i,
  metadata: /^(id|.*_id|created|updated|modified|timestamp|date|status)$/i,
  // ... more patterns
}

// Compile once, reuse for all fields
export class FieldClassifier {
  private patterns: Map<FieldCategory, RegExp>

  constructor() {
    this.patterns = new Map()
    for (const [category, pattern] of Object.entries(FIELD_PATTERNS)) {
      this.patterns.set(category as FieldCategory, pattern)
    }
  }

  classify(schema: TypeSignature, data: unknown, path: string): FieldClassification[] {
    // Use pre-compiled patterns for matching
  }
}
```

**Memoization targets:**

1. **Pattern compilation:** Compile regexes once at initialization
2. **Classification results:** Cache per field path
3. **Grouping analysis:** Cache per object path

**Source:** [React 19 compiler optimizations](https://dev.co/react/memoization) show that manual memoization is less critical with new compiler, but still beneficial for expensive non-React computations.

**Confidence:** HIGH - Standard optimization for expensive operations.

## Integration with Existing Components

### DynamicRenderer.tsx Modifications

**Current (lines 24-44):**

```typescript
function getDefaultTypeName(schema: TypeSignature): string {
  if (schema.kind === 'array' && schema.items.kind === 'object') return 'table'
  // ... structural selection only
}

function getAvailableTypes(schema: TypeSignature): string[] {
  if (schema.kind === 'array' && schema.items.kind === 'object') {
    return ['table', 'card-list', 'list', 'gallery', 'timeline', 'stats', 'json']
  }
  // ... all available types
}
```

**After (smart defaults):**

```typescript
function getSmartDefaultTypeName(
  schema: TypeSignature,
  path: string,
  metadata: AnalysisMetadata | null
): string {
  // Try smart analysis first
  if (metadata) {
    const suggestion = metadata.suggestions.find(s => s.fieldPath === path)
    if (suggestion && suggestion.confidence !== 'low') {
      return suggestion.suggestedType
    }
  }

  // Fall back to structural default
  return getDefaultTypeName(schema)
}

// getAvailableTypes() unchanged - all components remain available
```

**Changes needed:**

1. Import `analysisMetadata` from appStore
2. Replace `getDefaultTypeName()` calls with `getSmartDefaultTypeName()`
3. Pass `path` and `metadata` to new function

**Lines affected:** ~5 lines modified, ~15 lines added

**Risk:** LOW - Only changes default selection, doesn't affect override mechanism

### DetailRenderer.tsx Modifications

**Current (lines 149-180):**

```typescript
// View mode: manual field grouping
const primaryFields: Array<[string, FieldDefinition]> = []
const regularFields: Array<[string, FieldDefinition]> = []
const imageFields: Array<[string, FieldDefinition]> = []
const metaFields: Array<[string, FieldDefinition]> = []
const nestedFields: Array<[string, FieldDefinition]> = []

for (const field of visibleFields) {
  const [fieldName, fieldDef] = field

  if (isPrimaryField(fieldName)) {
    primaryFields.push(field)
  } else if (isMetadataField(fieldName)) {
    metaFields.push(field)
  }
  // ... manual classification
}
```

**After (smart grouping):**

```typescript
// View mode: use analysis metadata for grouping
const metadata = appStore.analysisMetadata
const grouping = metadata?.groupings

if (grouping?.strategy === 'tabs') {
  // Render TabsRenderer with groups
  return <TabsRenderer groups={grouping.groups} data={data} schema={schema} />
}

if (grouping?.strategy === 'sections') {
  // Render with section headers
  return renderSections(grouping.groups, data, schema)
}

// Fall back to existing flat layout
const { primaryFields, regularFields, imageFields, metaFields, nestedFields }
  = groupFieldsByMetadata(visibleFields, metadata)
```

**Changes needed:**

1. Import `analysisMetadata` from appStore
2. Check for `tabs` or `sections` strategy
3. Conditionally render TabsRenderer (NEW component) or SplitRenderer (existing)
4. Fall back to existing flat layout if no grouping

**Lines affected:** ~30 lines modified, ~50 lines added (TabsRenderer)

**Risk:** MEDIUM - Significant behavior change, needs careful testing

### appStore.ts Modifications

**Current (lines 14-15, 47):**

```typescript
interface AppState {
  data: unknown
  schema: UnifiedSchema | null

  fetchSuccess: (data: unknown, schema: UnifiedSchema) => void
}
```

**After:**

```typescript
import type { AnalysisMetadata } from '../types/analysis'

interface AppState {
  data: unknown
  schema: UnifiedSchema | null
  analysisMetadata: AnalysisMetadata | null  // NEW

  fetchSuccess: (
    data: unknown,
    schema: UnifiedSchema,
    metadata: AnalysisMetadata  // NEW parameter
  ) => void
}

// In implementation
fetchSuccess: (data, schema, metadata) => set({
  loading: false,
  data,
  schema,
  analysisMetadata: metadata,  // Store metadata
  error: null
})
```

**Changes needed:**

1. Add `analysisMetadata` field to state
2. Add `metadata` parameter to `fetchSuccess()`
3. Clear metadata on `startFetch()` and `reset()`

**Lines affected:** ~5 lines modified

**Risk:** LOW - Additive change, doesn't break existing code

### Pipeline Service Modifications

**Current (approximate, based on fetchSuccess call pattern):**

```typescript
// In some pipeline service or component
const response = await fetch(url)
const data = await response.json()
const schema = inferSchema(data)
appStore.fetchSuccess(data, schema)
```

**After:**

```typescript
import { analyzeFields } from '../services/analysis/fieldAnalyzer'

const response = await fetch(url)
const data = await response.json()
const schema = inferSchema(data)
const metadata = analyzeFields(schema.rootType, data)  // NEW
appStore.fetchSuccess(data, schema, metadata)  // MODIFIED
```

**Changes needed:**

1. Import `analyzeFields()`
2. Call `analyzeFields()` after schema inference
3. Pass metadata to `fetchSuccess()`

**Lines affected:** ~3 lines added per pipeline entry point

**Risk:** LOW - Analysis runs after schema inference, doesn't affect existing flow

## Component Modification vs New Component Creation

### Modified Components

| Component | Type | Changes | Risk | Lines Changed |
|-----------|------|---------|------|---------------|
| `appStore.ts` | MODIFY | Add `analysisMetadata` field | LOW | ~5 |
| `DynamicRenderer.tsx` | MODIFY | Use smart defaults | LOW | ~20 |
| `DetailRenderer.tsx` | MODIFY | Use metadata for grouping | MEDIUM | ~30 |
| Pipeline services | MODIFY | Call `analyzeFields()` | LOW | ~3 each |

### New Components

| Component | Type | Purpose | Complexity | Lines (est.) |
|-----------|------|---------|------------|--------------|
| `fieldAnalyzer.ts` | NEW | Analysis orchestrator | LOW | ~50 |
| `fieldClassifier.ts` | NEW | Pattern matching | MEDIUM | ~150 |
| `groupingAnalyzer.ts` | NEW | Tab/section detection | MEDIUM | ~100 |
| `componentSuggester.ts` | NEW | Component mapping | LOW | ~80 |
| `fieldPatterns.ts` | NEW | Shared pattern constants | LOW | ~30 |
| `analysis.ts` (types) | NEW | TypeScript types | LOW | ~50 |

**Total new code:** ~460 lines (analysis layer)
**Total modified code:** ~60 lines (integration)

**Build order rationale:** New analysis layer is **independent** from modifications. Can be built and tested in isolation before integration.

## Build Order

### Phase 1: Analysis Layer (Independent)

Build new services without touching existing components. Test in isolation.

**Tasks:**

1. Create `src/types/analysis.ts` with type definitions
2. Create `src/utils/fieldPatterns.ts` with pattern constants
3. Create `src/services/analysis/fieldClassifier.ts`
4. Create `src/services/analysis/groupingAnalyzer.ts`
5. Create `src/services/analysis/componentSuggester.ts`
6. Create `src/services/analysis/fieldAnalyzer.ts` (orchestrator)

**Testing:** Unit tests for each classifier, mock schema + data

**Deliverable:** Working `analyzeFields()` function with comprehensive tests

**Dependencies:** None - pure functions operating on schema + data

### Phase 2: Storage Integration (Low Risk)

Add metadata storage without using it.

**Tasks:**

1. Modify `appStore.ts` to add `analysisMetadata` field
2. Modify pipeline services to call `analyzeFields()` and store result
3. Verify metadata appears in state (React DevTools inspection)

**Testing:** Integration test that metadata is populated correctly

**Deliverable:** Metadata stored in appStore, visible but unused

**Dependencies:** Phase 1 complete

### Phase 3: Smart Default Selection (Medium Risk)

Use metadata for component selection, preserve overrides.

**Tasks:**

1. Modify `DynamicRenderer.tsx` to use `getSmartDefaultTypeName()`
2. Test that smart defaults work
3. Test that user overrides still work
4. Test fallback to structural defaults when metadata missing

**Testing:** E2E tests with various API responses

**Deliverable:** Smart component selection working, overrides preserved

**Dependencies:** Phase 2 complete

### Phase 4: Smart Grouping (High Risk)

Use metadata for tab/section organization in DetailRenderer.

**Tasks:**

1. Create `TabsRenderer.tsx` if using tabs strategy
2. Modify `DetailRenderer.tsx` to check grouping strategy
3. Conditionally render tabs/sections based on metadata
4. Fall back to flat layout when no grouping

**Testing:** E2E tests with complex objects

**Deliverable:** Automatic tab/section organization working

**Dependencies:** Phase 3 complete

**Risk mitigation:** Start with `sections` strategy (simpler) before `tabs` strategy.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Analysis During Render

**What goes wrong:** Calling `analyzeFields()` inside DynamicRenderer causes analysis to run on every render, killing performance.

**Why it happens:** Temptation to keep analysis "close" to where it's used.

**Prevention:** Analysis must happen **once per response** in pipeline, **before** components render. Store result in appStore.

**Detection:** Check React DevTools profiler for expensive computations in DynamicRenderer.

### Anti-Pattern 2: Overriding User Overrides

**What goes wrong:** Smart defaults accidentally overwrite explicit user choices.

**Why it happens:** Not checking configStore before applying smart defaults.

**Prevention:** Always check `fieldConfigs[path]?.componentType` **before** using smart defaults. If override exists, use it and ignore defaults entirely.

**Detection:** Manual test: Set override, trigger re-analysis, verify override persists.

### Anti-Pattern 3: Blocking Rendering on Analysis

**What goes wrong:** Waiting for analysis to complete before showing any UI.

**Why it happens:** Misunderstanding of when analysis happens.

**Prevention:** Analysis is synchronous and fast (<10ms for typical responses). Run immediately after schema inference, no async/await needed. If analysis fails, fall back to structural defaults.

**Detection:** Network throttling test - UI should appear instantly even with slow network.

### Anti-Pattern 4: Too-Specific Pattern Matching

**What goes wrong:** Classification patterns are brittle, break on slight variations.

**Example:** Pattern `/^reviews$/` matches "reviews" but not "Reviews", "customer_reviews", "product_reviews".

**Why it happens:** Insufficient testing with diverse field names.

**Prevention:** Use case-insensitive patterns with flexible matching. Test against diverse real-world APIs.

**Detection:** Test classification with field names from 10+ different APIs.

### Anti-Pattern 5: Analysis Without Fallbacks

**What goes wrong:** System breaks when analysis returns no suggestions.

**Why it happens:** Assuming analysis always succeeds.

**Prevention:** Every analysis function must return a valid result. If no pattern matches, return `category: 'regular'` and `confidence: 'low'`. Rendering code must handle missing metadata gracefully.

**Detection:** Test with unexpected data structures (empty objects, weird field names).

## Tab/Section Grouping Logic

### When to Create Tabs vs Sections

**Decision tree:**

```
Object with N field categories:

If N >= 5 AND 3+ categories have 2+ fields → tabs
Else if N >= 3 → sections
Else → flat (no grouping)

Special cases:
- If nested collections present → always sections (one per collection)
- If only 1-2 total fields → always flat
```

**Tab examples:**

```
Product object with:
- 2 primary fields (name, brand)
- 1 description
- 5 spec fields (color, size, weight, material, origin)
- 3 image URLs
- 8 reviews
- 2 rating fields (average_rating, rating_count)
- 3 metadata fields

Categories present: 7
Groups: "Overview" (primary + description), "Specifications" (specs), "Gallery" (images), "Reviews" (reviews + ratings), "Details" (metadata)

Result: tabs (5 groups)
```

**Section examples:**

```
User object with:
- 2 primary fields (name, email)
- 3 regular fields (phone, address, bio)
- 2 metadata fields (created_at, last_login)

Categories present: 3
Groups: "Profile" (primary + regular), "Metadata" (metadata)

Result: sections (2 groups)
```

**Flat examples:**

```
Simple object with:
- 1 primary field (name)
- 2 regular fields (value, status)

Categories present: 2
Result: flat (no grouping needed)
```

### Tab Priority Order

```
1. Overview (primary + description + regular)
2. Specifications (spec fields)
3. Reviews (review + rating fields)
4. Gallery (image fields)
5. Details/Metadata (metadata fields)
```

**Rationale:** Most important information first, system fields last.

### Section Headers

For `sections` strategy, render with visual separators:

```typescript
<div>
  <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
    {group.label}
  </h3>
  {/* Fields in this group */}
  <div className="border-t border-gray-200 mt-4" />
</div>
```

Follows existing pattern in DetailRenderer.tsx line 558.

## Field Importance Hierarchy

### Priority Levels

| Level | Categories | Display Treatment |
|-------|-----------|-------------------|
| Hero | `primary` + hero `image` | Large text, prominent position |
| Primary | `description`, `price`, `rating` | Normal emphasis, above fold |
| Secondary | `regular`, `spec`, `nested-collection` | Standard display |
| Tertiary | `metadata` | De-emphasized, small text, footer or hidden |

### Visual Hierarchy Rules

**Hero treatment:**
- Font: text-2xl font-bold
- Position: Top of object, before other fields
- Hero image: Full-width above text

**Primary treatment:**
- Font: text-lg font-semibold
- Position: First section/tab

**Secondary treatment:**
- Font: text-base
- Position: Main content area

**Tertiary treatment:**
- Font: text-sm text-gray-500
- Position: Footer section or hidden by default

Follows existing typography hierarchy in DetailRenderer.tsx lines 223-231.

## Architecture Diagrams

### Data Flow: Complete Pipeline

```
┌─────────────────┐
│  API Response   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Schema Inference│ (existing)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Field Analysis  │ (NEW)
│ - Classify      │
│ - Group         │
│ - Suggest       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   appStore      │
│ - data          │
│ - schema        │
│ - metadata ←NEW │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ DynamicRenderer │
│ - Read metadata │
│ - Smart default │
│ - Check override│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Component Render│
└─────────────────┘
```

### Component Dependencies

```
DynamicRenderer.tsx
    │
    ├─→ appStore (read metadata)
    ├─→ configStore (read overrides)
    ├─→ ComponentRegistry (get component)
    └─→ getSmartDefaultTypeName()
            │
            └─→ AnalysisMetadata (from appStore)

DetailRenderer.tsx
    │
    ├─→ appStore (read metadata for grouping)
    ├─→ configStore (read field configs)
    └─→ Conditionally:
        ├─→ TabsRenderer (if tabs strategy)
        ├─→ SectionRenderer (if sections strategy)
        └─→ Flat layout (if no grouping)

Pipeline Service
    │
    ├─→ inferSchema() (existing)
    ├─→ analyzeFields() (NEW)
    └─→ appStore.fetchSuccess()
```

### Analysis Layer Internal

```
analyzeFields()
    │
    ├─→ FieldClassifier.classify()
    │       │
    │       ├─→ fieldPatterns.ts (pattern matching)
    │       └─→ imageDetection.ts (URL validation)
    │
    ├─→ GroupingAnalyzer.analyze()
    │       │
    │       └─→ Detect tabs/sections from categories
    │
    └─→ ComponentSuggester.suggest()
            │
            └─→ Map categories → component types
```

## Performance Considerations

### Analysis Complexity

| Operation | Complexity | Example (100 fields) |
|-----------|-----------|---------------------|
| Pattern matching per field | O(1) | ~0.01ms per field |
| Classification all fields | O(n) | ~1ms total |
| Grouping analysis | O(n) | ~0.5ms total |
| Component suggestion | O(n) | ~0.5ms total |
| **Total analysis** | **O(n)** | **~2ms for 100 fields** |

**Worst case:** 1000-field response = ~20ms analysis time. Still fast enough for synchronous execution.

**Optimization:** If responses exceed 1000 fields regularly, add async analysis with loading state. For v1, synchronous is sufficient.

### Memory Usage

```
AnalysisMetadata size for 100 fields:
- 100 FieldClassification objects: ~10KB
- 1 FieldGrouping object: ~1KB
- 100 ComponentSuggestion objects: ~10KB
Total: ~21KB per analysis

For 10 recent responses cached: ~210KB
```

**Acceptable:** Modern browsers handle this easily. No special memory optimization needed.

### Cache Hit Rate

**Scenario:** User switches between endpoints in multi-endpoint API.

```
Without cache: Analyze on every endpoint switch (2ms each)
With cache: Analyze once per endpoint, reuse on return (0ms subsequent)

Expected hit rate: 60-80% for typical usage
Savings: 1-2ms per cached endpoint switch
```

**Trade-off:** 20KB memory per cached analysis vs 2ms saved per switch. Worth it.

## Migration Strategy

### Backwards Compatibility

**Guaranteed:** All existing functionality continues working.

**How:**

1. `getSmartDefaultTypeName()` **falls back** to `getDefaultTypeName()` if metadata missing
2. User overrides in configStore **always** take precedence
3. All existing components remain in ComponentRegistry
4. ViewModeBadge shows all available types, not just smart defaults

**Migration path:**

```
Phase 1: Ship with smart defaults OFF (feature flag)
Phase 2: Enable for new users, keep OFF for existing users
Phase 3: Enable for all users, allow opt-out in settings
Phase 4: On by default, remove feature flag
```

### Opt-Out Mechanism (Optional)

```typescript
// In configStore
interface ConfigStore {
  useSmartDefaults: boolean  // Toggle in settings
}

// In DynamicRenderer
const useSmartDefaults = configStore.useSmartDefaults
const defaultType = useSmartDefaults
  ? getSmartDefaultTypeName(schema, path, metadata)
  : getDefaultTypeName(schema)
```

**Recommendation:** Start with opt-out available, remove after validation period.

## Open Questions

### Question 1: Multi-Sample Analysis

**Problem:** Current schema inference uses multiple samples for confidence. Should field analysis also aggregate across samples?

**Example:** Array of 20 products - analyze first product or aggregate patterns across all 20?

**Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| Single sample (first item) | Fast, simple | May miss patterns |
| All samples | More accurate patterns | Slower, more complex |
| Hybrid (first 5 samples) | Balance of speed + accuracy | Arbitrary limit |

**Recommendation:** Start with **first sample** for simplicity. Add multi-sample in v1.4 if needed.

**Confidence:** MEDIUM - Needs validation with real-world data.

### Question 2: User Feedback Loop

**Problem:** Smart defaults may be wrong. How do users correct them?

**Current override mechanism:** User can switch component via ViewModeBadge. This implicitly overrides smart defaults.

**Open question:** Should we add explicit "Don't use this default again" feedback?

**Options:**

1. Implicit learning: Track user overrides, adjust confidence over time
2. Explicit feedback: "This default was wrong" button → adjusts patterns
3. No learning: User overrides are just preferences, no feedback loop

**Recommendation:** Start with **no learning** (option 3). Add feedback loop in v1.4 if user testing shows need.

**Confidence:** LOW - Requires user research to validate approach.

### Question 3: Cross-Field Relationships

**Problem:** Some classifications depend on relationships between fields.

**Example:** `review_text` + `review_rating` together = review, but alone they're just string + number.

**Current approach:** Each field classified independently.

**Alternative:** Detect field relationships and classify groups.

**Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| Independent fields | Simple, fast | Misses relationships |
| Relationship detection | More accurate | Complex, slower |

**Recommendation:** Start with **independent fields** plus simple suffix matching (`review_*` = review category). Add relationship detection in v1.4 if needed.

**Confidence:** MEDIUM - Simple suffix matching covers 80% of cases.

## Sources

Architecture patterns and best practices:

- [Semantic UI React component selection patterns](https://react.semantic-ui.com/)
- [CommonForms dataset for form field detection](https://arxiv.org/html/2509.16506v1)
- [Frontend architecture caching strategies](https://www.debugbear.com/blog/performant-front-end-architecture)
- [React memoization for expensive computations](https://www.toptal.com/react/react-memoization)
- [Data transformation pipeline architecture](https://dev.to/jajibhee/solving-frontend-performance-the-data-pipeline-transformation-2206)
- [Metadata filtering and classification patterns](https://lakefs.io/blog/metadata-filtering/)
- [BigID classification for data attributes](https://bigid.com/blog/smarter-classification-for-data-attributes-metadata-and-files/)
- [UI semantic component grouping research](https://arxiv.org/html/2403.04984v1)
- [Nested tab UI patterns](https://www.designmonks.co/blog/nested-tab-ui)
- [CSS inheritance and override patterns](https://thelinuxcode.com/applying-inheritance-in-css-2026-predictable-styling-theming-and-safe-overrides/)
- [Android state preservation patterns](https://developer.android.com/guide/topics/resources/runtime-changes)
- [React 19 optimization patterns](https://dev.co/react/memoization)

## Summary

**Core architectural decision:** Add a **data transformation layer** that runs between schema inference and rendering, producing enriched metadata that DynamicRenderer consumes for smart defaults.

**Key principles:**

1. **Analysis before render:** Field classification happens once per response, cached in appStore
2. **User overrides always win:** Existing override mechanism in configStore takes precedence over smart defaults
3. **Graceful degradation:** Smart defaults fall back to structural defaults when metadata missing or low confidence
4. **Independent layer:** Analysis services are pure functions, testable in isolation
5. **Additive changes:** Most integration is adding new code, not modifying existing behavior

**Build order:** Analysis layer first (independent), storage integration second (low risk), smart selection third (medium risk), smart grouping last (high risk).

**Confidence:** HIGH overall - Architecture patterns are well-established, integration points are clean, existing override mechanism provides safety net.
