# Pitfalls Research: v1.2 Smart Parameters & Layout System

**Milestone:** v1.2 - Adding smart parameter handling and layout system to existing api2ui
**Researched:** 2026-02-05
**Confidence:** HIGH (based on web research + existing codebase analysis)

## Summary

This research identifies critical pitfalls when adding smart parameter parsing, type inference, rich form components, parameter persistence, and user-switchable layouts to an existing application. The highest risks lie in: (1) breaking existing OpenAPI parameter handling when introducing raw URL parsing, (2) type inference false positives destroying user trust, (3) localStorage race conditions in multi-tab scenarios, (4) form validation UX that interrupts user flow, and (5) layout state synchronization complexity. Unlike building from scratch, integration pitfalls with existing systems dominate the risk landscape.

---

## Critical Pitfalls (Must Address in Phase 1)

### Pitfall 1: Dual Parameter System Collision

**Risk:** Adding raw URL query string parsing alongside existing OpenAPI parameter system creates two competing sources of truth that conflict and override each other unpredictably.

**What goes wrong:**
- OpenAPI spec defines parameters, but raw URL has different/additional parameters
- ParameterForm initializes with OpenAPI schema, then raw URL values override with incompatible types
- Type coercion fails silently (string "true" vs boolean true, "123" vs number 123)
- User edits form, but raw URL params persist and re-apply on refresh
- Parameter grouping (ddcFilter[*]) conflicts with flat OpenAPI param names

**Warning Signs:**
- Form displays wrong values after URL parsing
- Type mismatches between spec (type: integer) and URL value (string "123")
- User edits lost on page refresh
- Parameters appear twice (once from spec, once from URL)
- Bracket notation arrays break existing single-value param handling

**Prevention:**
1. **Single source of truth with merge strategy:** Define clear precedence: OpenAPI schema provides types/validation, raw URL provides values, user edits override both
2. **Type coercion layer:** Create `coerceToSchema(urlValue, schemaType)` function that converts URL strings to correct types before passing to ParameterForm
3. **Parameter reconciliation:** On load, merge OpenAPI params with URL params, marking conflicts with warnings
4. **Separate storage keys:** OpenAPI params in `configStore.parameterSchemas`, URL params in `configStore.urlParameters`, merged view computed
5. **Bracket notation handler:** Parse `ddcFilter[name]=foo&ddcFilter[age]=25` into nested object before passing to form
6. **Migration path:** Update existing ParameterForm to accept external value source, not just schema defaults

**Code Integration Points:**
- `src/components/forms/ParameterForm.tsx` line 13-25: Initial values logic needs to check URL params first
- `src/services/openapi/parser.ts` line 121-180: parseParameter needs to be aware of URL values
- Need new `src/utils/urlParameters.ts` for parsing with bracket notation support

**Phase:** Phase 1 (Foundation) - This determines parameter architecture for entire v1.2

---

### Pitfall 2: Type Inference False Positives Destroying Trust

**Risk:** Over-aggressive type detection (dates, emails, coordinates, zip codes) produces false positives that break forms, frustrating users and making the "smart" feature feel dumb.

**What goes wrong:**
- String "2024-01-01" detected as date, but it's actually a product code → date picker appears, user can't enter "2024-01-01"
- String matching email regex (test@domain) but it's actually a mention syntax → email validation fails
- Numbers detected as phone/zip but they're IDs → wrong input mask applied
- Coordinate detection on unrelated numeric pairs → map picker appears incorrectly
- ISO 8601 pattern matches non-date strings (e.g., "1234-56-78T90:12:34" is valid regex but invalid date)

**Real-world false positive patterns (from research):**
- ZIP code regex: Matches any 5-digit number (including prices, IDs, years)
- Email regex: Too loose (accepts invalid TLDs) or too strict (rejects valid emails)
- Date detection: ISO pattern matches but Date.parse() returns NaN
- International formats: US patterns don't work globally (zip codes, phone formats vary)

**Consequences:**
- User sees wrong input component, can't enter their data
- Validation rejects valid input
- Users distrust smart detection, want manual override
- Support burden: "Why is this showing a date picker?"

**Warning Signs:**
- Bug reports: "Can't enter my product code, keeps showing date picker"
- Users immediately switch component type after form appears
- High rate of manual component type overrides
- Validation errors on inputs that look valid

**Prevention:**
1. **Conservative detection thresholds:** Only infer specialized types with HIGH confidence
   - Date: ISO 8601 pattern + Date.parse() success + reasonable range (1970-2100)
   - Email: Relaxed regex + domain TLD check (not just any @domain pattern)
   - Phone: Require country code or formatting characters, not just 10 digits
   - Zip: Require context (field name contains "zip", "postal", "code")
2. **Multi-signal validation:** Use multiple signals for confidence
   - Field name hints: "email", "date", "phone", "zip" in param name
   - Value format: Matches expected pattern
   - Schema hints: OpenAPI format field (format: "email")
   - Sample consistency: If analyzing multiple values, all match pattern
3. **Confidence levels:** Implement LOW/MEDIUM/HIGH confidence
   - HIGH: Show specialized component
   - MEDIUM: Show specialized component with easy toggle to text
   - LOW: Default to text input, suggest alternative in placeholder
4. **Escape hatch UI:** Always show component type switcher badge (existing from v1.1)
5. **Negative patterns:** Maintain list of false positive patterns
   - Don't detect date on: product codes, version numbers, serial numbers
   - Don't detect email on: @mentions without domain extension
   - Don't detect phone on: pure numbers without formatting
6. **Test suite for false positives:** Include known problematic values
   - "2024-01-01" (could be product code or date)
   - "test@localhost" (valid email but no TLD)
   - "12345" (zip or ID or price?)

**Code Implementation:**
```typescript
// src/utils/typeInference.ts
interface TypeInferenceResult {
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'zip'
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  reasons: string[] // Why this type was chosen
}

function inferParameterType(
  name: string,
  value: string | undefined,
  schemaType?: string,
  schemaFormat?: string
): TypeInferenceResult {
  const signals: string[] = []

  // Schema hints are HIGHEST confidence
  if (schemaFormat) {
    signals.push(`schema format: ${schemaFormat}`)
    return { type: schemaFormat as any, confidence: 'HIGH', reasons: signals }
  }

  // Field name hints (MEDIUM confidence)
  const nameLower = name.toLowerCase()
  if (nameLower.includes('email')) {
    signals.push('field name contains "email"')
    // Still validate value if provided
    if (value && isLikelyEmail(value)) {
      return { type: 'email', confidence: 'HIGH', reasons: [...signals, 'value matches email pattern'] }
    }
    return { type: 'email', confidence: 'MEDIUM', reasons: signals }
  }

  // Value pattern matching (LOW to MEDIUM confidence)
  if (value) {
    if (isDefinitelyDate(value)) {
      return { type: 'date', confidence: 'MEDIUM', reasons: ['value is valid ISO date'] }
    }
  }

  // Default: use schema type or string
  return { type: schemaType || 'string', confidence: 'HIGH', reasons: ['schema definition'] }
}

function isDefinitelyDate(value: string): boolean {
  // More strict than current typeDetection.ts
  const isoPattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/
  if (!isoPattern.test(value)) return false

  const parsed = Date.parse(value)
  if (isNaN(parsed)) return false

  // Reject dates outside reasonable range (avoid false positives like "9999-99-99")
  const year = new Date(parsed).getFullYear()
  if (year < 1970 || year > 2100) return false

  return true
}
```

