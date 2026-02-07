# Phase 12: Core Semantic Detection - Research

**Researched:** 2026-02-07
**Domain:** Pattern-based field semantic classification and confidence scoring
**Confidence:** MEDIUM

## Summary

Semantic field detection is a heuristic pattern matching problem that combines multiple signals (field names, types, values, OpenAPI hints) to classify fields into semantic categories (price, rating, reviews, etc.). The standard approach is zero-dependency pattern matching using regex, value heuristics, and multi-signal weighted scoring to produce confidence levels.

Research focused on understanding pattern detection approaches, confidence scoring algorithms, internationalization for field name matching, composite pattern detection (arrays of objects), and performance optimization through memoization. The codebase already has foundation patterns in `imageDetection.ts` and `primitiveDetection.ts` that use regex-based heuristics.

The key challenges are: (1) balancing false positives vs false negatives with a 75% confidence threshold, (2) supporting multilingual field names (English, Spanish, French, German), (3) detecting composite patterns like review arrays, and (4) maintaining <100ms overhead through efficient caching.

**Primary recommendation:** Extend existing zero-dependency heuristic approach with multi-signal weighted scoring (name pattern + type match + value validation + OpenAPI hints), storing results in appStore metadata, and using memoization to cache analysis per API response.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.3 | Type-safe pattern matching | Already in use, provides static typing for pattern definitions |
| Native RegExp | Built-in | Pattern matching for field names | Zero-dependency, sufficient for name/value pattern matching |
| zustand | 5.0.11 | State management | Already in use for appStore, will store semantic metadata |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Date validation | Already in use, helps validate date fields |
| @apidevtools/swagger-parser | 12.1.0 | OpenAPI parsing | Already in use, provides format/description hints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zero-dependency patterns | Zod schema validation | Zod is excellent for runtime validation but adds 60KB dependency; user decided on zero-dependency approach |
| Custom memoization | lodash.memoize | Lodash adds dependency; simple memoization is easy to implement |
| ts-pattern library | Native pattern matching | ts-pattern is powerful but adds dependency; heuristics are straightforward enough for native approach |

**Installation:**
```bash
# No new dependencies required - use existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── semantic/           # New semantic detection module
│       ├── patterns/       # Pattern definitions per category
│       │   ├── commerce.ts      # price, currency, sku
│       │   ├── engagement.ts    # rating, reviews, tags
│       │   ├── media.ts         # images, videos, thumbnails
│       │   ├── identity.ts      # email, phone, uuid
│       │   └── index.ts         # Pattern registry
│       ├── detector.ts          # Main detection engine
│       ├── scorer.ts            # Confidence scoring logic
│       ├── cache.ts             # Memoization utilities
│       └── types.ts             # Semantic types
├── types/
│   └── schema.ts           # Extend with semantic metadata
└── utils/
    └── primitiveDetection.ts    # Extend existing detection
```

### Pattern 1: Multi-Signal Pattern Definitions
**What:** Each semantic pattern defines multiple detection signals with weights
**When to use:** All pattern definitions (20-25 patterns total)
**Example:**
```typescript
// Source: Research synthesis from field type heuristic detection patterns
export interface SemanticPattern {
  category: string
  signals: {
    // Name patterns with multilingual support
    namePatterns: Array<{ regex: RegExp; weight: number; languages: string[] }>
    // Type constraints
    typeConstraints: { allowed: FieldType[]; weight: number }
    // Value validators
    valueValidators: Array<{ validator: (v: unknown) => boolean; weight: number }>
    // OpenAPI format hints
    formatHints: Array<{ format: string; weight: number }>
  }
  thresholds: {
    highConfidence: number  // e.g., 90%
    mediumConfidence: number // e.g., 75%
  }
}

// Example: Price pattern
const pricePattern: SemanticPattern = {
  category: 'price',
  signals: {
    namePatterns: [
      {
        regex: /\b(price|cost|amount|fee)\b/i,
        weight: 0.4,
        languages: ['en']
      },
      {
        regex: /\b(precio|costo|importe)\b/i,
        weight: 0.4,
        languages: ['es']
      },
      {
        regex: /\b(prix|coût|montant)\b/i,
        weight: 0.4,
        languages: ['fr']
      },
      {
        regex: /\b(preis|kosten|betrag)\b/i,
        weight: 0.4,
        languages: ['de']
      }
    ],
    typeConstraints: {
      allowed: ['number', 'string'],
      weight: 0.2
    },
    valueValidators: [
      {
        validator: (v) => typeof v === 'number' && v >= 0,
        weight: 0.2
      },
      {
        validator: (v) => typeof v === 'string' && /^\$?[\d,]+(\.\d{2})?$/.test(v),
        weight: 0.2
      }
    ],
    formatHints: [
      { format: 'currency', weight: 0.3 },
      { format: 'decimal', weight: 0.1 }
    ]
  },
  thresholds: {
    highConfidence: 0.90,
    mediumConfidence: 0.75
  }
}
```

