# Phase 13: Field Importance & Grouping Analysis - Research

**Researched:** 2026-02-07
**Domain:** Field importance scoring, semantic grouping, configurable heuristics
**Confidence:** HIGH

## Summary

This phase builds an analysis layer that scores field importance (primary/secondary/tertiary) and detects logical groupings for better field organization. The research validates that the user-specified weighted scoring approach (name pattern 40%, visual richness 25%, data presence 20%, position 15%) aligns with standard weighted scoring methodologies used in feature prioritization and search relevance algorithms.

The phase extends the existing semantic detection system (Phase 12) with two new analysis modules: importance scoring and grouping detection. Both use zero-dependency heuristic algorithms following the established pattern from Phase 12 (multi-signal scoring with configurable weights and thresholds).

For grouping, the research confirms that a hybrid approach combining prefix matching (billing_*) with semantic clustering (email+phone+address) is the right pattern. The simplest effective algorithm is longest common prefix (LCP) detection for prefix groups, paired with semantic category matching from Phase 12 patterns for semantic clusters.

**Primary recommendation:** Build importance scorer and grouping detector as pure functions following Phase 12's scorer.ts pattern. Store all weights, thresholds, and rules in a TypeScript config object (not JSON/YAML) for type safety and easy modification.

## Standard Stack

This phase uses zero dependencies following the v0.3 architecture decision. All libraries are already in the project from Phase 12.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Type-safe configuration and analysis | Already used throughout project |
| Vitest | Latest | Unit testing for scoring algorithms | Existing test framework from Phase 12 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | Zero external dependencies | Follow Phase 12 pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom weighted scoring | ml5.js machine learning | ML would require training data, more complex, overkill for rule-based scoring |
| Custom prefix detection | figue.js clustering | Clustering library adds 50KB, unnecessary when simple LCP + semantic matching works |
| TypeScript config object | JSON/YAML config file | JSON loses type safety, YAML needs parser, TS config is simpler and safer |

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/services/
├── semantic/               # Phase 12 (existing)
│   ├── types.ts
│   ├── scorer.ts
│   ├── detector.ts
│   └── patterns/
└── analysis/               # Phase 13 (new)
    ├── types.ts           # ImportanceTier, GroupingResult, AnalysisConfig
    ├── config.ts          # All weights, thresholds, rules (configurable)
    ├── importance.ts      # Field importance scorer
    ├── grouping.ts        # Grouping detector (prefix + semantic)
    ├── index.ts           # Public API: analyzeFields(fields)
    ├── importance.test.ts
    └── grouping.test.ts
```

### Pattern 1: Weighted Scoring with Configurable Weights

**What:** Multi-signal scoring where each signal has a configurable weight, following Phase 12's pattern-based scoring

**When to use:** When combining multiple heuristics (name pattern, visual richness, data presence, position) into a single importance score

**Example:**
```typescript
// src/services/analysis/config.ts
export const IMPORTANCE_CONFIG = {
  weights: {
    namePattern: 0.40,      // User decision: locked
    visualRichness: 0.25,   // User decision: locked
    dataPresence: 0.20,     // User decision: locked
    position: 0.15,         // User decision: locked
  },
  tierThresholds: {
    primary: 0.80,          // User decision: >=80% is primary
    secondary: 0.50,        // User decision: 50-79% is secondary
    // <50% is tertiary
  },
  metadataPatterns: [
    /^id$/i,
    /^_/,                   // _prefixed internal fields
    /^[a-z]+_id$/i,         // foreign key IDs (user_id, post_id)
    /^(created|updated|deleted)_at$/i,  // internal timestamps
  ],
} as const

