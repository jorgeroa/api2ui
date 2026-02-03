# Phase 5: Smart Visual Defaults - Research

**Researched:** 2026-02-02
**Domain:** Image detection, URL pattern matching, field classification, typography hierarchy, React image rendering
**Confidence:** HIGH

## Summary

Phase 5 aims to make data "look good out of the box" by automatically detecting and rendering images, establishing visual hierarchy through typography, and providing hero images in card views. Research reveals that this requires three main technical capabilities: (1) intelligent URL pattern matching to detect image URLs by file extension and CDN patterns, (2) field classification heuristics to identify primary fields like "name" or "title" for typography hierarchy, and (3) responsive image rendering with proper error handling and performance optimization.

The existing codebase already has foundational URL detection (`/^https?:\/\//i` in PrimitiveRenderer) and render mode switching infrastructure (componentType overrides in ConfigStore), making this phase largely about enhancing detection patterns and applying smart defaults rather than building new rendering architecture.

**Primary recommendation:** Build image detection utilities using file extension patterns (.jpg, .png, .gif, .webp, .svg, .avif) with optional CDN domain matching, implement field classification by checking common name patterns ('name', 'title', 'label', 'id'), and enhance renderers to apply these defaults automatically while preserving existing override mechanisms.

## Standard Stack

The implementation uses the existing React + TypeScript + Tailwind CSS stack without requiring additional libraries for core functionality.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2 | UI rendering with hooks | Already in use, native lazy loading support |
| TypeScript | 5.9 | Type-safe utilities | Already in use, strict mode enabled |
| Tailwind CSS | 4.1 | Typography hierarchy classes | Already in use, design tokens via @theme |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @headlessui/react | 2.2.9 | Accessible UI primitives | Already in use for dialogs/disclosures |
| Zustand | 5.0.11 | State management | Already in use for ConfigStore |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native browser image handling | react-lazy-load-image-component | Library adds 3+ dependencies for features already available natively via `loading="lazy"` attribute (HIGH browser support in 2026) |
| Manual CDN pattern matching | unpic library | unpic provides 28+ CDN provider detection but adds bundle size; manual matching of common patterns (Cloudinary, Imgix domains) is sufficient for v1.1 |
| Custom field classification | Schema-based metadata | Field name heuristics are simpler and work without schema changes; can enhance later with OpenAPI x-extensions |

**Installation:**
```bash
# No new dependencies required for core functionality
# Optional: npm install unpic (if comprehensive CDN support needed)
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── utils/
│   ├── imageDetection.ts    # Image URL detection utilities
│   ├── fieldClassifier.ts   # Field name classification (primary/secondary)
│   └── cdnPatterns.ts       # CDN domain patterns (optional)
├── components/
│   ├── renderers/
│   │   ├── PrimitiveRenderer.tsx    # Enhanced with auto-image detection
│   │   ├── CardListRenderer.tsx     # Enhanced with hero image detection
│   │   ├── TableRenderer.tsx        # Enhanced with thumbnail rendering
│   │   └── DetailRenderer.tsx       # Enhanced with typography hierarchy
```

### Pattern 1: Image URL Detection

**What:** Multi-stage detection that checks file extensions first, then optionally validates CDN domains
**When to use:** In PrimitiveRenderer before deciding render mode, in field classification to identify image fields
**Example:**
```typescript
// File extension detection (HIGH confidence)
function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (!/^https?:\/\//i.test(url)) return false

  // Check file extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
  const urlLower = url.toLowerCase()
  return imageExtensions.some(ext => urlLower.includes(ext))
}

// Optional: CDN domain validation (MEDIUM confidence)
function isImageCdn(url: string): boolean {
  const cdnDomains = [
    'cloudinary.com',
    'imgix.net',
    'images.unsplash.com',
    'res.cloudinary.com',
    'cdn.shopify.com'
  ]
  return cdnDomains.some(domain => url.includes(domain))
}
```

### Pattern 2: Field Classification for Typography Hierarchy

**What:** Classify fields as "primary" (name/title/label) or "secondary" (all others) based on field name patterns
**When to use:** In CardListRenderer for title detection, in DetailRenderer for typography styling
**Example:**
```typescript
// Primary field detection (already exists in CardListRenderer as getItemTitle)
function isPrimaryField(fieldName: string): boolean {
  const primaryPatterns = ['name', 'title', 'label', 'heading']
  const nameLower = fieldName.toLowerCase()
  return primaryPatterns.some(pattern => nameLower.includes(pattern))
}

// Apply typography classes based on classification
function getFieldTypographyClasses(fieldName: string, isLabel: boolean): string {
  const isPrimary = isPrimaryField(fieldName)

  if (isLabel) {
    return isPrimary
      ? 'text-base font-semibold text-gray-700'  // Primary labels
      : 'text-sm font-medium text-gray-600'      // Secondary labels
  }

  return isPrimary
    ? 'text-lg font-bold text-gray-900'          // Primary values
    : 'text-base text-gray-800'                  // Secondary values
}
```