### Pattern 2: Composite Pattern Detection
**What:** Detect arrays of objects with consistent internal patterns (e.g., reviews array)
**When to use:** For semantic patterns that appear as structured collections
**Example:**
```typescript
// Source: Composite pattern TypeScript design patterns
export interface CompositePattern extends SemanticPattern {
  compositeSignals: {
    // Array item structure requirements
    requiredFields: Array<{ name: RegExp; type: FieldType }>
    // Minimum confidence for item fields
    itemConfidenceThreshold: number
    // Array-level validators
    arrayValidators: Array<{ validator: (items: unknown[]) => boolean; weight: number }>
  }
}

// Example: Reviews pattern (array of {rating, comment, author})
const reviewsPattern: CompositePattern = {
  category: 'reviews',
  signals: {
    namePatterns: [
      { regex: /\b(reviews?|comments?|feedback)\b/i, weight: 0.3, languages: ['en'] },
      { regex: /\b(reseñas?|comentarios?)\b/i, weight: 0.3, languages: ['es'] }
    ],
    typeConstraints: { allowed: ['array'], weight: 0.2 },
    valueValidators: [],
    formatHints: []
  },
  compositeSignals: {
    requiredFields: [
      { name: /rating|score|stars/i, type: 'number' },
      { name: /comment|text|body|review/i, type: 'string' }
    ],
    itemConfidenceThreshold: 0.6,
    arrayValidators: [
      {
        validator: (items) => items.length > 0 && items.every(i =>
          typeof i === 'object' && i !== null
        ),
        weight: 0.3
      }
    ]
  },
  thresholds: {
    highConfidence: 0.85,
    mediumConfidence: 0.70
  }
}
```

### Pattern 3: Weighted Confidence Scoring
**What:** Combine multiple signals with weights to produce confidence score
**When to use:** All semantic detection operations
**Example:**
```typescript
// Source: Multi-signal classification confidence scoring best practices
export interface ConfidenceResult {
  category: string
  confidence: number  // 0.0 to 1.0
  signals: Array<{ name: string; matched: boolean; weight: number }>
  level: 'high' | 'medium' | 'low' | 'none'
}

export function calculateConfidence(
  fieldName: string,
  fieldType: FieldType,
  sampleValues: unknown[],
  openapiHints: { format?: string; description?: string },
  pattern: SemanticPattern
): ConfidenceResult {
  let totalScore = 0
  let maxPossibleScore = 0
  const matchedSignals: Array<{ name: string; matched: boolean; weight: number }> = []

  // Name pattern matching
  for (const namePattern of pattern.signals.namePatterns) {
    maxPossibleScore += namePattern.weight
    const matched = namePattern.regex.test(fieldName)
    if (matched) totalScore += namePattern.weight
    matchedSignals.push({ name: `name:${namePattern.regex}`, matched, weight: namePattern.weight })
  }

  // Type constraint matching
  const typeMatched = pattern.signals.typeConstraints.allowed.includes(fieldType)
  maxPossibleScore += pattern.signals.typeConstraints.weight
  if (typeMatched) totalScore += pattern.signals.typeConstraints.weight
  matchedSignals.push({ name: 'type', matched: typeMatched, weight: pattern.signals.typeConstraints.weight })

  // Value validation
  for (const validator of pattern.signals.valueValidators) {
    maxPossibleScore += validator.weight
    const matched = sampleValues.some(v => validator.validator(v))
    if (matched) totalScore += validator.weight
    matchedSignals.push({ name: `value:${validator.validator.name}`, matched, weight: validator.weight })
  }

  // OpenAPI format hints
  for (const hint of pattern.signals.formatHints) {
    maxPossibleScore += hint.weight
    const matched = openapiHints.format === hint.format
    if (matched) totalScore += hint.weight
    matchedSignals.push({ name: `format:${hint.format}`, matched, weight: hint.weight })
  }

  const confidence = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0

  let level: 'high' | 'medium' | 'low' | 'none' = 'none'
  if (confidence >= pattern.thresholds.highConfidence) level = 'high'
  else if (confidence >= pattern.thresholds.mediumConfidence) level = 'medium'
  else if (confidence > 0) level = 'low'

  return { category: pattern.category, confidence, signals: matchedSignals, level }
}
```