// src/services/analysis/importance.ts
export function calculateImportance(
  field: FieldInfo,
  config = IMPORTANCE_CONFIG
): ImportanceScore {
  let totalScore = 0
  const signals: SignalMatch[] = []

  // 1. Name pattern signal (40%)
  const nameScore = scoreNamePattern(field.name, field.semanticCategory)
  signals.push({
    name: 'namePattern',
    matched: nameScore > 0,
    weight: config.weights.namePattern,
    contribution: nameScore * config.weights.namePattern,
  })
  totalScore += nameScore * config.weights.namePattern

  // 2. Visual richness signal (25%)
  const visualScore = scoreVisualRichness(field.semanticCategory)
  signals.push({
    name: 'visualRichness',
    matched: visualScore > 0,
    weight: config.weights.visualRichness,
    contribution: visualScore * config.weights.visualRichness,
  })
  totalScore += visualScore * config.weights.visualRichness

  // 3. Data presence signal (20%)
  const presenceScore = scoreDataPresence(field.sampleValues)
  signals.push({
    name: 'dataPresence',
    matched: presenceScore > 0,
    weight: config.weights.dataPresence,
    contribution: presenceScore * config.weights.dataPresence,
  })
  totalScore += presenceScore * config.weights.dataPresence

  // 4. Position signal (15%)
  const positionScore = scorePosition(field.position, field.totalFields)
  signals.push({
    name: 'position',
    matched: positionScore > 0,
    weight: config.weights.position,
    contribution: positionScore * config.weights.position,
  })
  totalScore += positionScore * config.weights.position

  // Determine tier based on thresholds
  let tier: ImportanceTier
  if (totalScore >= config.tierThresholds.primary) {
    tier = 'primary'
  } else if (totalScore >= config.tierThresholds.secondary) {
    tier = 'secondary'
  } else {
    tier = 'tertiary'
  }

  // Force metadata fields to tertiary (user decision)
  if (isMetadataField(field.name, config.metadataPatterns)) {
    tier = 'tertiary'
  }

  return { tier, score: totalScore, signals }
}
```

### Pattern 2: Longest Common Prefix for Grouping

**What:** Detect common prefixes (billing_*, shipping_*) using longest common prefix algorithm

**When to use:** When fields share a naming convention with underscore or dot separators

**Example:**
```typescript
// src/services/analysis/grouping.ts
/**
 * Find longest common prefix among field names.
 * Used to detect prefix-based groups (billing_*, contact_*).
 */
function longestCommonPrefix(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return ''

  // Sort names to compare first and last (vertical scanning optimization)
  const sorted = [...names].sort()
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  let prefixLength = 0
  const minLength = Math.min(first.length, last.length)

  for (let i = 0; i < minLength; i++) {
    if (first[i] === last[i]) {
      prefixLength++
    } else {
      break
    }
  }

  // Extract prefix up to last separator (_, .)
  const prefix = first.slice(0, prefixLength)
  const lastSeparator = Math.max(prefix.lastIndexOf('_'), prefix.lastIndexOf('.'))

  if (lastSeparator === -1) return ''  // No separator found

  return prefix.slice(0, lastSeparator + 1)  // Include separator
}

/**
 * Group fields by common prefix.
 * Returns groups of fields with shared prefix (billing_*, shipping_*).
 */
export function detectPrefixGroups(
  fields: FieldInfo[],
  config = GROUPING_CONFIG
): PrefixGroup[] {
  // User decision: Minimum 8+ fields before grouping
  if (fields.length < config.minFieldsForGrouping) {
    return []
  }

  // Build prefix map
  const prefixMap = new Map<string, FieldInfo[]>()

  for (const field of fields) {
    // Check for underscore or dot separator
    const separatorIndex = Math.max(
      field.name.lastIndexOf('_'),
      field.name.lastIndexOf('.')
    )

    if (separatorIndex > 0) {
      const prefix = field.name.slice(0, separatorIndex + 1)
      if (!prefixMap.has(prefix)) {
        prefixMap.set(prefix, [])
      }
      prefixMap.get(prefix)!.push(field)
    }
  }

  // Filter groups: minimum 3+ fields (user decision)
  const groups: PrefixGroup[] = []

  for (const [prefix, groupFields] of prefixMap) {
    if (groupFields.length >= config.minFieldsPerGroup) {
      groups.push({
        type: 'prefix',
        prefix,
        label: formatGroupLabel(prefix),
        fields: groupFields,
      })
    }
  }

  return groups
}

/**
 * Format group label from prefix.
 * User decision: Title case, strip prefix, remove common suffixes.
 */