### Pattern 3: Hero Image Detection in Cards

**What:** Find the first image-URL field in an object and display it prominently at the top of cards
**When to use:** In CardListRenderer to enhance card layouts with visual appeal
**Example:**
```typescript
function getFirstImageField(
  item: Record<string, unknown>,
  schema: ObjectTypeSignature
): [string, string] | null {
  for (const [fieldName, fieldDef] of schema.fields.entries()) {
    if (fieldDef.type.kind === 'primitive' && fieldDef.type.type === 'string') {
      const value = item[fieldName]
      if (typeof value === 'string' && isImageUrl(value)) {
        return [fieldName, value]
      }
    }
  }
  return null
}

// In CardListRenderer render:
const heroImage = getFirstImageField(item, schema.items)
return (
  <div className="border rounded-lg overflow-hidden">
    {heroImage && (
      <img
        src={heroImage[1]}
        alt={heroImage[0]}
        loading="lazy"
        className="w-full h-48 object-cover"
        onError={(e) => e.currentTarget.style.display = 'none'}
      />
    )}
    {/* Rest of card content */}
  </div>
)
```

### Pattern 4: Thumbnail Images in Tables

**What:** Render small thumbnail previews for image URL columns without breaking table layout
**When to use:** In TableRenderer when cell value is detected as image URL
**Example:**
```typescript
// In TableRenderer cell rendering:
if (fieldDef.type.kind === 'primitive' && typeof value === 'string' && isImageUrl(value)) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={value}
        alt={fieldName}
        loading="lazy"
        className="h-8 w-8 object-cover rounded"
        onError={(e) => e.currentTarget.style.display = 'none'}
      />
      <span className="text-xs text-gray-500 truncate" title={value}>
        {value.length > 30 ? '...' + value.slice(-27) : value}
      </span>
    </div>
  )
}
```

### Pattern 5: Full-Width Images in Detail Views

**What:** Render image fields as prominent full-width images in detail views, not just inline thumbnails
**When to use:** In DetailRenderer when rendering primitive image fields
**Example:**
```typescript
// In DetailRenderer for primitive fields:
if (fieldDef.type.kind === 'primitive') {
  const value = obj[fieldName]
  const isImage = typeof value === 'string' && isImageUrl(value)

  if (isImage) {
    return (
      <div key={fieldName} className="space-y-2">
        <div className="text-sm font-medium text-gray-600">
          {displayLabel}
        </div>
        <img
          src={value as string}
          alt={displayLabel}
          loading="lazy"
          className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
          onError={(e) => e.currentTarget.src = ''}
        />
      </div>
    )
  }

  // ... existing primitive rendering
}
```

### Anti-Patterns to Avoid

- **Aggressive auto-detection without escape hatch:** Always allow componentType override to disable auto-image rendering if URLs aren't actually images
- **Ignoring image load errors:** Always provide onError handlers to gracefully hide broken images or show fallback
- **Heavy CDN libraries for simple detection:** File extension matching catches 95%+ of image URLs; avoid unpic unless comprehensive CDN transformation is needed
- **Layout shift from images:** Specify container classes with fixed/max heights to prevent cumulative layout shift (CLS)
- **Eager loading all images:** Use `loading="lazy"` attribute for below-the-fold images to improve initial page load

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lazy loading images | Custom IntersectionObserver logic | Native `loading="lazy"` attribute | Browser-native, 95%+ support in 2026, handles viewport detection automatically |
| Image CDN URL detection | Manual regex for all 28+ CDNs | unpic library (if needed) | Maintains 28+ CDN patterns, handles edge cases, but only use if comprehensive CDN support required |
| Image format detection | Manual MIME type checking | File extension suffix matching | Simpler, more reliable for URL-based detection, avoids network requests |
| Broken image handling | Complex fallback chains | Single `onError` handler with hide/fallback | One-liner solution prevents infinite loops and handles most cases |

**Key insight:** Browser-native features (loading="lazy", onError) handle 90% of image rendering concerns. Don't over-engineer detection—file extension matching is sufficient and avoids false positives from query parameters or CDN transformation URLs.

## Common Pitfalls

### Pitfall 1: False Positives from Query Parameters