### Pattern 4: Memoization for Performance
**What:** Cache semantic analysis results to avoid recomputation
**When to use:** Main detection function, runs once per API response
**Example:**
```typescript
// Source: JavaScript memoization caching strategies
export function createMemoizedDetector() {
  const cache = new Map<string, ConfidenceResult[]>()

  return function detectSemantics(
    fieldPath: string,
    fieldName: string,
    fieldType: FieldType,
    sampleValues: unknown[],
    openapiHints: { format?: string; description?: string }
  ): ConfidenceResult[] {
    // Create cache key from stable inputs
    const cacheKey = JSON.stringify({ fieldPath, fieldName, fieldType, sampleValues, openapiHints })

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    }

    const results: ConfidenceResult[] = []

    // Run detection against all patterns
    for (const pattern of getAllPatterns()) {
      const result = calculateConfidence(fieldName, fieldType, sampleValues, openapiHints, pattern)
      if (result.level !== 'none') {
        results.push(result)
      }
    }

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence)

    cache.set(cacheKey, results)
    return results
  }
}
```

### Pattern 5: Extending UnifiedSchema with Metadata
**What:** Store semantic detection results in schema metadata
**When to use:** After schema inference, before rendering
**Example:**
```typescript
// Extend FieldDefinition type
export interface FieldDefinition {
  name: string
  type: TypeSignature
  optional: boolean
  nullable: boolean
  confidence: Confidence
  sampleValues: unknown[]
  // NEW: Semantic metadata
  semantics?: {
    detectedCategory: string | null
    confidence: number
    appliedAt: 'user' | 'smart-default' | 'type-based'
    alternatives: Array<{ category: string; confidence: number }>
  }
}
```