function formatGroupLabel(prefix: string): string {
  // Remove trailing separator
  let label = prefix.replace(/[_.]$/, '')

  // Strip common suffixes (user decision: configurable)
  const suffixesToStrip = ['info', 'details', 'data', 'config', 'settings', 'options']
  for (const suffix of suffixesToStrip) {
    const regex = new RegExp(`_${suffix}$`, 'i')
    label = label.replace(regex, '')
  }

  // Title case
  return label
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
```

### Pattern 3: Semantic Clustering Using Phase 12 Categories

**What:** Group related fields by semantic category even without shared prefix (email + phone + address → "Contact")

**When to use:** When fields are semantically related but don't share naming convention

**Example:**
```typescript
// src/services/analysis/grouping.ts
export const SEMANTIC_CLUSTER_RULES = [
  {
    name: 'Contact',
    categories: ['email', 'phone', 'address'] as SemanticCategory[],
    minFields: 2,  // At least 2 of these must be present
  },
  {
    name: 'Identity',
    categories: ['name', 'email', 'avatar'] as SemanticCategory[],
    minFields: 2,
  },
  {
    name: 'Pricing',
    categories: ['price', 'currency_code', 'quantity'] as SemanticCategory[],
    minFields: 2,
  },
  {
    name: 'Temporal',
    categories: ['date', 'timestamp'] as SemanticCategory[],
    minFields: 2,
  },
] as const

export function detectSemanticClusters(
  fields: FieldInfo[],
  config = GROUPING_CONFIG
): SemanticCluster[] {
  // User decision: Minimum 8+ fields before grouping
  if (fields.length < config.minFieldsForGrouping) {
    return []
  }

  const clusters: SemanticCluster[] = []

  for (const rule of SEMANTIC_CLUSTER_RULES) {
    const matchingFields = fields.filter(field =>
      field.semanticCategory &&
      rule.categories.includes(field.semanticCategory)
    )

    if (matchingFields.length >= rule.minFields) {
      clusters.push({
        type: 'semantic',
        label: rule.name,
        categories: rule.categories,
        fields: matchingFields,
      })
    }
  }

  return clusters
}
```

### Pattern 4: Configuration as TypeScript Object

**What:** Store all weights, thresholds, and rules in a TypeScript const object for type safety and easy modification

**When to use:** Always for this phase (user decision: make all scoring rules configurable)

**Example:**
```typescript
// src/services/analysis/config.ts
export const ANALYSIS_CONFIG = {
  importance: {
    weights: {
      namePattern: 0.40,
      visualRichness: 0.25,
      dataPresence: 0.20,
      position: 0.15,
    },
    tierThresholds: {
      primary: 0.80,
      secondary: 0.50,
    },
    metadataPatterns: [
      /^id$/i,
      /^_/,
      /^[a-z]+_id$/i,
      /^(created|updated|deleted)_at$/i,
    ],
    // Name patterns that boost importance
    primaryIndicators: [
      /\b(name|title|headline|heading|label|summary)\b/i,
    ],
  },
  grouping: {
    minFieldsForGrouping: 8,     // User decision
    minFieldsPerGroup: 3,         // User decision
    suffixesToStrip: [            // User decision: Claude's discretion
      'info', 'details', 'data', 'config', 'settings', 'options',
    ],
    semanticClusters: [
      { name: 'Contact', categories: ['email', 'phone', 'address'], minFields: 2 },
      { name: 'Identity', categories: ['name', 'email', 'avatar'], minFields: 2 },
      { name: 'Pricing', categories: ['price', 'currency_code', 'quantity'], minFields: 2 },
      { name: 'Temporal', categories: ['date', 'timestamp'], minFields: 2 },
    ],
  },
} as const

// Export typed subsets for use in specific modules
export const IMPORTANCE_CONFIG = ANALYSIS_CONFIG.importance
export const GROUPING_CONFIG = ANALYSIS_CONFIG.grouping
```

### Anti-Patterns to Avoid

- **JSON/YAML config files:** Lose type safety, require parsing, harder to maintain than TypeScript const
- **Machine learning clustering:** Overkill for rule-based grouping, requires training data, adds complexity
- **Mutating configuration at runtime:** Config should be const, make new config objects if needed for testing
- **Global state for analysis results:** Analysis should be pure functions, results cached in appStore (Phase 12 pattern)

## Don't Hand-Roll

Problems that look simple but have existing solutions or patterns from Phase 12:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semantic category detection | New semantic patterns | Phase 12 semantic detector | Already built, tested, and working |
| Config validation | Custom validator | TypeScript const with as const | Type system enforces validity at compile time |
| Signal scoring logic | New scoring algorithm | Phase 12 scorer.ts pattern | Proven multi-signal approach, extend it |
| Clustering algorithms | K-means, DBSCAN, hierarchical | Longest common prefix + semantic matching | Simple problems need simple solutions, no external deps |

**Key insight:** This phase extends Phase 12's multi-signal scoring pattern. Don't reinvent the scoring algorithm, just add new signal types (visual richness, data presence, position) using the same SignalMatch structure.

## Common Pitfalls

### Pitfall 1: Inflated Scores from Multiple Weak Signals

**What goes wrong:** Fields get artificially high importance scores by matching many weak signals instead of strong ones

**Why it happens:** Summing all signal contributions without normalization can exceed 1.0 or favor quantity over quality

**How to avoid:**
- Ensure all signal weights sum to 1.0 (40% + 25% + 20% + 15% = 100%)
- Each signal returns 0.0-1.0 score, multiplied by weight
- Total score is naturally bounded to 0.0-1.0 range

**Warning signs:**
- Importance scores above 1.0
- Generic fields (id, status) scoring as primary
- All fields getting similar scores

### Pitfall 2: Over-Grouping Creates Tiny Groups

**What goes wrong:** Too many groups with 1-2 fields each, harder to navigate than no groups

**Why it happens:** Low minFieldsPerGroup threshold or detecting every possible prefix

**How to avoid:**
- User decision: minimum 3+ fields per group
- User decision: skip grouping if it leaves 1-2 orphan fields
- Only detect groups for common patterns (user_*, billing_*), not singleton prefixes

**Warning signs:**
- More groups than ungrouped fields
- Groups with 1-2 fields
- Group names that are field names (product_name → "Product Name" group with one field)

### Pitfall 3: Metadata Detection Too Aggressive

**What goes wrong:** Important fields like user_id or status_message misclassified as metadata

**Why it happens:** Overly broad regex patterns matching legitimate fields

**How to avoid:**
- Use word boundaries in patterns: /^id$/ not /id/
- Test patterns against real API responses
- Make metadata patterns configurable (ANALYSIS_CONFIG.importance.metadataPatterns)

**Warning signs:**
- Primary fields being de-emphasized
- User complaints about missing important fields
- Fields with rich data marked as tertiary

### Pitfall 4: Position Bias Overweighting First Fields

**What goes wrong:** First 3 fields always primary regardless of content

**Why it happens:** Linear position scoring (position 0 = 1.0, position 1 = 0.9, etc.)

**How to avoid:**
- Use logarithmic decay: fields 1-5 get similar scores, then gradual decline
- Position weight is only 15% of total score
- Metadata override forces tertiary regardless of position

**Warning signs:**
- id field at position 0 scoring as primary
- Important fields at position 10+ marked secondary
- Every API's first field is always primary

### Pitfall 5: Group Name Collisions

**What goes wrong:** Both prefix group "Contact" (contact_*) and semantic cluster "Contact" (email+phone+address) created

**Why it happens:** Prefix grouping and semantic clustering run independently without coordination

**How to avoid:**
- Run prefix grouping first, remove grouped fields from semantic clustering pool
- OR: Merge groups with same name, combining their fields
- OR: Prioritize one type (semantic over prefix, or vice versa)

**Warning signs:**
- Duplicate group names in UI
- Same field appearing in multiple groups
- Confusion about which grouping method was used

## Code Examples

Verified patterns for this phase:

### Importance Scoring with Visual Richness Signal

```typescript
// src/services/analysis/importance.ts

/**
 * Score visual richness based on semantic category.
 * User decision: Visual fields (image, video, avatar) are more important.
 * Returns 0.0-1.0 score.
 */
function scoreVisualRichness(category: SemanticCategory | null): number {
  if (!category) return 0.0

  // High visual richness: images, videos, avatars
  if (['image', 'video', 'thumbnail', 'avatar'].includes(category)) {
    return 1.0
  }

  // Medium visual richness: titles, descriptions (text content)
  if (['title', 'name', 'description'].includes(category)) {
    return 0.6
  }

  // Low visual richness: metadata, technical fields
  if (['uuid', 'timestamp', 'date'].includes(category)) {
    return 0.2
  }

  // Default: moderate richness
  return 0.4
}

/**
 * Score data presence based on sample values.
 * Fields with more non-null values are more important.
 * Returns 0.0-1.0 score.
 */
function scoreDataPresence(sampleValues: unknown[]): number {
  if (sampleValues.length === 0) return 0.0

  const nonNullCount = sampleValues.filter(v =>
    v !== null && v !== undefined && v !== ''
  ).length

  return nonNullCount / sampleValues.length
}

/**
 * Score position with logarithmic decay.
 * Earlier fields slightly favored, but not heavily weighted.
 * Returns 0.0-1.0 score.
 */
function scorePosition(position: number, totalFields: number): number {
  if (totalFields <= 1) return 1.0

  // Logarithmic decay: 1.0 at position 0, gradual decline
  // position 0-2: ~1.0, position 5: ~0.8, position 20: ~0.5
  const normalizedPosition = position / totalFields
  return Math.max(0.2, 1.0 - Math.log10(normalizedPosition * 10 + 1) * 0.5)
}

/**
 * Check if field matches metadata patterns.
 * User decision: Force metadata fields to tertiary.
 */
function isMetadataField(
  fieldName: string,
  patterns: RegExp[]
): boolean {
  return patterns.some(pattern => pattern.test(fieldName))
}
```

### Combined Grouping Analysis

```typescript
// src/services/analysis/grouping.ts

export interface GroupingResult {
  groups: FieldGroup[]
  ungrouped: FieldInfo[]
}

export type FieldGroup = PrefixGroup | SemanticCluster

export interface PrefixGroup {
  type: 'prefix'
  prefix: string
  label: string
  fields: FieldInfo[]
}

export interface SemanticCluster {
  type: 'semantic'
  label: string
  categories: SemanticCategory[]
  fields: FieldInfo[]
}

/**
 * Analyze fields for grouping.
 * User decision: Both prefix matching AND semantic clustering.
 * Returns groups and ungrouped fields.
 */
export function analyzeGrouping(
  fields: FieldInfo[],
  config = GROUPING_CONFIG
): GroupingResult {
  // User decision: Skip if <8 fields
  if (fields.length < config.minFieldsForGrouping) {
    return { groups: [], ungrouped: fields }
  }

  // 1. Detect prefix groups first
  const prefixGroups = detectPrefixGroups(fields, config)
  const prefixGroupedFieldPaths = new Set(
    prefixGroups.flatMap(g => g.fields.map(f => f.path))
  )

  // 2. Detect semantic clusters from remaining fields
  const remainingFields = fields.filter(f => !prefixGroupedFieldPaths.has(f.path))
  const semanticClusters = detectSemanticClusters(remainingFields, config)
  const semanticGroupedFieldPaths = new Set(
    semanticClusters.flatMap(g => g.fields.map(f => f.path))
  )

  // 3. Identify ungrouped fields
  const ungrouped = remainingFields.filter(f => !semanticGroupedFieldPaths.has(f.path))

  // User decision: Skip grouping if it leaves 1-2 orphans
  const totalGrouped = prefixGroupedFieldPaths.size + semanticGroupedFieldPaths.size
  if (fields.length - totalGrouped <= 2 && totalGrouped < fields.length) {
    // Too many orphans, don't group
    return { groups: [], ungrouped: fields }
  }

  return {
    groups: [...prefixGroups, ...semanticClusters],
    ungrouped,
  }
}
```

### Full Analysis Pipeline

```typescript
// src/services/analysis/index.ts

export interface AnalysisResult {
  importance: Map<string, ImportanceScore>  // fieldPath -> score
  grouping: GroupingResult
}

/**
 * Main analysis function.
 * Combines importance scoring and grouping detection.
 * This is the public API for Phase 13.
 */
export function analyzeFields(
  fields: FieldInfo[],
  config = ANALYSIS_CONFIG
): AnalysisResult {
  // 1. Score importance for each field
  const importance = new Map<string, ImportanceScore>()
  for (const field of fields) {
    const score = calculateImportance(field, config.importance)
    importance.set(field.path, score)
  }

  // 2. Detect groupings
  const grouping = analyzeGrouping(fields, config.grouping)

  return { importance, grouping }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed importance rules | Configurable weighted scoring | Phase 13 | User can tune weights without code changes |
| Manual field categorization | Automated multi-signal analysis | Phase 13 | Consistent importance assignment across all APIs |
| No grouping | Hybrid prefix + semantic grouping | Phase 13 | Better organization for complex schemas |
| JSON config files | TypeScript const config | 2025-2026 | Type safety, no parsing, IDE autocomplete |

**Deprecated/outdated:**
- **K-means clustering for field grouping**: Overkill for simple prefix/semantic matching, requires choosing K upfront, doesn't handle variable group sizes
- **JSON Schema for config validation**: TypeScript's type system + as const is simpler and catches errors at compile time
- **Global config mutation**: Modern pattern is immutable config objects, create new instances for testing

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal tier thresholds (80%/50%)**
   - What we know: User decided on 80% primary, 50% secondary based on discussion
   - What's unclear: Whether these thresholds will work well across diverse API schemas
   - Recommendation: Start with user-specified thresholds, add telemetry to track tier distribution, adjust if >50% of fields are primary or >80% are tertiary

2. **Semantic cluster rules completeness**
   - What we know: Four semantic clusters defined (Contact, Identity, Pricing, Temporal)
   - What's unclear: Are there other common clusters we're missing?
   - Recommendation: Start with these four, monitor for fields that should cluster but don't, expand rules in future iterations

3. **Group name conflict resolution**
   - What we know: Both prefix and semantic grouping can create groups with same name
   - What's unclear: Best strategy for handling conflicts (merge, prioritize, rename)
   - Recommendation: Run prefix grouping first, exclude those fields from semantic clustering to avoid conflicts (implemented in example code above)

4. **Inline editing UX for group names**
   - What we know: User prefers inline editing (click header to rename) over configure mode
   - What's unclear: Exact implementation details (double-click vs edit icon, save on blur vs explicit save button)
   - Recommendation: Use existing inline edit patterns from React ecosystem (EditableLabel component pattern, save on blur + Enter key)

## Sources

### Primary (HIGH confidence)
- TypeScript Official Docs - [tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) - Configuration patterns
- TypeScript Official Docs - [TSConfig Reference](https://www.typescriptlang.org/tsconfig/) - File pattern matching
- Phase 12 codebase - `/src/services/semantic/scorer.ts` - Multi-signal scoring pattern to extend
- Phase 12 codebase - `/src/services/semantic/types.ts` - SignalMatch, ConfidenceResult structures to reuse
- Phase 12 codebase - `/src/store/configStore.ts` - Existing zustand store pattern

### Secondary (MEDIUM confidence)
- [Longest Common Prefix TypeScript](https://medium.com/@petermbiriri8957/longest-common-prefix-ts-algorithm-731263147942) - Algorithm implementation
- [Horizontal/Vertical Scanning: Longest Common Prefix](https://johnkavanagh.co.uk/articles/horizontal-and-vertical-scanning-the-longest-common-prefix/) - Performance comparison (vertical scanning for sorted arrays)
- [Weighted Scoring Model Implementation](https://productschool.com/blog/product-fundamentals/weighted-scoring-model) - Multi-criteria weighted scoring principles
- [BM25 Relevance Scoring](https://www.geeksforgeeks.org/elasticsearch/relevance-scoring-and-search-relevance-in-elasticsearch/) - Position + frequency weighting algorithms
- [React Inline Edit Patterns](https://blog.logrocket.com/build-inline-editable-ui-react/) - Inline editing UX patterns
- [Accordion UI Best Practices](https://www.eleken.co/blog-posts/accordion-ui) - Collapsible sections for field grouping
- [TypeScript String Prefix Detection](https://www.webdevtutor.net/blog/typescript-string-prefix) - startsWith() patterns

### Tertiary (LOW confidence, marked for validation)
- WebSearch results on semantic clustering - General clustering concepts, not specific to field grouping
- WebSearch results on metadata detection - CloudWatch pattern examples, may not apply directly to API schemas

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zero dependencies confirmed from Phase 12 architecture, TypeScript patterns well-established
- Architecture: HIGH - Extends proven Phase 12 scorer pattern, TypeScript config object is standard practice
- Pitfalls: MEDIUM - Common scoring pitfalls well-known, but grouping conflict resolution needs validation with real data
- Code examples: HIGH - All examples follow Phase 12's established patterns (scorer.ts, types.ts structure)

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain, core algorithms unlikely to change)