**What goes wrong:** URLs like `https://api.example.com/items?format=json` get misclassified as images if naive `.json` extension check exists
**Why it happens:** Simple extension check doesn't distinguish between path extensions and query parameters
**How to avoid:** Extract the pathname before checking extensions, or use more specific pattern: check that extension appears before `?` or at end of URL
**Warning signs:** Non-image URLs rendering as broken images, especially with API endpoints containing format parameters

```typescript
// BAD: Checks entire URL including query params
url.endsWith('.jpg') // Matches "api.com/data?type=.jpg"

// GOOD: Extract pathname first
const pathname = new URL(url).pathname
pathname.endsWith('.jpg') // Only matches actual path extensions
```

### Pitfall 2: Cumulative Layout Shift (CLS) from Lazy-Loaded Images

**What goes wrong:** Images popping in cause content to jump around, poor Core Web Vitals score
**Why it happens:** Browser doesn't know image dimensions until loaded, no space reserved
**How to avoid:** Use fixed height containers or aspect-ratio CSS, especially in cards and tables
**Warning signs:** Content "jumping" as images load, layout instability during scroll

```typescript
// Cards: Fixed height container
<div className="w-full h-48 bg-gray-100">
  <img src={url} className="w-full h-full object-cover" loading="lazy" />
</div>

// Tables: Fixed dimensions
<img src={url} className="h-8 w-8 object-cover" loading="lazy" />
```

### Pitfall 3: Infinite Error Loops in Image Fallbacks

**What goes wrong:** Image fails to load, onError sets fallback, fallback also fails, repeat forever
**Why it happens:** Not resetting onError handler before changing src
**How to avoid:** Set `onError={null}` or use display:none instead of changing src
**Warning signs:** Console flooded with image load errors, browser performance degradation

```typescript
// BAD: Can cause infinite loop if fallback also fails
<img onError={(e) => e.currentTarget.src = 'fallback.jpg'} />

// GOOD: Hide on error, no second request
<img onError={(e) => e.currentTarget.style.display = 'none'} />

// ALSO GOOD: Reset handler before changing src
<img onError={(e) => {
  e.currentTarget.onError = null
  e.currentTarget.src = 'fallback.jpg'
}} />
```

### Pitfall 4: Treating All String URLs as Potential Images

**What goes wrong:** Every URL field renders with image detection overhead, performance impact with large datasets
**Why it happens:** Overly eager detection applied to every string primitive
**How to avoid:** Only run detection for fields likely to be images (check field name hints first) or apply detection lazily on render
**Warning signs:** Slow table rendering with many URL columns, unnecessary regex operations

```typescript
// BAD: Check every string value
if (typeof value === 'string') {
  const isImage = isImageUrl(value) // runs on every string
}

// GOOD: Quick field name check first (optional optimization)
const likelyImageField = /image|photo|picture|avatar|thumbnail|icon/i.test(fieldName)
if (likelyImageField && typeof value === 'string') {
  const isImage = isImageUrl(value)
}
```

### Pitfall 5: Not Providing Alt Text for Accessibility

**What goes wrong:** Screen readers can't describe images, fails WCAG accessibility standards
**Why it happens:** Using empty string or forgetting alt attribute entirely
**How to avoid:** Use field name or derived label as alt text minimum, better if actual content description available
**Warning signs:** Accessibility audit failures, poor experience for screen reader users

```typescript
// BAD: No alt text
<img src={url} />

// ACCEPTABLE: Field name as alt
<img src={url} alt={fieldName} />

// BEST: Meaningful description
<img src={url} alt={`${itemTitle} - ${fieldLabel}`} />
```

## Code Examples

Verified patterns from research and existing codebase analysis:

### Auto-Detect Image URLs in PrimitiveRenderer

```typescript
// Enhance existing PrimitiveRenderer with auto-detection
// File: src/components/renderers/PrimitiveRenderer.tsx

function isImageUrl(value: string): boolean {
  if (!value || typeof value !== 'string') return false
  if (!/^https?:\/\//i.test(value)) return false

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
  const urlLower = value.toLowerCase()

  // Check pathname to avoid query parameter false positives
  try {
    const pathname = new URL(value).pathname.toLowerCase()
    return imageExtensions.some(ext => pathname.endsWith(ext) || pathname.includes(ext + '?'))
  } catch {
    // Fallback for invalid URLs (shouldn't happen after regex check)
    return imageExtensions.some(ext => urlLower.includes(ext))
  }
}

// In PrimitiveRenderer, enhance URL handling:
if (isURL(data)) {
  const config = fieldConfigs[path]
  const renderMode = config?.componentType

  // Auto-detect images and default to image mode (unless overridden)
  const shouldRenderAsImage = isImageUrl(data) && renderMode !== 'link' && renderMode !== 'text'

  if (shouldRenderAsImage || renderMode === 'image') {
    if (imageError) {
      return <span className="text-gray-500" title={data}>{data}</span>
    }
    return (
      <img
        src={data}
        alt={fieldName}
        loading="lazy"
        className="max-h-48 object-contain"
        onError={() => setImageError(true)}
      />
    )
  }

  // ... existing link/text rendering
}
```