### Anti-Patterns to Avoid
- **Over-weighting name patterns:** Don't rely solely on field names; type/value mismatches indicate false positive
- **Ignoring OpenAPI hints:** When `format` or `description` are present, they should have high weight (0.3+)
- **Not testing negative cases:** Pattern that matches "data" or "value" (generic names) should have low confidence
- **Synchronous computation on render:** Detection must run during schema inference phase, not in React components
- **Not handling multilingual edge cases:** "price" in English matches /price/ but "precio" needs separate pattern

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID detection | Custom regex | Standard UUID v4 pattern `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` | UUID spec is precise, hand-rolled versions miss edge cases |
| ISO currency codes | Hardcoded list | ISO 4217 standard (3-letter codes) | ISO 4217 changes (Bulgaria adopted EUR in 2026), use up-to-date list |
| Email validation | Simple regex | Existing pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` from primitiveDetection.ts | Email spec is complex, don't try to be RFC-compliant |
| Date parsing | Custom parser | `Date.parse()` + ISO 8601 regex already in typeDetection.ts | Date formats are diverse, reuse existing validated patterns |
| Phone number regex | Country-specific rules | International pattern `/^\+?[1-9]\d{1,14}$/` | E.164 standard covers international formats, country rules are maintenance burden |
| Memoization | Complex LRU cache | Simple Map-based cache | Detection runs once per API response, LRU overhead unnecessary |

**Key insight:** Field detection is pattern recognition, not validation. Prioritize recall over precision (better to suggest wrong semantic with 75% confidence than miss it entirely). User can always override via component switcher.

## Common Pitfalls

### Pitfall 1: False Positives from Generic Field Names
**What goes wrong:** Fields named "value", "data", "item", "result" match too many patterns
**Why it happens:** Name-only patterns are too broad; need type and value validation
**How to avoid:** Require minimum 2 signals (name + type/value) for any match above low confidence
**Warning signs:** High confidence on fields that are clearly generic containers

### Pitfall 2: Type Mismatches Creating False Confidence
**What goes wrong:** Field "price" typed as string value "expensive" gets high confidence as price field
**Why it happens:** Name pattern matches strongly, value validator not restrictive enough
**How to avoid:** Value validators should fail on non-numeric price representations; require numeric or currency-formatted string
**Warning signs:** Pattern matches on values that don't make sense (rating = "good" instead of rating = 4.5)

### Pitfall 3: Composite Pattern Over-Triggering
**What goes wrong:** Any array with "rating" field detected as reviews, even if it's product catalog with ratings
**Why it happens:** Composite patterns check internal structure but not array-level semantics
**How to avoid:** Composite patterns need array name pattern + item structure; "reviews" should only match arrays named reviews/comments/feedback
**Warning signs:** Product arrays flagged as reviews because they contain ratings

### Pitfall 4: Ignoring User's Aggressive Threshold (75%)
**What goes wrong:** Patterns designed for 90% threshold miss detections at 75% threshold
**Why it happens:** Developer assumes conservative approach, but user wants aggressive detection
**How to avoid:** Tune pattern thresholds to user's 75% preference; medium confidence = apply smart default
**Warning signs:** Too many fields falling back to type-based defaults when semantic category seems obvious

### Pitfall 5: I18n Pattern Explosion
**What goes wrong:** Adding 4 languages × 25 patterns = 100 regex patterns, performance degrades
**Why it happens:** Naive approach tests every pattern against every field
**How to avoid:** Group multilingual variants into single pattern with alternation regex: `/\b(price|precio|prix|preis)\b/i`
**Warning signs:** Detection takes >100ms, especially on large schemas

### Pitfall 6: Not Respecting OpenAPI Hints
**What goes wrong:** Field `created_at` with `format: "date-time"` not detected as date because name doesn't match date pattern
**Why it happens:** OpenAPI format hints have low weight or are ignored
**How to avoid:** Format hints should have 0.3+ weight; `format: "date-time"` + type=string should guarantee date detection
**Warning signs:** OpenAPI-documented APIs have worse detection than plain JSON APIs

### Pitfall 7: Cache Key Collisions
**What goes wrong:** Different fields cached under same key, wrong semantics applied
**Why it happens:** Cache key doesn't include fieldPath, only fieldName
**How to avoid:** Cache key must include full field path (e.g., "items[].price" vs "shipping.price")
**Warning signs:** Same semantic applied to fields with same name in different contexts

## Code Examples

Verified patterns from official sources:

### ISO 4217 Currency Code Detection
```typescript
// Source: ISO 4217 standard - https://www.iso.org/iso-4217-currency-codes.html
const CURRENCY_CODES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'CAD', 'AUD', 'CHF', 'SEK',
  // ... complete list of 180+ codes
  // Note: BGN deprecated as of 2026-01-01 when Bulgaria joined euro
])

export function isCurrencyCode(value: unknown): boolean {
  return typeof value === 'string' && CURRENCY_CODES.has(value.toUpperCase())
}

