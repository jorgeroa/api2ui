# Feature Landscape: Smart Default Component Selection

**Domain:** Semantic field detection and automatic component selection for API visualization
**Researched:** 2026-02-07
**Focus:** v1.3 Smart Default Selection milestone — making detail views look like designed product pages, not data dumps
**Confidence:** MEDIUM-HIGH (patterns verified across design systems, low-code builders, and ecommerce PDPs; some heuristics require field testing)

## Summary

This research examines how design systems, low-code builders, API visualization tools, and ecommerce platforms handle intelligent component selection and layout organization. The v1.3 milestone builds on api2ui's existing type-based component mapping (array→table, object→detail) by adding semantic awareness — understanding that a field named "reviews" should render as cards, not a table, even though it's technically an array.

Key findings: (1) **Semantic field detection** relies on field name pattern matching combined with data shape analysis (reviews/comments/items → cards; specifications/attributes → key-value; images/gallery/photos → image grid), (2) **Field importance hierarchy** surfaces primary fields (name, title, price, image) prominently while de-emphasizing metadata (IDs, timestamps, internal codes), (3) **Auto-grouping** detects logical sections by analyzing field name prefixes, schema.org types, and related field clusters (billing* fields → "Billing Information" section), (4) **Layout heuristics** choose between tables vs cards based on field count (5-8 fields → cards; 10+ fields → table), data density, and presence of rich content (images/descriptions favor cards), (5) **Product detail page patterns** in ecommerce strongly favor **vertical accordions over horizontal tabs** (8% content overlooked vs 27% with tabs), with hero image → overview → expandable specs/reviews structure.

The research reveals that "smart defaults" in production tools combine three techniques: **name-based inference** (field names like "review", "rating"), **type-aware heuristics** (arrays of objects with 3-6 fields → cards; 10+ fields → table), and **visual hierarchy rules** (first image field becomes hero, name/title gets larger typography). Anti-patterns to avoid: overly aggressive inference without override escape hatches, horizontal tabs on detail pages (poor mobile UX), treating all arrays identically regardless of semantic meaning.

## Table Stakes Features

Features users expect from any "smart" component selection system — missing these = feels no smarter than manual configuration.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Field name pattern recognition | Users expect "name", "title", "description" to be emphasized automatically | Low | Regex/substring matching on common patterns; already partially implemented in v1.1 field classification |
| Array content differentiation | Users expect reviews/comments to render as cards, not tables | Medium | Analyze array item structure: 3-6 fields with text → cards; many fields → table |
| Image field detection | Already implemented in v1.1, but must integrate with layout decisions | Low | Existing `isImageUrl()` detection; extend to influence card vs table choice |
| Primary field emphasis | Name/title fields should be larger, bolder — secondary fields (IDs) smaller | Low | Existing typography hierarchy from v1.1; extend to detail views |
| Preserve manual overrides | If user explicitly sets component type, respect that choice over auto-detection | Low | Already implemented via `componentType` config; ensure smart defaults don't override |
| Basic semantic field types | Detect common patterns: reviews, ratings, prices, descriptions, images, dates | Medium | Pattern matching library with 20-30 common field name patterns |
| Table vs cards heuristic | Automatically choose based on field count and content richness | Medium | If array items have <8 fields + images/text → cards; if 10+ fields → table |
| Hero image detection | First image field in detail view should render prominently | Low | Already implemented in v1.1 for cards; extend to detail views |

**Dependencies on existing features:**
- v1.1 image detection (`isImageUrl()`) — foundation for layout decisions
- v1.1 typography hierarchy (primary vs secondary fields) — extend to detail views
- v1.0 component type override system — must not break with smart defaults
- v1.2 parameter grouping by prefix — similar pattern matching approach

**Confidence:** HIGH — These patterns are standard across Airtable (auto-detects field types), Retool (100+ components with smart defaults), and admin panel generators like Hasura.

## Differentiators