**Integration with existing code:**
- `src/services/schema/typeDetection.ts`: Current date detection is too loose (line 29-34), add stricter validation
- `src/components/forms/ParameterInput.tsx`: Add confidence indicator in UI for MEDIUM confidence types
- `src/types/schema.ts`: Extend FieldType to include email, phone, zip, etc.

**Phase:** Phase 1 (Type Inference) - Set conservative defaults, can relax later

**Sources:**
- [ZIP code regex false positives](https://www.geopostcodes.com/blog/international-zip-code-validation/)
- [Email regex validation issues](https://www.usebouncer.com/email-regex-pattern/)
- [Testing regex patterns](https://uibakery.io/regex-library/email)

---

### Pitfall 3: localStorage Race Conditions in Multi-Tab Scenarios

**Risk:** Parameter persistence using localStorage creates race conditions when user has multiple tabs open, causing data corruption, lost edits, and cascading overwrites.

**What goes wrong:**
- Tab A saves parameters, Tab B overwrites with old state from before Tab A's save
- Storage events fire between persist operations, reading partial state
- User edits param in Tab A, switches to Tab B, sees stale value, edits again → conflict
- Zustand persist middleware doesn't handle concurrent writes
- Page refresh in one tab triggers storage event in other tabs, resetting their state
- Parameter values become progressively corrupted as tabs fight

**Current vulnerability in api2ui:**
- `src/store/configStore.ts` line 239-258: Uses Zustand persist with localStorage, no multi-tab protection
- No version checking or conflict resolution
- No loaded state to prevent save during restore

**Warning Signs:**
- Bug reports: "My parameters reset when I opened another tab"
- Inconsistent parameter values across tabs
- Parameters revert to old values unexpectedly
- User reports "worked, then broke on refresh"

**Prevention:**
1. **React's useSyncExternalStore approach:** Use storage events to sync across tabs safely
2. **Loaded state guard:** Prevent saves until restoration completes (avoid race during load)
3. **Version tokens:** Include timestamp with each save, reject older versions
4. **Per-URL parameter isolation:** Don't share parameter state globally, scope to endpoint URL
5. **Storage event handling:** Listen for storage events, merge intelligently rather than overwrite
6. **Optimistic locking:** Include edit session ID, detect concurrent edits
7. **Debounced persistence:** Don't save on every keystroke, batch saves to reduce race window

**Code Implementation:**
```typescript
// src/store/parameterStore.ts (NEW - separate from configStore)
interface ParameterState {
  values: Record<string, Record<string, string>> // url -> param name -> value
  version: Record<string, number> // url -> version timestamp
  loaded: boolean
}

// Use version tokens to prevent race conditions
const setParameterValue = (url: string, name: string, value: string) => {
  set((state) => {
    const currentVersion = state.version[url] || 0
    const newVersion = Date.now()

    return {
      values: {
        ...state.values,
        [url]: {
          ...state.values[url],
          [name]: value
        }
      },
      version: {
        ...state.version,
        [url]: newVersion
      }
    }
  })
}

// Handle storage events from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'api2ui-parameters' && e.newValue) {
      const newState = JSON.parse(e.newValue)
      const currentState = get()

      // Merge using version tokens - keep newest values per URL
      const merged = { ...currentState.values }
      for (const [url, newParams] of Object.entries(newState.values)) {
        const currentVersion = currentState.version[url] || 0
        const newVersion = newState.version[url] || 0

        if (newVersion > currentVersion) {
          // Other tab has newer data for this URL
          merged[url] = newParams
        }
      }

      set({ values: merged, version: newState.version })
    }
  })
}
```

**Migration strategy:**
- Move parameter persistence out of configStore into dedicated parameterStore
- Add loaded flag to prevent saves during initial load
- Implement version checking for all parameter updates
- Add storage event listener for cross-tab sync

**Testing:**
- Open two tabs, edit same parameter, verify conflict resolution
- Refresh one tab while editing in another, verify no data loss
- Rapid edits across tabs, verify eventual consistency

**Phase:** Phase 1 (Foundation) - Must be correct before building features on top

**Sources:**
- [localStorage race conditions](https://github.com/simplabs/ember-simple-auth/issues/254)
- [useSyncExternalStore for persistence](https://www.yeti.co/blog/managing-persistent-browser-data-with-usesyncexternalstore)
- [React state persistence guide](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c)

---

### Pitfall 4: Form Validation UX That Interrupts Flow

**Risk:** Aggressive inline validation fires too early, disrupts user input flow, and causes frustration as error messages appear/disappear while typing.

**What goes wrong:**
- Validation fires on every keystroke → error "Invalid email" while user is still typing "user@domain.com"
- User sees "Required field" error before they've had a chance to fill it
- Red borders and error messages distract from form filling (mode switching: fill vs error-correct)
- Success indicators clutter form (green checkmarks everywhere)
- Complex validation (date ranges, parameter dependencies) blocks form submission with unclear errors
- Validation runs on blur, but user tabs to next field → error appears, focus already moved

**Form validation mistakes (from research):**
- Inline validation is ideal AFTER user finishes field, not during typing
- For complex inputs (passwords), instant validation prevents exploration
- Error messages should be explicit, polite, and constructive (not just "Invalid")
- Relying solely on color for errors breaks accessibility
- Success indicators should be minimal (only when context helps)

**Current risk in api2ui:**
- `src/components/forms/ParameterInput.tsx` has no validation UI currently
- Adding validation without UX strategy will default to "validate on change" (bad UX)
- HTML5 required attribute shows browser validation (poor UX)

**Warning Signs:**
- Users complain about "annoying error messages"
- Support asks: "Why is everything red before I've finished typing?"
- Users fill form slower because of constant visual changes
- High form abandonment rate

**Prevention:**
1. **Strategic validation timing:**
   - **During typing:** Only show positive feedback (format hints, character count)
   - **On blur (leaving field):** Show validation errors
   - **On submit:** Show all errors at once with focus on first error
2. **Progressive disclosure:** Show validation rules upfront (before error occurs)
   - Placeholder: "e.g., user@domain.com"
   - Helper text: "5-digit US zip code"
   - Format hint: "YYYY-MM-DD"
3. **Error message quality:**
   - Bad: "Invalid input"
   - Good: "Email must include @ and domain (e.g., user@domain.com)"
   - Bad: "Required"
   - Good: "API key is required to fetch data"
4. **Accessibility:**
   - Use aria-invalid and aria-describedby, not just red color
   - Error icon (not just color change)
   - Screen reader announces errors
5. **Minimal success indicators:** Only show for non-obvious validations
   - Don't show: Green checkmark for filled text field
   - Do show: Green checkmark for "Username available" after async check
6. **Validation debouncing:** Wait 300ms after last keystroke before validating (avoids mid-typing errors)

**Code Implementation:**
```typescript
// src/components/forms/ParameterInput.tsx enhancement
interface ValidationState {
  error?: string
  showError: boolean // Don't show until blur or submit
  touched: boolean
}

function ParameterInput({ parameter, value, onChange }: ParameterInputProps) {
  const [validation, setValidation] = useState<ValidationState>({
    showError: false,
    touched: false
  })

  // Validate on blur, not on change
  const handleBlur = () => {
    setValidation((prev) => ({ ...prev, touched: true, showError: true }))
    const error = validateParameter(parameter, value)
    setValidation((prev) => ({ ...prev, error }))
  }

  // Update value without showing errors
  const handleChange = (newValue: string) => {
    onChange(newValue)
    // Only clear error if field becomes valid (positive feedback)
    const error = validateParameter(parameter, newValue)
    if (!error && validation.touched) {
      setValidation((prev) => ({ ...prev, error: undefined }))
    }
  }

  return (
    <div>
      <label>{parameter.name}</label>

      {/* Helper text BEFORE input (proactive) */}
      {parameter.description && (
        <p className="text-xs text-gray-600 mb-1">{parameter.description}</p>
      )}

      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={getPlaceholderHint(parameter)} // e.g., "user@domain.com"
        aria-invalid={validation.showError && validation.error ? 'true' : 'false'}
        aria-describedby={validation.error ? `${parameter.name}-error` : undefined}
        className={validation.showError && validation.error ? 'border-red-500' : 'border-gray-300'}
      />

      {/* Error appears AFTER blur, not during typing */}
      {validation.showError && validation.error && (
        <p id={`${parameter.name}-error`} className="text-xs text-red-600 mt-1 flex items-center">
          <ErrorIcon className="w-4 h-4 mr-1" />
          {validation.error}
        </p>
      )}
    </div>
  )
}

function validateParameter(param: ParsedParameter, value: string): string | undefined {
  if (param.required && !value) {
    return `${param.name} is required`
  }

  if (param.schema.type === 'email' && value && !isValidEmail(value)) {
    return 'Enter a valid email address (e.g., user@domain.com)'
  }

  if (param.schema.type === 'integer' && value && !Number.isInteger(Number(value))) {
    return 'Must be a whole number'
  }

  // More specific, constructive errors
  if (param.schema.minimum !== undefined && Number(value) < param.schema.minimum) {
    return `Must be at least ${param.schema.minimum}`
  }

  return undefined
}
```

**Form-level validation (on submit):**
```typescript
// src/components/forms/ParameterForm.tsx enhancement
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()

  // Validate all fields
  const errors: Record<string, string> = {}
  for (const param of parameters) {
    const error = validateParameter(param, values[param.name])
    if (error) {
      errors[param.name] = error
    }
  }

  if (Object.keys(errors).length > 0) {
    // Show all errors
    setValidationErrors(errors)
    // Focus first error
    const firstErrorField = parameters.find((p) => errors[p.name])
    document.getElementById(firstErrorField?.name)?.focus()
    return
  }

  onSubmit(values)
}
```

**Phase:** Phase 1 (Smart Forms) - UX patterns must be correct from start

**Sources:**
- [Nielsen Norman Group: 10 Design Guidelines for Errors in Forms](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- [Form validation UX best practices](https://userpeek.com/blog/form-validation-ux-and-best-practices/)
- [Smashing Magazine: Complete Guide to Live Validation UX](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)
- [Accessible form validation](https://www.uxpin.com/studio/blog/accessible-form-validation-best-practices/)

---

### Pitfall 5: Layout State Synchronization Complexity

**Risk:** Adding user-switchable layouts (sidebar, top bar, split view, drawer) creates complex state synchronization between layout choice, panel state, drilldown mode, and parameter visibility, causing conflicts and unpredictable behavior.

**What goes wrong:**
- User switches to "drawer" layout, but panelOpen state is still true from "sidebar" layout → drawer and panel both open
- Layout persists to localStorage, but drilldown mode doesn't → mismatch on reload
- Layout change resets form state (parameter values lost)
- Breadcrumbs render differently per layout, but navigation state not layout-aware → breadcrumbs break
- Layout switching causes re-mount of DynamicRenderer → scroll position lost, API re-fetched
- Multiple layout-related state variables fall out of sync (layout, panelOpen, sidebarCollapsed, drawerOpen)

**Context API performance trap (from research):**
- Putting layout state in Context causes all consumers to re-render on layout change
- High-frequency updates (sidebar resize, drawer drag) in Context = performance death
- Provider hell when layout, theme, panel, navigation each get their own Context

**Current risk in api2ui:**
- `src/store/configStore.ts` has panelOpen and drilldownMode but no layout concept yet
- Adding layout as separate state creates synchronization problem
- No clear relationship between layout choice and panel/drawer behavior

**Warning Signs:**
- Bug reports: "Switched layout, now panel won't close"
- Layout change causes unexpected behavior in other parts of UI
- State variables named `sidebarOpen`, `drawerOpen`, `panelVisible` that should be mutually exclusive
- Layout change re-fetches data or resets form
- Users avoid switching layouts because "things break"

**Prevention:**
1. **Single source of truth for layout mode:**
   ```typescript
   type LayoutMode = 'sidebar' | 'topbar' | 'splitview' | 'drawer'

   interface LayoutConfig {
     mode: LayoutMode
     // Derived state is computed, not stored
     showPanel: boolean // Computed from mode + user interaction
     allowDrilldown: boolean // Some layouts may not support panel drilldown
   }
   ```

2. **Derive, don't sync:** Compute dependent values from layout mode
   ```typescript
   // BAD: Multiple state variables that can fall out of sync
   const [layout, setLayout] = useState('sidebar')
   const [panelOpen, setPanelOpen] = useState(false)
   const [drawerOpen, setDrawerOpen] = useState(false)

   // GOOD: Derive behavior from single source
   const [layout, setLayout] = useState('sidebar')
   const isPanelMode = layout === 'sidebar' || layout === 'splitview'
   const isDrawerMode = layout === 'drawer'
   const showPanel = isPanelMode && drilldownMode === 'panel'
   ```

3. **Layout-aware components:** Components adapt to layout, not vice versa
   ```typescript
   function DynamicRenderer({ data, layout }: Props) {
     // Renderer behavior adapts to layout mode
     const breadcrumbPosition = layout === 'topbar' ? 'inline' : 'header'
     const panelVariant = layout === 'splitview' ? 'split' : 'overlay'

     return (
       <LayoutContainer mode={layout}>
         <Breadcrumbs position={breadcrumbPosition} />
         <DataView data={data} />
         {showPanel && <DetailPanel variant={panelVariant} />}
       </LayoutContainer>
     )
   }
   ```

4. **State preservation during layout change:** Prevent re-mount
   ```typescript
   // Use layout as prop, not unmount/remount trigger
   const LayoutContainer = ({ mode, children }) => {
     // Same component tree, different CSS/positioning
     return (
       <div className={layoutClasses[mode]}>
         {children}
       </div>
     )
   }
   ```

5. **Zustand for layout state (not Context):** Avoid re-render hell
   - Layout state changes infrequently (user switches layout)
   - Panel/drawer state may change frequently (open/close/resize)
   - Use Zustand with selector pattern to minimize re-renders
   ```typescript
   // Components subscribe only to what they need
   const layout = useConfigStore((state) => state.layout)
   const panelOpen = useConfigStore((state) => state.panelOpen)
   ```

6. **Layout transition strategy:**
   ```typescript
   const setLayout = (newLayout: LayoutMode) => {
     set((state) => {
       // Reset only layout-specific state, preserve data state
       return {
         layout: newLayout,
         // Close panel if new layout doesn't support it
         panelOpen: newLayout === 'topbar' ? false : state.panelOpen,
         // Update drilldown mode if incompatible
         drilldownMode: newLayout === 'topbar' ? 'page' : state.drilldownMode
       }
     })
   }
   ```

7. **Persist layout mode separately:** Don't overwrite other config
   ```typescript
   // In zustand persist config
   partialize: (state) => ({
     layout: state.layout,
     // Don't persist ephemeral state like panelOpen
     drilldownMode: state.drilldownMode,
     fieldConfigs: state.fieldConfigs,
     // ...other persistent state
   })
   ```

**Code Integration:**
- `src/store/configStore.ts` line 74-82: Add layout mode alongside drilldownMode
- `src/types/config.ts` line 24: Add LayoutMode type
- Create `src/components/layout/LayoutContainer.tsx` for layout switching without re-mount
- Update `src/components/renderers/DynamicRenderer.tsx` to be layout-aware

**Testing:**
- Switch between all layout modes, verify no data loss
- Open panel in sidebar layout, switch to topbar layout, verify panel closes gracefully
- Fill parameter form, switch layout, verify form values preserved
- Drill into detail view, switch layout, verify navigation state preserved

**Phase:** Phase 1 (Layout Foundation) - Architecture must be correct from start

**Sources:**
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025)
- [State Management patterns](https://thelinuxcode.com/state-management-in-react-2026-hooks-context-api-and-redux-in-practice/)
- [Kent C. Dodds: Don't Sync State. Derive It!](https://kentcdodds.com/blog/dont-sync-state-derive-it)
- [React: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

---

## Moderate Pitfalls (Address During Development)

### Pitfall 6: Query String Array Notation Inconsistency

**Risk:** Different APIs use different array parameter conventions (brackets, repeated keys, comma-separated), and supporting one breaks others.

**What goes wrong:**
- PHP-style: `?ids[]=1&ids[]=2&ids[]=3` (bracket notation)
- REST-style: `?ids=1&ids=2&ids=3` (repeated keys)
- CSV-style: `?ids=1,2,3` (comma-separated)
- Indexed: `?ids[0]=1&ids[1]=2&ids[2]=3`
- Parser supports brackets, but API expects repeated keys → query fails
- User sees `ddcFilter[name]=foo` in URL, form shows it as single string, not grouped object
- Form submits with bracket notation, but API doesn't parse it

**Prevention:**
1. **Detect and preserve existing format:** Parse incoming URL, detect which format used, preserve it on submit
2. **Configurable serialization:** Let user choose array format in config panel
3. **Standard library for parsing:** Use `qs` library (supports all formats) instead of URLSearchParams (limited)
4. **Progressive grouping:** Show grouped UI only for bracket notation with common prefix
5. **Test against multiple API conventions:** Include bracket, repeated, CSV in test suite

**Code Implementation:**
```typescript
// src/utils/urlParameters.ts
import qs from 'qs'

interface ParseOptions {
  arrayFormat?: 'brackets' | 'repeat' | 'comma' | 'indices'
}

function parseUrlParameters(url: string, options?: ParseOptions): Record<string, any> {
  const parsed = new URL(url)
  // Use qs library for robust parsing
  return qs.parse(parsed.search.slice(1), {
    arrayFormat: options?.arrayFormat || 'brackets', // Default to brackets
    allowDots: true // Support nested objects via dot notation
  })
}

function serializeUrlParameters(params: Record<string, any>, options?: ParseOptions): string {
  return qs.stringify(params, {
    arrayFormat: options?.arrayFormat || 'brackets',
    allowDots: true,
    addQueryPrefix: true // Adds leading ?
  })
}

// Detect array format from existing URL
function detectArrayFormat(url: string): ParseOptions['arrayFormat'] {
  const search = new URL(url).search
  if (search.includes('[0]')) return 'indices'
  if (search.includes('[]')) return 'brackets'
  // Check for repeated keys: param=1&param=2
  const params = new URLSearchParams(search)
  const keys = Array.from(params.keys())
  const hasDuplicates = keys.length !== new Set(keys).size
  if (hasDuplicates) return 'repeat'
  // Check for comma-separated: param=1,2,3
  for (const [key, value] of params.entries()) {
    if (value.includes(',')) return 'comma'
  }
  return 'brackets' // Default
}
```

**Package addition required:**
```bash
npm install qs
npm install -D @types/qs
```

**Phase:** Phase 1 (URL Parsing) - Foundation for all parameter handling

**Sources:**
- [Arrays in query params - no consensus](https://medium.com/raml-api/arrays-in-query-params-33189628fa68)
- [How to pass an array in query string](https://www.uptimia.com/questions/how-to-pass-an-array-in-a-query-string)
- [Bracket notation support issues](https://github.com/zalando/connexion/issues/1271)

---

### Pitfall 7: Parameter Grouping UI Confusion

**Risk:** Auto-grouping parameters by prefix (ddcFilter[*] → "Filters" section) works sometimes but creates confusing UI when grouping is wrong or unexpected.

**What goes wrong:**
- False grouping: `user[name]` and `user[id]` grouped, but they're unrelated flat params
- Inconsistent grouping: `filter[name]` groups but `filterName` doesn't → confusing split
- Nested group explosion: `a[b][c][d]` creates 4 nested levels → unusable UI
- Group names are ugly: Section titled "ddcFilter" instead of "Filters"
- User can't ungrouped or regroup parameters
- OpenAPI parameters mixed with grouped URL parameters → two different UI patterns in same form

**Prevention:**
1. **Grouping heuristics with confidence:**
   - Only group if 3+ parameters share prefix
   - Don't group beyond 2 levels deep
   - Ignore single-item groups
2. **Humanized group labels:**
   ```typescript
   function humanizeGroupName(prefix: string): string {
     // ddcFilter -> "Filters"
     // userSettings -> "User Settings"
     // apiConfig -> "API Configuration"
     return prefix
       .replace(/([A-Z])/g, ' $1')
       .replace(/^./, (str) => str.toUpperCase())
       .replace(/filter$/i, 'Filters')
       .trim()
   }
   ```
3. **Group configuration UI:** Let user rename, ungroup, or regroup in config mode
4. **Mixed display strategy:**
   - OpenAPI params: Show in standard sections (Required/Optional)
   - Grouped URL params: Show in named sections below
   - Ungrouped URL params: Show in "Additional Parameters" section
5. **Progressive disclosure:** Groups start collapsed if >5 params

**Phase:** Phase 2 (Parameter Grouping) - After basic URL parsing works

---

### Pitfall 8: Type Coercion on Form Submit

**Risk:** Form submits with wrong types (string "123" instead of number 123), causing API errors or unexpected behavior.

**What goes wrong:**
- HTML inputs always return strings, even for type="number"
- Boolean checkbox returns "true"/"false" string, not boolean
- Date picker returns local format, API expects ISO 8601
- Multi-value inputs return array, API expects comma-separated string
- Empty string vs null vs undefined distinction lost

**Prevention:**
1. **Explicit coercion before submit:**
   ```typescript
   function coerceParameterValue(param: ParsedParameter, value: string): unknown {
     if (value === '') {
       return param.required ? undefined : null // Or don't send empty optionals
     }

     switch (param.schema.type) {
       case 'integer':
         return parseInt(value, 10)
       case 'number':
         return parseFloat(value)
       case 'boolean':
         return value === 'true'
       case 'array':
         return value.split(',').map((v) => v.trim())
       default:
         return value
     }
   }
   ```

2. **URL serialization:** Don't send empty optional parameters
   ```typescript
   function buildQueryString(params: Record<string, unknown>): string {
     const filtered = Object.entries(params)
       .filter(([key, value]) => value !== undefined && value !== null && value !== '')
       .map(([key, value]) => {
         if (Array.isArray(value)) {
           return value.map((v) => `${key}[]=${encodeURIComponent(v)}`).join('&')
         }
         return `${key}=${encodeURIComponent(String(value))}`
       })
       .join('&')
     return filtered ? `?${filtered}` : ''
   }
   ```

3. **Schema-aware serialization:** Use OpenAPI schema to guide coercion
4. **API error feedback:** If API returns 400 with type error, show clear message

**Phase:** Phase 1 (Smart Forms) - Prevent API errors from bad types

---

### Pitfall 9: Date/Time Format Mismatch

**Risk:** Date pickers produce local format (2024-01-15), but API expects ISO 8601 with timezone (2024-01-15T00:00:00Z).

**What goes wrong:**
- `<input type="date">` returns YYYY-MM-DD, API rejects it (wants full timestamp)
- `<input type="datetime-local">` returns local time without timezone, API interprets as UTC → off by timezone offset
- User in PST submits 2024-01-15T10:00, API receives as UTC, query returns wrong day's data
- Date inference detects "2024-01-15" as date, but API wants "2024-01-15T00:00:00.000Z"

**Prevention:**
1. **Always include timezone:** Convert datetime-local to ISO 8601 with Z suffix
   ```typescript
   function formatDateForAPI(dateInput: string, schemaFormat?: string): string {
     if (schemaFormat === 'date') {
       return dateInput // YYYY-MM-DD is correct for date format
     }
     if (schemaFormat === 'date-time') {
       // datetime-local returns "2024-01-15T10:00"
       // Convert to UTC: "2024-01-15T10:00:00.000Z"
       return new Date(dateInput).toISOString()
     }
     return dateInput
   }
   ```

2. **Schema format awareness:** Use OpenAPI schema.format field
   - format: "date" → Use date picker, submit YYYY-MM-DD
   - format: "date-time" → Use datetime-local picker, submit ISO 8601

3. **Timezone indicator in UI:** Show "Times are in your local timezone (PST)" hint

**Phase:** Phase 2 (Rich Input Components) - When adding date pickers

---

### Pitfall 10: Form State Synchronization with URL

**Risk:** User edits form, URL doesn't update; or URL updates, form doesn't reflect it → confusion about source of truth.

**What goes wrong:**
- User edits parameter, hits submit, URL updates, but back button shows old form state
- User edits URL directly (power user), form doesn't reflect URL changes
- Form state and URL state diverge, creating two sources of truth
- Bookmarking or sharing URL doesn't include current form state
- React state (values) out of sync with URL state

**Prevention:**
1. **URL as source of truth:** Update URL on form change (debounced), read URL on mount
   ```typescript
   // Update URL on form change (debounced)
   useEffect(() => {
     const timeoutId = setTimeout(() => {
       const queryString = buildQueryString(values)
       const newUrl = `${baseUrl}${queryString}`
       window.history.replaceState(null, '', newUrl)
     }, 500) // Debounce 500ms

     return () => clearTimeout(timeoutId)
   }, [values, baseUrl])

   // Read URL on mount and when URL changes
   useEffect(() => {
     const params = parseUrlParameters(window.location.href)
     setValues(params)
   }, [window.location.search]) // Re-run when URL changes
   ```

2. **Controlled sync strategy:**
   - User edits form → Update React state immediately (responsive UI)
   - Debounced: Update URL after 500ms of inactivity
   - User edits URL directly → Parse and update React state immediately

3. **Browser back/forward support:**
   ```typescript
   useEffect(() => {
     const handlePopState = () => {
       const params = parseUrlParameters(window.location.href)
       setValues(params)
     }

     window.addEventListener('popstate', handlePopState)
     return () => window.removeEventListener('popstate', handlePopState)
   }, [])
   ```

4. **Deep linking:** Full form state encoded in URL for sharing
   - Share button: Copy URL with all current parameter values
   - Bookmark: URL includes complete query string
   - Open in new tab: New tab has same form state

**Phase:** Phase 2 (Parameter Persistence) - After basic form works

**Sources:**
- [Synchronizing with Effects – React](https://react.dev/learn/synchronizing-with-effects)

---

### Pitfall 11: Layout Switch Without Preserving Scroll Position

**Risk:** User drills into detail view, scrolls down, switches layout → scroll resets to top, loses place.

**What goes wrong:**
- Layout change re-mounts components → scroll position lost
- Switching from sidebar to topbar closes panel → detail view lost
- Layout stored in persistent state, but scroll/panel state ephemeral → mismatch on refresh
- User switches layout accidentally (fat-finger click), loses context

**Prevention:**
1. **Preserve scroll position:**
   ```typescript
   const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({})

   const handleLayoutChange = (newLayout: LayoutMode) => {
     // Save current scroll position
     const currentScroll = window.scrollY
     setScrollPositions((prev) => ({ ...prev, [layout]: currentScroll }))

     // Change layout
     setLayout(newLayout)

     // Restore scroll position for new layout (after render)
     requestAnimationFrame(() => {
       window.scrollTo(0, scrollPositions[newLayout] || 0)
     })
   }
   ```

2. **Layout change confirmation:** If user is in detail view, confirm before switching
3. **Stateful layout container:** Use CSS to hide/show layouts without unmounting

**Phase:** Phase 2 (Layout Polish) - After basic switching works

---

## Integration Pitfalls (Specific to Existing Codebase)

### Pitfall 12: Breaking Existing OpenAPI Parameter Flow

**Risk:** Adding raw URL parsing breaks existing OpenAPI parameter handling because ParameterForm was designed for OpenAPI schema, not untyped URL params.

**What breaks:**
- `ParameterForm.tsx` line 13-25: Initial values assume parameters array exists, raw URL may have no schema
- `ParameterInput.tsx` line 12-134: Input rendering assumes schema.type exists, raw URL params are all strings
- OpenAPI spec with 3 parameters, but URL has 10 → UI shows wrong set
- Type mapping (enum → select, boolean → checkbox) breaks for untyped params

**Warning Signs:**
- TypeScript errors when passing undefined schema
- Form renders text inputs for everything (no type intelligence)
- "Cannot read property 'type' of undefined" errors

**Prevention:**
1. **Schema generation for raw params:** Create synthetic ParsedParameter[] from URL
   ```typescript
   function generateSchemaFromUrl(url: string): ParsedParameter[] {
     const params = parseUrlParameters(url)
     return Object.entries(params).map(([name, value]) => ({
       name,
       in: 'query',
       required: false, // URL params are optional by default
       description: '',
       schema: {
         type: inferType(value), // Use smart type inference
         format: inferFormat(name, value),
         example: value
       }
     }))
   }
   ```

2. **Merge strategy:** Combine OpenAPI schema with URL params
   ```typescript
   function mergeParameters(
     openApiParams: ParsedParameter[],
     urlParams: Record<string, string>
   ): ParsedParameter[] {
     const merged = [...openApiParams]

     // Add URL params not in OpenAPI spec
     for (const [name, value] of Object.entries(urlParams)) {
       const existsInSpec = openApiParams.some((p) => p.name === name)
       if (!existsInSpec) {
         merged.push(generateParameter(name, value))
       }
     }

     return merged
   }
   ```

3. **Graceful degradation:** ParameterInput handles missing schema gracefully
   ```typescript
   // In ParameterInput.tsx
   const schema = parameter.schema || { type: 'string' } // Default to string if no schema
   ```

4. **Backward compatibility test:** Ensure existing OpenAPI flow still works
   - Test with API that has only OpenAPI spec (no extra URL params)
   - Verify all existing parameter types still render correctly
   - Check that required/optional grouping still works

**Integration points:**
- `src/components/forms/ParameterForm.tsx`: Add logic to accept raw params
- `src/services/openapi/parser.ts`: Keep unchanged, don't break existing parsing
- Create `src/services/parameters/mergeStrategy.ts` for combining sources

**Phase:** Phase 1 (Foundation) - Must not break existing functionality

---

### Pitfall 13: ConfigStore State Bloat

**Risk:** Adding layout mode, parameter values, parameter groups, validation state, array formats, etc. to existing configStore creates monolithic store that's hard to reason about and slow to persist.

**What goes wrong:**
- configStore grows from 260 lines to 800+ lines with all new state
- Persisting parameter values for every URL bloats localStorage (quota exceeded)
- Every component that uses any config re-renders on layout change
- State shape becomes confusing: what's persisted vs ephemeral?
- Version migration becomes complex (v2 → v3 migration in persist middleware)

**Current state in configStore:**
- Mode, drilldownMode, fieldConfigs, theme, styleOverrides, endpointOverrides, panelOpen, paginationConfigs
- Adding: layout, parameterValues (per URL), parameterGroups, arrayFormat → state explosion

**Prevention:**
1. **Split stores by concern:**
   ```typescript
   // src/store/configStore.ts - Visual configuration (persist)
   - mode, drilldownMode, layout, theme, styleOverrides

   // src/store/fieldStore.ts - Field configuration (persist)
   - fieldConfigs, paginationConfigs

   // src/store/parameterStore.ts - Parameter state (persist per URL)
   - parameterValues (per URL), arrayFormat (per URL)

   // src/store/uiStore.ts - Ephemeral UI state (don't persist)
   - panelOpen, validationErrors, loadingStates
   ```

2. **Selective persistence:** Don't persist everything
   ```typescript
   // Only persist what needs to survive refresh
   partialize: (state) => ({
     mode: state.mode,
     layout: state.layout, // NEW
     drilldownMode: state.drilldownMode,
     theme: state.theme,
     // Don't persist: panelOpen (ephemeral), validationErrors (ephemeral)
   })
   ```

3. **URL-scoped parameter storage:** Don't store all URLs forever
   ```typescript
   interface ParameterState {
     values: Record<string, Record<string, string>> // url -> params
     // Limit to last 10 URLs to prevent localStorage bloat
     recentUrls: string[] // LRU cache
   }

   // Prune old URLs when limit reached
   const setParameterValue = (url, name, value) => {
     set((state) => {
       const urls = [url, ...state.recentUrls.filter((u) => u !== url)].slice(0, 10)
       return {
         recentUrls: urls,
         values: {
           // Only keep values for recent URLs
           ...Object.fromEntries(urls.map((u) => [u, state.values[u] || {}])),
           [url]: { ...state.values[url], [name]: value }
         }
       }
     })
   }
   ```

4. **Migration strategy:** Handle store splits gracefully
   ```typescript
   // In new parameterStore
   migrate: (persistedState, version) => {
     if (version === 2) {
       // Move parameterValues from old configStore
       const oldConfig = localStorage.getItem('api2ui-config')
       if (oldConfig) {
         const parsed = JSON.parse(oldConfig)
         return { values: parsed.parameterValues || {} }
       }
     }
     return persistedState
   }
   ```

**Phase:** Phase 1 (Foundation) - Architecture decision before adding features

---

### Pitfall 14: Existing Type Detection Too Loose

**Risk:** Current typeDetection.ts (line 29-34) only checks ISO pattern + Date.parse(), missing false positive prevention → when adding smart type inference, inherits existing weakness.

**Current detection:**
```typescript
// src/services/schema/typeDetection.ts line 29-34
if (ISO_8601_PATTERN.test(value)) {
  const timestamp = Date.parse(value)
  if (!isNaN(timestamp)) {
    return 'date'
  }
}
```

**What's wrong:**
- No year range check → "9999-99-99" passes
- No false positive prevention → product codes detected as dates
- Used for response inference, will be reused for parameter inference → propagates weakness

**Prevention:**
1. **Enhance existing typeDetection.ts:**
   ```typescript
   function detectFieldType(value: unknown, context?: { fieldName?: string }): FieldType {
     // Existing logic...

     if (typeof value === 'string') {
       // ENHANCED: Add context awareness and range checking
       if (ISO_8601_PATTERN.test(value)) {
         const timestamp = Date.parse(value)
         if (!isNaN(timestamp)) {
           // NEW: Year range validation
           const year = new Date(timestamp).getFullYear()
           if (year >= 1970 && year <= 2100) {
             // NEW: Negative pattern check (field name suggests not a date)
             if (context?.fieldName && /code|id|version|serial/i.test(context.fieldName)) {
               return 'string' // Likely not a date despite format match
             }
             return 'date'
           }
         }
       }
       return 'string'
     }
     // ...
   }
   ```

2. **Backward compatibility:** Default context to undefined, existing callers unchanged
3. **Test expansion:** Add false positive test cases to typeDetection.test.ts

**Phase:** Phase 1 (Type Inference) - Fix foundation before building on it

---

## Anti-Patterns to Avoid

### 1. "Progressive Enhancement" Excuse for Breaking Changes

**Anti-pattern:** "We'll add URL parsing as optional feature, won't affect existing OpenAPI flow"
**Reality:** URL parsing requires deep changes to ParameterForm, creating two code paths that drift apart
**Instead:** Build unified parameter system from start, treat OpenAPI and URL as two input sources to same pipeline

### 2. Type Inference Optimism

**Anti-pattern:** "Smart type inference will make forms feel magical"
**Reality:** False positives destroy trust faster than true positives build it
**Instead:** Conservative inference + easy override + clear confidence indicators

### 3. localStorage as Universal Solution

**Anti-pattern:** "Just persist everything to localStorage, it's simple"
**Reality:** Race conditions, quota limits, stale data, migration hell
**Instead:** Split stores, selective persistence, version tokens, URL as source of truth for parameters

### 4. Layout as Afterthought

**Anti-pattern:** "We'll add layout switching later, just build sidebar first"
**Reality:** Layout deeply affects component structure, state management, navigation → expensive refactor
**Instead:** Design for multiple layouts from start, even if only shipping one initially

### 5. Inline Validation Everywhere

**Anti-pattern:** "Show errors immediately for fast feedback"
**Reality:** Errors while typing interrupt flow, frustrate users
**Instead:** Strategic timing (validate on blur), constructive messages, accessibility

### 6. URL Parsing with URLSearchParams

**Anti-pattern:** "URLSearchParams is built-in, why add a library?"
**Reality:** Can't handle arrays, bracket notation, nested objects → limits what APIs you can support
**Instead:** Use `qs` library for robust parsing, detect format, preserve format on submit

### 7. State Synchronization Everywhere

**Anti-pattern:** Keep layout, panel, drilldown, navigation states all in sync with useEffect
**Reality:** Synchronization logic becomes complex, brittle, and bug-prone
**Instead:** Derive state from single source of truth, compute dependent values

### 8. Validation as Separate Concern

**Anti-pattern:** Build forms first, add validation later
**Reality:** Retrofitting validation changes component structure, state management, UX flow
**Instead:** Design validation strategy upfront (timing, messages, accessibility), implement alongside forms

---

## Testing Strategy for Pitfall Prevention

### Unit Tests

**URL Parsing (Pitfall 1, 6):**
- Parse bracket notation: `?filter[name]=foo&filter[age]=25` → `{ filter: { name: 'foo', age: '25' } }`
- Parse repeated keys: `?id=1&id=2&id=3` → `{ id: ['1', '2', '3'] }`
- Parse comma-separated: `?ids=1,2,3` → `{ ids: ['1', '2', '3'] }`
- Detect and preserve format on re-serialize
- Round-trip: parse → serialize → parse should be stable

**Type Inference (Pitfall 2, 14):**
- True positives: Correctly detect date, email, number, boolean
- False positives: Reject product codes, IDs, version numbers as dates
- Field name context: "email_address" → email type, "product_code" → string despite date-like format
- Confidence levels: LOW/MEDIUM/HIGH thresholds
- Edge cases: Empty string, null, undefined, whitespace-only

**Type Coercion (Pitfall 8):**
- String to number: "123" → 123, "abc" → NaN → validation error
- String to boolean: "true" → true, "false" → false, "" → false
- String to array: "a,b,c" → ["a", "b", "c"]
- Empty string handling: "" for optional param → not sent, "" for required param → validation error

### Integration Tests

**Parameter Flow (Pitfall 1, 12):**
- OpenAPI only: Spec with 3 params → form renders correctly
- URL only: Raw URL with 5 params, no spec → form infers types and renders
- Combined: Spec with 3 params + URL with 2 extra → form shows all 5, respects spec types
- Value override: Spec has default, URL has different value → URL value wins

**Form Validation (Pitfall 4):**
- Type in field, blur → error appears if invalid
- Fix error → error disappears
- Submit with errors → all errors shown, focus on first
- Submit while typing → no "invalid email" mid-typing

**Layout Switching (Pitfall 5, 11):**
- Switch layouts → data not lost, scroll preserved
- Fill form, switch layout → form values preserved
- Open panel, switch to layout without panel → panel closes gracefully
- Refresh after layout change → layout persisted, state consistent

**Multi-tab (Pitfall 3):**
- Open two tabs, edit param in Tab A → Tab B receives update
- Concurrent edits → last write wins or merge by timestamp
- Refresh one tab → doesn't corrupt other tab's state

### E2E Tests (Real APIs)

**Real-world APIs with different parameter conventions:**
- Stripe API (OpenAPI spec, query params)
- GitHub API (OpenAPI spec, path params)
- Custom API with bracket notation
- Custom API with repeated keys

**User Flows:**
- Paste URL with parameters → form parses and displays them
- Edit parameters → URL updates (debounced)
- Submit form → API called with correct types
- Switch layout → everything still works
- Reload page → parameters restored from URL

---

## Phase Mapping

| Pitfall | Phase to Address | Why This Phase |
|---------|-----------------|----------------|
| 1. Dual Parameter Collision | Phase 1 (Foundation) | Architecture decision determines entire v1.2 |
| 2. Type Inference False Positives | Phase 1 (Type Inference) | Must be conservative from start, hard to walk back |
| 3. localStorage Race Conditions | Phase 1 (Foundation) | Persistence layer is foundational |
| 4. Form Validation UX | Phase 1 (Smart Forms) | UX patterns must be correct from start |
| 5. Layout State Sync | Phase 1 (Layout Foundation) | Architecture must be right before features |
| 6. Array Notation Inconsistency | Phase 1 (URL Parsing) | Foundation for all parameter handling |
| 7. Parameter Grouping UI | Phase 2 (Grouping) | After basic parsing works |
| 8. Type Coercion | Phase 1 (Smart Forms) | Prevent API errors from bad types |
| 9. Date/Time Format Mismatch | Phase 2 (Rich Components) | When adding date pickers |
| 10. Form State/URL Sync | Phase 2 (Persistence) | After basic form works |
| 11. Layout Switch Scroll Loss | Phase 2 (Polish) | After basic switching works |
| 12. Breaking OpenAPI Flow | Phase 1 (Integration) | Must not break existing functionality |
| 13. ConfigStore Bloat | Phase 1 (Foundation) | Architecture before features |
| 14. Existing Type Detection | Phase 1 (Type Inference) | Fix foundation before building on it |

---

## Red Flags During Development

Watch for these warning signs that you're hitting a pitfall:

- **"It works in my test but not with real URLs"** → Pitfall 1, 6 (parameter parsing edge cases)
- **"Users keep switching away from the smart component"** → Pitfall 2 (type inference false positives)
- **"Parameters reset when I open another tab"** → Pitfall 3 (localStorage race conditions)
- **"The form feels annoying to fill out"** → Pitfall 4 (validation UX)
- **"Layout switch broke the panel"** → Pitfall 5 (state synchronization)
- **"Adding X feature broke Y feature"** → Tight coupling, insufficient abstraction
- **"Let me just add this to configStore real quick"** → Pitfall 13 (store bloat)
- **"We'll fix the UX later, focus on functionality"** → Validation UX will be wrong from start
- **"TypeScript is complaining but it works"** → Type safety violation, will break later

---

## Sources

**High Confidence** - Verified with multiple sources and existing codebase analysis

### URL Parsing & Parameters
- [URL Confusion Vulnerabilities - Snyk](https://snyk.io/blog/url-confusion-vulnerabilities/)
- [Mastering Query String Parse - DHiWise](https://www.dhiwise.com/blog/design-converter/query-string-parse-explained-what-you-need-to-know)
- [Arrays in Query Params - Medium](https://medium.com/raml-api/arrays-in-query-params-33189628fa68)
- [How to Pass Arrays in Query Strings - Uptimia](https://www.uptimia.com/questions/how-to-pass-an-array-in-a-query-string)

### Form Validation UX
- [10 Design Guidelines for Form Errors - Nielsen Norman Group](https://www.nngroup.com/articles/errors-forms-design-guidelines/)
- [Form Validation Best Practices - Userpeek](https://userpeek.com/blog/form-validation-ux-and-best-practices/)
- [Complete Guide to Live Validation UX - Smashing Magazine](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)
- [Accessible Form Validation - UXPin](https://www.uxpin.com/studio/blog/accessible-form-validation-best-practices/)

### Type Inference & Validation
- [International Zip Code Validation - GeoPostcodes](https://www.geopostcodes.com/blog/international-zip-code-validation/)
- [Email Regex Pattern - UseBouncer](https://www.usebouncer.com/email-regex-pattern/)
- [ZIP Code Regex - UIBakery](https://uibakery.io/regex-library/zip-code)

### State Management
- [React State Management in 2025 - Developer Way](https://www.developerway.com/posts/react-state-management-2025)
- [Don't Sync State. Derive It! - Kent C. Dodds](https://kentcdodds.com/blog/dont-sync-state-derive-it)
- [Sharing State Between Components - React Docs](https://react.dev/learn/sharing-state-between-components)
- [Top React State Management Tools 2026 - Syncfusion](https://www.syncfusion.com/blogs/post/react-state-management-libraries)

### localStorage & Persistence
- [Managing Local and Cloud Data: Avoiding Race Conditions - Medium](https://medium.com/@sassenthusiast/managing-local-and-cloud-data-in-react-a-guide-to-avoiding-race-conditions-f83780a1951e)
- [Managing Persistent Browser Data with useSyncExternalStore - Yeti](https://www.yeti.co/blog/managing-persistent-browser-data-with-usesyncexternalstore)
- [Mastering State Persistence with Local Storage - Medium](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c)

### OpenAPI Validation
- [OpenAPI Specification v3.2.0](https://spec.openapis.org/oas/v3.2.0.html)
- [OAS Validation Policy - Apigee](https://docs.apigee.com/api-platform/reference/policies/oas-validation-policy)

### Existing Codebase
- Analyzed `src/store/configStore.ts` - Current persistence implementation
- Analyzed `src/services/schema/typeDetection.ts` - Current type inference
- Analyzed `src/components/forms/ParameterForm.tsx` - Current parameter handling
- Analyzed `src/components/forms/ParameterInput.tsx` - Current input rendering
- Analyzed `src/types/config.ts` - Current config state structure