// Usage in pattern
const currencyCodePattern: SemanticPattern = {
  category: 'currency_code',
  signals: {
    namePatterns: [
      { regex: /\b(currency|curr)\b/i, weight: 0.3, languages: ['en'] }
    ],
    typeConstraints: { allowed: ['string'], weight: 0.2 },
    valueValidators: [
      { validator: isCurrencyCode, weight: 0.5 }  // High weight for exact match
    ],
    formatHints: []
  },
  thresholds: { highConfidence: 0.90, mediumConfidence: 0.75 }
}
```

### Email Detection Pattern
```typescript
// Source: Existing primitiveDetection.ts
export function isEmailField(fieldName: string, value: unknown): boolean {
  // Name pattern
  const nameMatch = /\b(email|e-?mail|mail)\b/i.test(fieldName)

  // Value validation
  const valueMatch = typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  // Require both signals
  return nameMatch && valueMatch
}
```

### UUID Detection Pattern
```typescript
// Source: UUID v4 specification
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUUIDField(fieldName: string, value: unknown): boolean {
  const nameMatch = /\b(id|uuid|guid|identifier)\b/i.test(fieldName)
  const valueMatch = typeof value === 'string' && UUID_V4_PATTERN.test(value)

  // UUID is high precision - require value match
  return valueMatch && nameMatch
}
```

### Rating Field Detection
```typescript
// Source: Existing primitiveDetection.ts - extend with multi-signal
export function detectRating(
  fieldName: string,
  fieldType: FieldType,
  sampleValues: unknown[]
): ConfidenceResult {
  let score = 0
  const signals: Array<{ name: string; matched: boolean; weight: number }> = []

  // Name pattern (0.4 weight)
  const nameMatch = /\b(rating|score|stars?)\b/i.test(fieldName)
  signals.push({ name: 'name', matched: nameMatch, weight: 0.4 })
  if (nameMatch) score += 0.4

  // Type constraint (0.2 weight)
  const typeMatch = fieldType === 'number'
  signals.push({ name: 'type', matched: typeMatch, weight: 0.2 })
  if (typeMatch) score += 0.2

  // Value range validation (0.4 weight)
  const valueMatch = sampleValues.every(v =>
    typeof v === 'number' && v >= 0 && v <= 5
  )
  signals.push({ name: 'value', matched: valueMatch, weight: 0.4 })
  if (valueMatch) score += 0.4

  const level = score >= 0.90 ? 'high' : score >= 0.75 ? 'medium' : score > 0 ? 'low' : 'none'

  return { category: 'rating', confidence: score, signals, level }
}
```

### Reviews Composite Pattern
```typescript
// Source: Composite pattern TypeScript design patterns
export function detectReviewsArray(
  fieldName: string,
  arrayItems: TypeSignature,
  sampleData: unknown[]
): ConfidenceResult | null {
  // Must be array type
  if (arrayItems.kind !== 'object') return null

  let score = 0
  const signals: Array<{ name: string; matched: boolean; weight: number }> = []

  // Array name pattern (0.3 weight)
  const nameMatch = /\b(reviews?|comments?|feedback|testimonials?)\b/i.test(fieldName)
  signals.push({ name: 'arrayName', matched: nameMatch, weight: 0.3 })
  if (nameMatch) score += 0.3

  // Required field: rating/score (0.35 weight)
  const fields = arrayItems.fields
  const hasRating = Array.from(fields.keys()).some(k => /rating|score|stars/i.test(k))
  signals.push({ name: 'hasRating', matched: hasRating, weight: 0.35 })
  if (hasRating) score += 0.35

  // Required field: comment/text (0.35 weight)
  const hasComment = Array.from(fields.keys()).some(k => /comment|text|review|body/i.test(k))
  signals.push({ name: 'hasComment', matched: hasComment, weight: 0.35 })
  if (hasComment) score += 0.35

  const level = score >= 0.85 ? 'high' : score >= 0.70 ? 'medium' : score > 0 ? 'low' : 'none'

  return { category: 'reviews', confidence: score, signals, level }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rule-based pattern matching | ML-based semantic understanding | 2024-2025 | Research shows ML trend for complex semantics, but zero-dependency requirement keeps us on proven heuristics |
| 90% confidence threshold | 75% aggressive threshold | User decision (2026-02-07) | More smart defaults applied, users rely on component switcher for corrections |
| English-only patterns | Multilingual patterns | Modern i18n best practice (2025+) | Better support for international APIs |
| Single-signal detection | Multi-signal weighted scoring | Confidence scoring research (2024+) | Higher accuracy, explicit confidence levels |
| Hardcoded thresholds | Calibrated thresholds | Modern ML calibration (2025+) | We use static thresholds per user preference, not calibrated |

**Deprecated/outdated:**
- Single-language field detection: Modern apps need i18n support for field names
- Name-only heuristics: Multi-signal approach (name+type+value) now standard
- Deep validation: Don't validate data correctness, only detect semantic category (user said "not validation")

## Open Questions

Things that couldn't be fully resolved:

1. **ISO 4217 Currency Code Maintenance**
   - What we know: ISO 4217 changes (Bulgaria adopted EUR 2026-01-01), codes need updates
   - What's unclear: How to maintain currency code list without adding dependency
   - Recommendation: Extract from OpenAPI spec community resources, hardcode in pattern file with update date comment

2. **Composite Pattern Depth Limit**
   - What we know: Reviews can be nested (product.reviews[].replies[])
   - What's unclear: Should we detect nested composite patterns or only top-level?
   - Recommendation: Start with 1-level depth (detect reviews array but not nested replies), add depth if user needs it

3. **Confidence Calibration Against Real Data**
   - What we know: User wants to test with public APIs and synthetic data
   - What's unclear: Without real-world dataset, confidence thresholds are estimates
   - Recommendation: Start with researched weights (name 0.4, type 0.2, value 0.4), tune during validation testing

4. **Pattern Priority When Multiple Match**
   - What we know: Field could match multiple patterns (e.g., "user_id" matches both "id" and "user")
   - What's unclear: Should we pick highest confidence, or allow multiple semantic tags?
   - Recommendation: Pick highest confidence only (user said "pick most likely option")

5. **OpenAPI Description Text Analysis**
   - What we know: OpenAPI descriptions can contain semantic hints ("The product price in USD")
   - What's unclear: Should we do NLP on description text, or only use format field?
   - Recommendation: Start with format field only (high confidence), add description keyword matching if needed (LOW confidence)

## Sources

### Primary (HIGH confidence)
- TypeScript project package.json - verified existing dependencies (zustand 5.0.11, date-fns 4.1.0, @apidevtools/swagger-parser 12.1.0)
- Existing codebase patterns - `/src/utils/imageDetection.ts`, `/src/utils/primitiveDetection.ts`, `/src/services/schema/typeDetection.ts`
- User CONTEXT.md decisions - 75% threshold, multilingual support, 20-25 patterns, composite detection

### Secondary (MEDIUM confidence)
- [ISO 4217 Currency Codes](https://www.iso.org/iso-4217-currency-codes.html) - Official standard, Bulgaria EUR adoption 2026
- [ISO 3166 Country Codes](https://www.iso.org/iso-3166-country-codes.html) - Official standard for country codes
- [Understanding Confidence Scores in Machine Learning](https://www.mindee.com/blog/how-use-confidence-scores-ml-models) - Multi-signal confidence scoring best practices
- [Best Confidence Scoring Systems 2026](https://www.extend.ai/resources/best-confidence-scoring-systems-document-processing) - Threshold calibration guidance
- [OpenAPI Data Types and Formats](https://liblab.com/blog/openapi-data-types-and-formats) - Format hint best practices
- [Data Types in OpenAPI best practices](https://www.speakeasy.com/openapi/schemas) - Explicit type definition guidance
- [GitHub: schema-analyzer](https://github.com/justsml/schema-analyzer) - Heuristic JSON type analysis patterns
- [Memoization in JavaScript](https://www.freecodecamp.org/news/memoization-in-javascript-and-react/) - Caching strategy best practices
- [JavaScript Performance Optimization 2026](https://www.landskill.com/blog/javascript-performance-optimization/) - Performance optimization guidance
- [Composite Pattern in TypeScript](https://refactoring.guru/design-patterns/composite/typescript/example) - Nested structure pattern detection
- [ts-pattern library](https://github.com/gvergnaud/ts-pattern) - Pattern matching library (reference, not using)
- [Angular i18n Guide 2026](https://intlpull.com/blog/angular-i18n-complete-guide-2026) - Internationalization patterns
- [Email & URL Validation in TypeScript](https://medium.com/@a1guy/email-url-validation-in-typescript-zod-typia-and-a-dash-of-regex-b861b033dc2d) - Regex validation patterns
- [Phone Number Regex](https://uibakery.io/regex-library/phone-number) - International phone pattern `/^\+?[1-9]\d{1,14}$/`

### Tertiary (LOW confidence)
- [False Positives in Testing](https://www.browserstack.com/guide/false-positives-and-false-negatives-in-testing) - Testing guidance, not semantic-specific
- [Semantic Search for E-commerce](https://wizzy.ai/blog/semantic-search-for-ecommerce/) - E-commerce context, different problem domain
- WebSearch results on pattern matching - General TypeScript patterns, not semantic detection specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in codebase (TypeScript, zustand, native RegExp), no new dependencies
- Architecture: MEDIUM - Patterns researched from multiple sources, but no single authoritative guide for semantic field detection; synthesis required
- Pitfalls: MEDIUM - Based on general pattern matching best practices and confidence scoring research, but not semantic-detection-specific experience

**Research date:** 2026-02-07
**Valid until:** 2026-03-09 (30 days - stable domain, pattern matching approaches don't change rapidly)