### Hero Images in Cards

```typescript
// Enhance CardListRenderer with hero image detection
// File: src/components/renderers/CardListRenderer.tsx

function getFirstImageField(
  item: Record<string, unknown>,
  fields: Map<string, FieldDefinition>
): string | null {
  for (const [fieldName, fieldDef] of fields.entries()) {
    if (fieldDef.type.kind === 'primitive') {
      const value = item[fieldName]
      if (typeof value === 'string' && isImageUrl(value)) {
        return value
      }
    }
  }
  return null
}

// In CardListRenderer render:
const heroImageUrl = getFirstImageField(obj, schema.items.fields)

return (
  <div
    key={index}
    onClick={() => setSelectedItem(item)}
    className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all"
  >
    {/* Hero image at top */}
    {heroImageUrl && (
      <div className="w-full h-48 bg-gray-100">
        <img
          src={heroImageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => e.currentTarget.style.display = 'none'}
        />
      </div>
    )}

    {/* Card header with title */}
    <div className="p-4">
      <div className="font-semibold text-lg mb-3 text-text border-b border-border pb-2">
        {title}
      </div>

      {/* Card content: key-value pairs */}
      <div className="space-y-2">
        {displayFields.map(([fieldName, fieldDef]) => {
          // Skip the field if it's already shown as hero image
          const value = obj[fieldName]
          if (typeof value === 'string' && value === heroImageUrl) {
            return null
          }

          // ... rest of field rendering
        })}
      </div>
    </div>
  </div>
)
```

### Thumbnail Images in Tables

```typescript
// Enhance TableRenderer with thumbnail rendering
// File: src/components/renderers/TableRenderer.tsx

// In cell rendering logic:
{visibleColumns.map(([fieldName, fieldDef]) => {
  const value = row[fieldName]
  const cellPath = `${path}[${rowIndex}].${fieldName}`

  // Check if this is an image URL
  const isImage = fieldDef.type.kind === 'primitive' &&
                  typeof value === 'string' &&
                  isImageUrl(value)

  return (
    <div
      key={fieldName}
      className="px-4 py-2 border-r border-border flex items-center overflow-hidden"
      style={{ width: columnWidth, minWidth: columnWidth, height: '40px' }}
    >
      {isImage ? (
        <div className="flex items-center gap-2 w-full">
          <img
            src={value as string}
            alt={fieldName}
            loading="lazy"
            className="h-8 w-8 rounded object-cover flex-shrink-0"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
          <span className="text-xs text-gray-500 truncate" title={value as string}>
            {(value as string).split('/').pop() || value}
          </span>
        </div>
      ) : (
        <div className="truncate w-full">
          {fieldDef.type.kind === 'primitive' ? (
            <PrimitiveRenderer
              data={value}
              schema={fieldDef.type}
              path={cellPath}
              depth={depth + 1}
            />
          ) : (
            <CompactValue data={value} />
          )}
        </div>
      )}
    </div>
  )
})}
```

### Typography Hierarchy in Detail Views