Features that would make api2ui's smart defaults exceptional — beyond basic pattern matching.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Semantic section auto-grouping | Group related fields (billing*, shipping*, contact*) into visual sections/accordions | High | Pattern matching on prefixes + field relationship analysis |
| Context-aware component selection | "status" field with 3-5 values → badge/pills, not dropdown; "tags" → tag chips | Medium | Combine field name + enum cardinality + data type |
| Smart tab generation for complex objects | Objects with >15 fields auto-organize into tabs (Overview, Details, Technical, Reviews) | High | Requires semantic categorization of fields into logical groups |
| Rating/review pattern detection | Arrays named "reviews" with "rating" + "comment" fields → star rating + card layout | Medium | Composite pattern: array name + child field names + data shape |
| Nested array smart rendering | Reviews inside product detail → horizontal card scroller; specs → vertical list | Medium | Context-aware: location in hierarchy influences component choice |
| Field importance scoring | Combine multiple signals (name pattern, data richness, position) to rank fields | High | ML-style scoring: name match (30%), data presence (20%), visual richness (20%), position (30%) |
| Gallery detection | Arrays of image URLs → image gallery grid, not cards with individual images | Medium | Detect array of primitives (not objects) where all items are image URLs |
| Key-value pair detection | Object fields with simple values (no nesting) → two-column key-value layout | Low | Already common pattern in detail views; make it the default for "specs" fields |
| Price/currency formatting | Fields named "price", "cost", "amount" → formatted with currency symbol | Low | Pattern match + Intl.NumberFormat |
| Date range pairing | Detect "startDate" + "endDate" pairs, render as single "Duration" or date range | High | Field relationship analysis (already explored in v1.2 research for forms) |

**Recommendation for v1.3:**
- Semantic section auto-grouping (HIGH VALUE — turns data dumps into organized pages)
- Context-aware component selection (MEDIUM VALUE — badges, pills, tag chips feel professional)
- Rating/review pattern detection (HIGH VALUE — common use case, high visual impact)
- Gallery detection (MEDIUM VALUE — image-heavy APIs benefit greatly)
- Field importance scoring (HIGH VALUE — core of "smart" defaults)
- Defer to v1.4: Smart tab generation (complex, needs user research on tab categories)

## Anti-Features

Things to deliberately NOT build — common mistakes in automatic component selection.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Inference without escape hatch | If system picks wrong component and user can't override, they're stuck | Always honor manual `componentType` overrides; provide switcher in View mode |
| Horizontal tabs in detail views | 27% of users overlook horizontal tabs (Baymard research); poor mobile UX | Use vertical accordions/collapsible sections instead (only 8% overlook) |
| Treating all arrays identically | Reviews, images, and users are all arrays but should render differently | Analyze array item structure + field names to choose appropriate component |
| Over-splitting into tabs | Creating 10+ tabs for every detail view overwhelms users | Limit to 3-4 logical groups max (Overview, Details, Reviews, Specs) |
| Ignoring data density | Forcing cards for 20-field objects makes each card huge and unreadable | Use table when >10 fields per item, regardless of semantic hints |
| Auto-grouping unrelated fields | Grouping "status" and "statistics" just because they share "sta" prefix | Require meaningful prefix (3+ chars) or explicit semantic relationship |
| Hiding important fields in collapsed sections | Auto-collapsing "price" or "name" because they're in a group | Always show primary fields (top 3-5 by importance score) expanded by default |
| Inferring relationships without evidence | Assuming "userId" and "userName" should be linked/nested without schema proof | Only group fields with clear prefix match or schema relationship |
| Aggressive reformatting | Auto-converting "USD 100" to "$100.00" when API might return it formatted | Format only when field name matches AND value is pure number |
| Irreversible smart defaults | Making auto-detected choices permanent, not allowing override | Store smart default as `autoDetectedType`, allow override to `componentType` |

**Key insight from research:** Horizontal tabs are the **worst-performing layout** for product detail pages (27% overlook rate vs 8% for vertical sections). api2ui should default to vertical accordions for section organization, never horizontal tabs.

## Semantic Field Detection Patterns

The foundation of smart defaults — how to detect what a field represents based on its name, type, and data.

### Name-Based Patterns (High Confidence)

Field name patterns that reliably indicate component type:

| Pattern | Detected Semantic Type | Recommended Component | Confidence |
|---------|------------------------|----------------------|------------|
| `name`, `title`, `label`, `heading` | Primary identifier | Large bold text (text-lg font-bold) | HIGH |
| `description`, `summary`, `overview`, `bio` | Long-form text | Multi-line text block, potentially truncated | HIGH |
| `image`, `photo`, `picture`, `avatar`, `thumbnail`, `icon` | Image URL | Image component (hero if first, thumbnail if in list) | HIGH |
| `images`, `gallery`, `photos` (array) | Image collection | Image grid or horizontal scroller | HIGH |
| `rating`, `score`, `stars` | Numeric rating | Star rating component or badge | HIGH |
| `review`, `comment`, `feedback` (singular) | Text review | Card with author/date/text layout | HIGH |
| `reviews`, `comments`, `feedback` (array) | Review collection | Card list (NOT table) | HIGH |
| `price`, `cost`, `amount`, `total`, `subtotal` | Currency amount | Formatted currency (Intl.NumberFormat) | HIGH |
| `tags`, `categories`, `keywords` (array) | Tag collection | Tag chips (pills), not dropdown | HIGH |
| `status`, `state`, `condition` (enum) | Status indicator | Badge/pill with color coding | HIGH |
| `email`, `phone`, `website`, `url` | Contact info | Clickable link (mailto:, tel:, https://) | HIGH |
| `date`, `createdAt`, `updatedAt`, `publishedAt` | Timestamp | Formatted date (relative or absolute) | HIGH |
| `id`, `uuid`, `key`, `slug` | Internal identifier | Small monospace text (text-xs font-mono), de-emphasized | HIGH |
| `spec`, `specification`, `attribute`, `property` | Key-value metadata | Two-column key-value layout | MEDIUM |
| `features`, `highlights`, `benefits` (array) | Bullet points | Unordered list with checkmarks or bullets | MEDIUM |

**Implementation notes:**
- Use case-insensitive matching: `toLowerCase()` before comparison
- Support common variations: "userName" → "name", "productTitle" → "title"
- Check substring, not just exact match: "productName" matches "name" pattern
- Plural arrays: "review" vs "reviews" both match review pattern

### Data Shape Heuristics (Medium Confidence)

When field name is ambiguous, use data structure to infer component:

| Data Shape | Characteristics | Recommended Component | Use Case |
|------------|----------------|----------------------|----------|
| Array of objects with 3-6 fields | Small, card-sized items | Card list | Products, users, articles |
| Array of objects with 10+ fields | Wide, table-optimized data | Table with columns | Transactions, logs, reports |
| Array of objects with images + text | Rich content items | Card list with hero images | Blog posts, products, portfolios |
| Array of primitives (strings) | Simple list | Tag chips or bullet list | Tags, categories, features |
| Array of image URLs | All strings matching image pattern | Image grid (3-4 columns) | Gallery, portfolio, media library |
| Object with 5-10 simple fields | Shallow key-value pairs | Two-column key-value layout | Specifications, attributes, settings |
| Object with >15 fields | Complex nested structure | Tabbed/accordion sections | Full product details, user profiles |
| Nested array inside detail view | Sub-collection within parent | Horizontal card scroller OR collapsible section | Reviews in product, orders in user |

**Threshold values** (can be tuned based on user feedback):
- Card-friendly: 3-8 fields per item
- Table-friendly: 9+ fields per item
- Gallery threshold: 100% of array items are image URLs
- Tab/section threshold: >15 top-level fields in object

### Composite Pattern Matching (High Value)

Combine multiple signals for high-confidence detection:

| Pattern Name | Field Name Signal | Type Signal | Data Signal | Result |
|--------------|-------------------|-------------|-------------|--------|
| **Product Review** | Field named "reviews" | Array of objects | Items have "rating" (number) + "comment" (string) | Card list with star ratings |
| **Image Gallery** | Field named "gallery", "images", "photos" | Array | All items are image URL strings | Image grid layout |
| **Rating Display** | Field named "rating", "score", "stars" | Number | Value between 0-5 or 0-10 | Star rating component |
| **Price Display** | Field named "price", "cost" | Number or string | Numeric value, possibly with currency | Formatted currency |
| **Tag Collection** | Field named "tags", "categories" | Array of strings | Short strings (<20 chars) | Tag chip pills |
| **Status Badge** | Field named "status", "state" | String enum | 3-8 possible values | Colored badge/pill |
| **Specification List** | Field named "specs", "attributes", "properties" | Object | Shallow (no nested objects) | Two-column key-value |
| **Feature List** | Field named "features", "highlights" | Array of strings | Sentence-like strings | Bullet list with checkmarks |

**Scoring approach:**
```
confidence_score = (name_match ? 40 : 0) + (type_match ? 30 : 0) + (data_match ? 30 : 0)
```
- 70+ points: HIGH confidence, apply smart default
- 40-69 points: MEDIUM confidence, apply if no manual override
- <40 points: LOW confidence, fall back to type-based default

## Field Importance Hierarchy

How to determine which fields are "primary" (prominent) vs "secondary" (de-emphasized).

### Importance Scoring Algorithm

Combine multiple signals to rank fields by importance:

| Factor | Weight | Scoring Rules |
|--------|--------|---------------|
| **Field Name Pattern** | 40% | name/title/label (10 pts), image/photo (8 pts), description (7 pts), price (8 pts), id/uuid (0 pts) |
| **Visual Richness** | 25% | Image URL (10 pts), long text >200 chars (7 pts), array (5 pts), short string (3 pts) |
| **Data Presence** | 20% | Non-null value (10 pts), null/empty (0 pts) |
| **Position in Schema** | 15% | First 3 fields (10 pts), middle fields (5 pts), last fields (2 pts) |

**Total score out of 100** → rank fields, apply visual hierarchy:
- 70-100: **Primary** — text-lg/xl, font-bold, prominent placement
- 40-69: **Secondary** — text-base, font-normal, standard placement
- 0-39: **Tertiary** — text-sm, text-gray-600, collapsed by default or moved to "More Info"

### Visual Hierarchy Rules

Based on importance score, apply these rendering rules:

| Importance Level | Typography | Placement | Visibility |
|------------------|------------|-----------|------------|
| **Primary (70-100)** | text-lg/xl font-bold text-gray-900 | Top of detail view, always visible | Never collapsed |
| **Secondary (40-69)** | text-base font-normal text-gray-800 | Middle sections, visible by default | Can be in accordions (expanded) |
| **Tertiary (0-39)** | text-sm text-gray-600 | Bottom or "More Info" section | Collapsed by default |
| **Metadata (IDs, timestamps)** | text-xs font-mono text-gray-500 | Bottom, separate "Technical Details" section | Collapsed, de-emphasized |

### Special Cases

| Field Type | Override Rule | Example |
|------------|---------------|---------|
| First image in object | Always primary, hero position | Product thumbnail becomes hero image |
| Price/cost fields | Always primary if present | Price is critical for products |
| Status/state | Primary if near top, secondary otherwise | Order status is primary; internal state code is secondary |
| IDs and UUIDs | Always tertiary, never primary | Even "userId" is not important to end users |
| Timestamps | Secondary if "createdAt", tertiary if "updatedAt" | Created date is context, updated date is metadata |

## Auto-Grouping and Section Organization

How to detect logical groupings of fields and organize them into sections/accordions.

### Prefix-Based Grouping (High Confidence)

Fields sharing a common prefix should be grouped together:

| Prefix Pattern | Group Name | Example Fields | Section Title |
|----------------|------------|----------------|---------------|
| `billing*` | Billing Information | billingAddress, billingCity, billingZip | "Billing Information" |
| `shipping*` | Shipping Information | shippingAddress, shippingCity, shippingZip | "Shipping Information" |
| `contact*` | Contact Details | contactName, contactEmail, contactPhone | "Contact Details" |
| `payment*` | Payment Information | paymentMethod, paymentStatus, paymentDate | "Payment Details" |
| `delivery*` | Delivery Information | deliveryDate, deliveryStatus, deliveryNotes | "Delivery Information" |
| `product*` | Product Details | productName, productPrice, productSKU | "Product Details" |
| `user*` | User Information | userName, userEmail, userId | "User Information" |
| `meta*` or `metadata*` | Metadata | metaTitle, metaDescription, metaKeywords | "Metadata" |

**Grouping rules:**
- Minimum 2 fields required to form a group (don't create single-field sections)
- Prefix must be 3+ characters to avoid false positives ("id" prefix too generic)
- Fields without prefix remain in "Overview" or main section
- Groups with 1-3 fields: inline in main view; 4+ fields: collapsible accordion

### Semantic Field Clustering (Medium Confidence)

Group fields by semantic relationship, even without shared prefix:

| Cluster Type | Field Patterns | Section Name |
|--------------|----------------|--------------|
| **Contact Information** | email, phone, website, address, city, state, zip | "Contact Information" |
| **Dimensions** | width, height, depth, weight, volume | "Dimensions" |
| **Date Range** | startDate, endDate, duration, createdAt, updatedAt | "Timeline" or "Dates" |
| **Location** | address, city, state, country, zip, latitude, longitude | "Location" |
| **Pricing** | price, cost, discount, tax, total, subtotal | "Pricing" |
| **Statistics** | views, likes, shares, downloads, clicks, impressions | "Statistics" |
| **Technical Specs** | specs, specifications, attributes, properties, features | "Specifications" |
| **Social/Reviews** | reviews, ratings, comments, testimonials | "Reviews" |

**Detection approach:**
- Check if 3+ fields match a semantic cluster pattern
- If yes, create named section (e.g., "Contact Information")
- Apply cluster-specific formatting (e.g., contact fields get icons, stats get number formatting)

### Section Ordering and Defaults

Recommended order for auto-generated sections:

1. **Hero Section** (always first) — Primary image + name/title
2. **Overview** (always visible, never collapsed) — Price, short description, status, key attributes
3. **Details** (expanded by default) — Secondary fields that don't fit other categories
4. **Specifications/Technical** (collapsed) — Specs, attributes, dimensions
5. **Reviews** (expanded if present) — Ratings, reviews, comments
6. **Additional Information** (collapsed) — Tertiary fields, less important data
7. **Metadata/Technical Details** (collapsed) — IDs, timestamps, internal codes

**Collapse rules:**
- Sections 1-3: always expanded (hero, overview, details)
- Sections 4-5: expanded if <8 fields, collapsed if 8+
- Sections 6-7: always collapsed by default

## Data Shape Heuristics: Table vs Cards vs Key-Value

When to use each component type based on data characteristics.

### Decision Matrix

| Scenario | Field Count | Visual Richness | Recommended Component | Rationale |
|----------|-------------|-----------------|----------------------|-----------|
| Product listings | 3-6 fields | Images + text | **Cards** | Visual browsing, images are key |
| Transaction history | 10+ fields | Mostly numbers/dates | **Table** | Comparison across rows, dense data |
| User profiles | 8-12 fields | Mixed content | **Key-value (detail)** | Single record view, not list |
| Reviews/comments | 4-6 fields | Text-heavy | **Cards** | Each review needs space, hierarchy |
| Image gallery | 1 field (URLs) | All images | **Image grid** | Specialized layout for visual content |
| Specifications | 5-15 fields | Simple values | **Key-value** | Two-column layout, easy scanning |
| Feature list | Array of strings | Text-only | **Bullet list** | No need for table/card structure |
| Log entries | 15+ fields | Timestamps, codes | **Table** | Chronological, need sorting/filtering |

### Detailed Heuristics

**Use Cards when:**
- Array items have 3-8 fields
- At least one field is an image URL
- Contains rich text content (description >100 chars)
- Field named "review", "comment", "post", "article"
- User needs to scan visually (not compare numerically)

**Use Table when:**
- Array items have 9+ fields
- Most fields are numbers, dates, or short codes
- Visual comparison across rows is important
- No images or rich text content
- Data is dense (transactional, logs, analytics)

**Use Key-Value (Detail View) when:**
- Rendering a single object (not array)
- 5-15 fields with mixed types
- Some fields are primary (name, image), others secondary
- Natural two-column layout (label: value)

**Use Image Grid when:**
- Array of primitive strings (not objects)
- 100% of items are image URLs
- Field named "images", "gallery", "photos"

**Use Bullet List when:**
- Array of strings (not objects)
- Strings are sentence-like (>20 chars)
- Field named "features", "benefits", "highlights"

**Use Tag Chips when:**
- Array of short strings (<20 chars)
- Field named "tags", "categories", "keywords"

### Threshold Values

Concrete numbers for decision boundaries:

```typescript
// Card vs Table threshold
const CARD_FIELD_COUNT_MAX = 8
const TABLE_FIELD_COUNT_MIN = 9

// Gallery detection
const GALLERY_IMAGE_THRESHOLD = 1.0 // 100% of items are images

// Rich content detection
const RICH_TEXT_MIN_LENGTH = 100 // chars
const HAS_IMAGE = true

// Card suitability score
function getCardScore(itemSchema: ObjectSchema): number {
  let score = 0
  const fieldCount = itemSchema.fields.size

  // Field count scoring (sweet spot: 4-6 fields)
  if (fieldCount >= 3 && fieldCount <= 6) score += 40
  else if (fieldCount <= 8) score += 20
  else score -= (fieldCount - 8) * 5 // penalty for too many fields

  // Visual richness
  if (hasImageField(itemSchema)) score += 30
  if (hasRichTextField(itemSchema)) score += 20

  // Semantic hints (field names)
  const itemName = getParentFieldName() // e.g., "reviews", "products"
  if (/review|comment|post|article|product|user|item/i.test(itemName)) score += 10

  return score
}

// Decision: score > 50 → cards; score < 50 → table
```

## UX Patterns from Ecommerce Product Detail Pages

Proven patterns from ecommerce that apply to API detail views.

### Layout Pattern: Vertical Accordions > Horizontal Tabs

**Research finding:** 27% of users overlook horizontal tabs; only 8% overlook vertical sections ([Baymard Institute](https://baymard.com/research/product-page)).

**Apply to api2ui:**
- When detail view has >15 fields, organize into collapsible vertical sections
- Never use horizontal tabs for primary content organization
- Accordion sections allow simultaneous viewing (expand multiple sections)
- Mobile-friendly: vertical scrolling is natural, horizontal swiping is not

**Section structure:**
```
[Hero Image - Full Width]
[Primary Fields - Always Visible]
  Name/Title (text-xl font-bold)
  Price (text-2xl)
  Short Description (text-base)

▼ [Section: Details - Expanded]
  Secondary fields...

▽ [Section: Specifications - Collapsed]
  Key-value pairs...

▽ [Section: Reviews - Collapsed]
  Review cards...

▽ [Section: Technical Details - Collapsed]
  IDs, timestamps, metadata...
```

### Hero Image + Overview + Sections Pattern

**Structure observed in top ecommerce sites:**
1. **Above the fold:** Hero image (left) + name/price/short desc (right)
2. **Below hero:** Key features as bullet points or badges
3. **Expandable sections:** Long description, specifications, reviews, Q&A

**Apply to api2ui detail views:**
- First image field → hero position (full-width or left column)
- Name/title + 2-3 most important fields → always visible overview
- Remaining fields → grouped into logical sections below

### Truncated Content with "Show More"

**Pattern:** Long text fields (descriptions, reviews) are truncated to 3-4 lines with "Show more" button.

**Apply to api2ui:**
- Text content >300 chars: show first 200-250 chars + "... Show more"
- Arrays with >10 items: show first 5-8 + "Show all (23 reviews)"
- Prevents detail views from becoming overwhelming data dumps

### "Best For" / Quick Info Pills

**Pattern:** Badges or pills near the overview communicate key attributes quickly.

**Apply to api2ui:**
- Status field → colored badge (active=green, pending=yellow, inactive=gray)
- Tags array → horizontal row of tag pills
- Boolean features → checkmark list ("✓ Free shipping", "✓ In stock")

## Real-World Examples from Tools

How production tools handle smart component selection.

### Airtable

**Smart field type detection:**
- Automatically detects field types on data import: email, phone, URL, attachment, checkbox
- User can override detected type via dropdown
- Rich field types: single select (dropdown), multi-select (chips), rating (stars), attachment (file upload)

**Lessons for api2ui:**
- Auto-detect but always allow override
- Provide rich component types beyond basic string/number (badges, ratings, chips)
- Detection is helpful for initial setup but should never be forced

### Retool

**Component library:**
- 100+ pre-built components with smart defaults
- Table component auto-detects column types (text, number, link, image, badge)
- Form inputs auto-select based on field name (email → email validation, phone → phone formatting)

**Lessons for api2ui:**
- Component variety matters (current: table/cards/detail; needed: badges, pills, ratings, chips)
- Column-level smart detection in tables (image columns get thumbnails)
- Context matters: same field renders differently in table vs detail view

### Hasura / Admin Panel Generators

**Auto-generated UIs from GraphQL schema:**
- Arrays of objects → table with inline editing
- Relationships → nested detail views or foreign key dropdowns
- Enums → dropdowns (in forms) or badges (in read views)

**Lessons for api2ui:**
- Schema hints (if available via OpenAPI) are valuable
- Relationships are hard without schema (api2ui must infer from field names)
- Read vs write contexts: same data, different components (dropdown vs badge)

### Low-Code Builders (Appsmith, Retool, Budibase)

**Common patterns:**
- Drag-drop component placement (NOT applicable to api2ui's auto-render approach)
- Data binding with auto-suggested field mappings (applicable!)
- Template layouts for common use cases (list-detail, form-table, dashboard)

**Lessons for api2ui:**
- Auto-suggest but don't force mappings
- Template approach: "Product Page" layout = hero image + specs + reviews sections
- Field mapping UI can help users correct bad auto-detection

## Feature Dependencies and Build Order

How features relate and recommended implementation sequence.

```
v1.2 (Shipped):
  Parameter type inference (dates, emails, arrays)
  Parameter grouping by prefix
    ↓
v1.3 Smart Default Selection:
  Semantic field name detection (reviews, ratings, prices)
    ↓
    ├─→ Field importance scoring (name + type + data presence)
    ├─→ Array shape heuristics (card vs table decision)
    └─→ Component type recommendations
    ↓
  Auto-section grouping (prefix + semantic clustering)
    ↓
    ├─→ Vertical accordion sections
    └─→ Hero image + overview structure
    ↓
  Context-aware components (badges, pills, ratings)
    ↓
  Gallery detection (array of image URLs)
```

**Critical path for v1.3:**
1. **Semantic field detection** (foundation) — pattern library for field names
2. **Field importance scoring** (core value) — primary/secondary/tertiary ranking
3. **Array shape heuristics** (key differentiator) — smart card vs table
4. **Auto-section grouping** (high impact) — organized detail views
5. **Context-aware components** (polish) — badges, ratings, chips

**Can be done in parallel:**
- Gallery detection (independent feature)
- Price/currency formatting (independent enhancement)
- Rating component (new component type)

**Defer to v1.4:**
- Smart tab generation (requires user research on categorization)
- Date range pairing (complex relationship detection)
- ML-based importance scoring (overkill for v1.3)

## Complexity Notes

### Low Complexity (1-2 days)
- Field name pattern matching (regex library)
- Price/currency formatting (Intl.NumberFormat)
- Hero image in detail views (extend v1.1 pattern)
- Tag chip rendering (new component, simple)
- Status badge rendering (new component, simple)

### Medium Complexity (3-5 days)
- Array shape heuristics (card vs table scoring algorithm)
- Field importance scoring (combine multiple signals)
- Prefix-based auto-grouping (parse field names, group, render sections)
- Context-aware component selection (match patterns to component types)
- Gallery detection (array analysis + image URL detection)

### High Complexity (5-10 days)
- Semantic field clustering (relationship analysis without schema)
- Smart tab generation (categorization logic + tab UI)
- Vertical accordion sections (new UI pattern, animation, state management)
- Composite pattern matching (multi-signal inference)
- Rating/review specialized layouts (new component + detection)

## Success Criteria

v1.3 research is complete when these questions are answered:

- [x] What semantic patterns should trigger different components? — Field names (reviews→cards, specs→key-value) + data shape (3-6 fields→cards, 10+→table)
- [x] How do you determine field importance? — Score based on name (40%), visual richness (25%), data presence (20%), position (15%)
- [x] When should fields be auto-grouped into sections? — Shared prefix (billing*, shipping*) OR semantic cluster (email+phone+address→"Contact")
- [x] What are the heuristics for table vs cards? — Field count (≤8→cards, ≥9→table) + images/rich text favor cards
- [x] How should complex detail views be organized? — Vertical accordions (NOT tabs), hero image + overview + expandable sections
- [x] What component types are needed beyond table/cards? — Badges (status), pills (tags), ratings (stars), image grids, bullet lists, key-value
- [x] What are the anti-patterns to avoid? — Horizontal tabs (27% miss content), treating all arrays identically, no override escape hatch

## Sources

### Primary (HIGH confidence)

#### Design Systems & Component Libraries
- [Retool vs Appsmith: 2025 Comparison](https://www.jetadmin.io/appsmith-vs-retool) — Low-code builders with 100+ smart components
- [Appsmith Platform Guide](https://www.akveo.com/blog/appsmith-platform-guide) — 45+ pre-built components with customization
- [Airtable Field Types](https://support.airtable.com/docs/supported-field-types-in-airtable-overview) — Auto-detection and rich field types
- [Hasura GraphQL Schema](https://hasura.io/docs/2.0/schema/overview/) — Auto-generated UI from schema

#### UX Patterns & Research
- [Table vs List vs Cards: Data Display Patterns (2025)](https://uxpatterns.dev/pattern-guide/table-vs-list-vs-cards) — When to use each pattern
- [Large Data Display: Cards or Table?](https://bootcamp.uxdesign.cc/when-to-use-which-component-a-case-study-of-card-view-vs-table-view-7f5a6cff557b) — Card view vs table view case study
- [RedUX: Cards versus Table](https://cwcorbin.medium.com/redux-cards-versus-table-ux-patterns-1911e3ca4b16) — UX patterns comparison

#### Ecommerce Product Detail Pages
- [Product Page UX Best Practices 2025](https://baymard.com/blog/current-state-ecommerce-product-page-ux) — Baymard Institute research
- [Product Detail Page Tabs UX](https://medium.com/@pio.oleksy/are-you-using-tabs-on-the-product-detail-page-for-organizing-content-013dea4e1e83) — 27% overlook horizontal tabs
- [Product Details Page Research](https://baymard.com/research/product-page) — Comprehensive UX study
- [Product Detail Pages Optimization Guide](https://www.mobiloud.com/blog/product-detail-pages-pdp-ecommerce) — Layout patterns and organization

#### Semantic Data & Field Detection
- [The Semantic Value of Schema Markup in 2025](https://www.schemaapp.com/schema-markup/the-semantic-value-of-schema-markup-in-2025/) — Schema.org for structured data
- [Named Entity Recognition Guide](https://www.geeksforgeeks.org/nlp/named-entity-recognition/) — Pattern recognition techniques
- [From Words to Meaning: Semantic Analysis in NLP](https://www.mindwalkai.com/blog/from-words-to-meaning-exploring-semantic-analysis-in-nlp) — Semantic understanding approaches

### Secondary (MEDIUM confidence)

#### Auto-Grouping & Field Organization
- [Field Groups - Pipedrive](https://support.pipedrive.com/en/article/field-groups) — Organize related custom fields
- [Grouped Fields on Object Detail Page](https://github.com/twentyhq/twenty/issues/10453) — CRM field grouping patterns
- [Everlaw Auto-Detection](https://support.everlaw.com/hc/en-us/articles/204913069-Project-Settings-Metadata-Metadata-Fields-Aliases-Editable-Metadata-and-Other-Settings) — Automatic field detection

#### Tabs & Navigation Patterns
- [Nested Tab UI Examples](https://www.designmonks.co/blog/nested-tab-ui) — Tab design guidelines
- [Tabs UX: Best Practices](https://www.eleken.co/blog-posts/tabs-ux) — When to use tabs (and when not to)
- [Carbon Design System Forms](https://carbondesignsystem.com/patterns/forms-pattern/) — Form grouping patterns
- [Tabbed Interface Design Pattern](https://design.canada.ca/common-design-patterns/tabbed-interface.html) — Government UX guidelines

#### Admin Panel & Form Generation
- [AI Schema Generator 2025](https://www.index.dev/blog/ai-tools-for-database-schema-generation-optimization) — Database schema inference
- [Schema Evolution Guide](https://www.upsolver.com/blog/addressing-schema-evolution-automatically) — Automatic schema detection
- [Dynamically Create Forms from JSON](https://surveyjs.io/stay-updated/blog/dynamically-create-forms-from-json-schema) — Form generation patterns

#### Product Page Design
- [Product Pages in 2026](https://www.bigcommerce.com/articles/ecommerce/product-page-examples/) — Design examples and inspiration
- [15 Winning Product Page Examples](https://wisernotify.com/blog/product-page/) — Layout patterns
- [20 Product Page Best Practices](https://www.optimonk.com/product-page-best-practices/) — Conversion-focused design

### Tertiary (LOW confidence)

#### Generative UI & AI
- [Complete Guide to Generative UI Frameworks 2026](https://medium.com/@akshaychame2/the-complete-guide-to-generative-ui-frameworks-in-2026-fde71c4fa8cc) — AI-driven component selection
- [Top 10 AI Data Visualization Tools 2026](https://www.fusioncharts.com/blog/top-ai-data-visualization-tools/) — AI for smart insights

## Metadata

**Confidence breakdown:**
- Semantic patterns (field name matching): HIGH — Standard across Airtable, Retool, admin generators
- Data shape heuristics (card vs table): MEDIUM-HIGH — Research-backed but thresholds need field testing
- Auto-grouping (prefix/semantic): MEDIUM — Common in CRMs but complex to get right
- Vertical accordions over tabs: HIGH — Baymard research 27% vs 8% overlook rate
- Component variety (badges, ratings, chips): HIGH — Table stakes in modern admin UIs

**Research date:** 2026-02-07
**Valid until:** ~30 days (field testing will inform threshold tuning)
**Recommended validation:** User test with 3-5 real APIs to tune thresholds and pattern matching