```typescript
// Enhance DetailRenderer with typography hierarchy
// File: src/components/renderers/DetailRenderer.tsx

function isPrimaryField(fieldName: string): boolean {
  const primaryPatterns = ['name', 'title', 'label', 'heading', 'subject']
  const nameLower = fieldName.toLowerCase()
  return primaryPatterns.some(pattern => nameLower === pattern || nameLower.startsWith(pattern))
}

// In field rendering:
const isPrimary = isPrimaryField(fieldName)

// For primitive fields:
if (fieldDef.type.kind === 'primitive') {
  const isImage = typeof value === 'string' && isImageUrl(value as string)

  if (isImage) {
    // Full-width image rendering
    return (
      <div key={fieldName} className="space-y-2">
        <div className={`text-sm font-medium text-gray-600`}>
          {displayLabel}
        </div>
        <img
          src={value as string}
          alt={displayLabel}
          loading="lazy"
          className="w-full max-h-96 object-contain rounded-lg border border-gray-200 bg-gray-50"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }

  // Text field rendering with typography hierarchy
  const fieldContent = (
    <div className="grid grid-cols-[auto_1fr] gap-x-6">
      <div className={isPrimary
        ? "text-base font-semibold text-gray-700 py-1"  // Primary label
        : "text-sm font-medium text-gray-600 py-1"      // Secondary label
      }>
        {displayLabel}:
      </div>
      <div className={isPrimary
        ? "py-1 text-lg font-bold text-gray-900"        // Primary value
        : "py-1 text-base text-gray-800"                // Secondary value
      }>
        <PrimitiveRenderer
          data={value}
          schema={fieldDef.type}
          path={fieldPath}
          depth={depth + 1}
        />
      </div>
    </div>
  )

  // ... wrap with FieldControls if in configure mode
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Eager image loading | Native `loading="lazy"` | 2020-2021 | 95%+ browser support in 2026, eliminates need for IntersectionObserver libraries |
| Manual aspect ratio boxes | CSS `aspect-ratio` property | 2021 | Simpler layout preservation, no padding-hack needed |
| External lazy-load libraries | Browser-native features | 2020-present | Reduced bundle size, better performance, simpler code |
| JPEG/PNG only | WebP/AVIF support | 2020-2026 | 30-50% smaller file sizes, broader adoption of modern formats |

**Deprecated/outdated:**
- react-lazyload (popular 2016-2020): Browser-native loading="lazy" supersedes for most use cases
- IntersectionObserver polyfills: 97%+ browser support natively in 2026
- Padding-based aspect ratio hack: CSS aspect-ratio property is standard

## Open Questions

Things that couldn't be fully resolved:

1. **Should we implement comprehensive CDN URL transformation support?**
   - What we know: unpic library provides 28+ CDN provider detection and URL transformation
   - What's unclear: Whether users will need to transform CDN URLs (resize, format conversion) or just detect and display them
   - Recommendation: Start with detection-only using file extensions and common CDN domain patterns. Add unpic in Phase 6 or 8 if transformation features requested (e.g., "resize Cloudinary images to thumbnails")

2. **How aggressive should auto-detection be in overriding existing configurations?**
   - What we know: Existing componentType overrides should be respected, but default behavior is unclear
   - What's unclear: Should image auto-detection apply only to fields with no prior configuration, or should it set a new default that users can then override?
   - Recommendation: Apply auto-detection as initial default only—if `componentType` is undefined and URL matches image pattern, treat as 'image'. If user has explicitly set componentType='text' or 'link', respect that choice.

3. **Should field classification support custom patterns via configuration?**
   - What we know: Hard-coded patterns ['name', 'title', 'label'] cover 80%+ of real APIs
   - What's unclear: Whether power users would want to customize which fields are considered "primary"
   - Recommendation: Hard-code patterns for v1.1. If Phase 6 or 8 adds per-element config, consider allowing users to tag fields as "primary" manually.

## Sources

### Primary (HIGH confidence)

- [MDN: Image file types and formats](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types) - Comprehensive guide to web image formats
- [Unpic library](https://unpic.pics/lib/) - Universal image CDN URL translator with 28+ provider support
- [React Image Optimization - ImageKit](https://imagekit.io/blog/react-image-optimization/) - React best practices for image performance
- [Material Tailwind Typography](https://www.material-tailwind.com/docs/v3/react/typography) - Typography hierarchy patterns with Tailwind

### Secondary (MEDIUM confidence)

- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) - Design tokens and typography patterns
- [HTML Image Fallback Strategies - Sentry](https://blog.sentry.io/fallbacks-for-http-404-images-in-html-and-javascript/) - Error handling for broken images
- [React Card Hero Image Patterns - shadcn/ui](https://www.shadcn.io/patterns/card-standard-4) - Card layout with hero images
- [Image CDN Comparison - Cloudinary vs Imgix](https://cloudinary.com/guides/vs/cloudinary-vs-imgix) - Common CDN URL patterns

### Tertiary (LOW confidence)

- [React Lazy Loading Libraries - Syncfusion](https://www.syncfusion.com/blogs/post/top-react-lazy-loading-libraries) - Library comparison (most superseded by native features)
- [WebP vs AVIF Comparison 2026](https://www.thecssagency.com/blog/best-web-image-format) - Modern image format performance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All capabilities exist in current stack (React 19, TypeScript, Tailwind), no new dependencies required
- Architecture: HIGH - Patterns verified through existing codebase (PrimitiveRenderer, CardListRenderer) and official documentation (MDN, React)
- Pitfalls: HIGH - Common issues well-documented (CLS, lazy loading, error handling) with established solutions

**Research date:** 2026-02-02
**Valid until:** ~60 days (stable domain, image formats and browser features change slowly)
