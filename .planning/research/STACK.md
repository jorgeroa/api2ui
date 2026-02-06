# Stack Research: v1.2 Smart Parameters & Layout System

**Project:** api2ui v1.2
**Researched:** 2026-02-05
**Confidence:** HIGH

## Summary

v1.2 adds smart parameter handling and layout system features to the existing api2ui app. Research focused on minimal, targeted stack additions that integrate with the validated React 19 + Zustand + Tailwind 4 + Headless UI foundation. Key findings: (1) Native browser APIs cover query string parsing without dependencies, (2) React Hook Form + Zod provides lightweight validation with excellent TypeScript integration, (3) Headless date picker and native range inputs keep component library minimal, (4) Tailwind CSS Grid eliminates need for layout libraries, (5) Zustand's built-in persist middleware handles parameter persistence.

**Philosophy:** Prefer zero-dependency solutions (native APIs, CSS) over libraries when capabilities overlap. Only add libraries when they provide substantial value over native approaches.

---

## Recommendations

### 1. Query String Parsing

**Recommendation:** Native `URLSearchParams` API (zero dependencies)

**Why:**
- Built into all modern browsers, no library needed
- Handles array parameters via `getAll()` method
- Supports iterating key-value pairs for grouping logic
- Zero bundle size impact

**Alternative Considered:** `query-string` library (v9.x)
- **Rejected because:** Adds dependency for functionality already in URLSearchParams
- **Only use if:** You need advanced features like `parseNumbers`, `parseBooleans`, or nested object parsing
- **Size impact:** 3.5KB minified + gzipped

**Implementation notes:**
```typescript
// Parse raw URL query string
const params = new URLSearchParams(window.location.search);

// Handle arrays (e.g., ?tags=foo&tags=bar)
const tags = params.getAll('tags'); // ['foo', 'bar']

// Iterate for grouping (e.g., ddcFilter[status] → "Filters" section)
for (const [key, value] of params.entries()) {
  const match = key.match(/^(\w+)\[(.+)\]$/);
  if (match) {
    const [, prefix, field] = match;
    // Group by prefix
  }
}
```

**Integration:** Works seamlessly with existing Zustand state management. Parse on mount, sync to store.

**Confidence:** HIGH (verified via [MDN URLSearchParams documentation](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams))

---

### 2. Form Validation

**Recommendation:** React Hook Form v7.71.1 + Zod v4.3.5

**Why React Hook Form:**
- Minimal re-renders (uncontrolled inputs by default)
- Tiny bundle size with zero dependencies
- Native HTML validation + custom validation logic
- Excellent TypeScript support
- Integrates with Zod via `@hookform/resolvers`

**Why Zod:**
- TypeScript-first with automatic type inference
- Lighter and faster than Yup for large-scale apps
- Built-in transformers for type coercion (string → number)
- Composable schemas for reusable validation logic
- Current standard in Next.js/React ecosystem

**Installation:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

**Integration notes:**
- Existing `ParameterInput.tsx` already handles basic HTML5 validation
- React Hook Form wraps existing inputs, adds validation layer
- Zod schemas define parameter validation rules
- `zodResolver` bridges React Hook Form + Zod error handling

**Example:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  age: z.coerce.number().min(0).max(120),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

**Alternatives Considered:**
- **Yup:** More verbose syntax, larger bundle, older ecosystem position
- **Formik:** Heavier, more re-renders, less performant than React Hook Form
- **Native HTML5 only:** Insufficient for complex validation (coordinates, zip codes, date ranges)

**Confidence:** HIGH (verified via [React Hook Form releases](https://github.com/react-hook-form/react-hook-form/releases), [Zod npm](https://www.npmjs.com/package/zod), [comparison analysis](https://medium.com/@osmion/form-validation-yup-vs-zod-vs-joi-which-one-should-you-actually-use-681988f84692))

---

### 3. Rich Input Components

#### Date Pickers

**Recommendation:** `@rehookify/datepicker` v6.6.8

**Why:**
- Headless, fully customizable (matches Headless UI philosophy)
- Works with existing Tailwind styling
- Supports date ranges, multiple calendars
- Small bundle (8.4KB minified + gzipped)
- Modular hooks API (use only what you need)

**Installation:**
```bash
npm install @rehookify/datepicker
```

**Integration notes:**
- Replace native `<input type="date">` for better UX
- Style with Tailwind to match existing design system
- Works with React Hook Form via controlled component pattern

**Alternatives Considered:**
- **Native `<input type="date">`:** Keep as fallback for browsers without JS
- **react-datepicker:** Heavier (46KB), includes styling that conflicts with Tailwind
- **Material UI DatePicker:** Massive bundle, not headless

**Confidence:** MEDIUM (verified via [@rehookify/datepicker npm](https://www.npmjs.com/package/@rehookify/datepicker), [DEV article](https://dev.to/rehookify/the-headless-ui-date-picker-for-react-apps-5kh))

#### Sliders (Range Inputs)

**Recommendation:** Native `<input type="range">` with Tailwind CSS styling

**Why:**
- Zero dependencies, universally supported
- Accessible by default
- Tailwind 4 supports styling pseudo-elements
- Performance advantage over JS-based sliders

**Styling approach:**
```css
/* In your Tailwind config or CSS */
input[type="range"] {
  @apply w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer;
}

input[type="range"]::-webkit-slider-thumb {
  @apply appearance-none w-4 h-4 bg-blue-600 rounded-full cursor-pointer;
}

input[type="range"]::-moz-range-thumb {
  @apply w-4 h-4 bg-blue-600 rounded-full cursor-pointer;
}
```

**Alternative Considered:** TanStack Ranger
- **Why not:** Adds complexity for functionality native HTML already provides
- **Use only if:** Need multi-thumb range sliders (e.g., min-max price range)

**Confidence:** HIGH (verified via [Tailwind range styling guides](https://flowbite.com/docs/forms/range/), [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range))

#### Tag Inputs (Multi-Value)

**Recommendation:** Build custom component (150-200 LOC)

**Why:**
- Simple pattern: array state + input + keyboard handlers
- Full control over styling and behavior
- Avoids dependency for straightforward logic
- Integrates directly with React Hook Form field arrays

**Implementation guidance:**
```typescript
// Core logic
const [tags, setTags] = useState<string[]>([]);
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const value = e.currentTarget.value.trim();
    if (value && !tags.includes(value)) {
      setTags([...tags, value]);
      e.currentTarget.value = '';
    }
  }
  if (e.key === 'Backspace' && !e.currentTarget.value) {
    setTags(tags.slice(0, -1));
  }
};
```

**Alternatives Considered:**
- **react-tag-input:** Outdated (last update 2020)
- **Mantine TagsInput:** Requires entire Mantine UI library (500KB+)
- **react-tagsinput:** Not actively maintained

**Confidence:** MEDIUM (implementation pattern verified via [LogRocket guide](https://blog.logrocket.com/building-a-tag-input-field-component-for-react/), [DEV tutorials](https://dev.to/stephengade/create-tags-input-field-in-reactjs-s-no-package-required-5ae4))

---

### 4. Layout System

**Recommendation:** CSS Grid via Tailwind CSS utilities (zero dependencies)

**Why:**
- Tailwind 4 has comprehensive CSS Grid utilities
- Responsive breakpoints built-in (sm, md, lg, xl)
- No library needed for sidebar/top bar/split/drawer layouts
- Leverages existing Tailwind knowledge
- Zero bundle size impact

**Layout patterns:**
```typescript
// Sidebar layout
<div className="grid grid-cols-[300px_1fr] gap-4">
  <aside>Filters</aside>
  <main>Results</main>
</div>

// Top bar layout
<div className="grid grid-rows-[auto_1fr] h-screen">
  <header>Filters</header>
  <main>Results</main>
</div>

// Split view layout
<div className="grid md:grid-cols-2 gap-4">
  <div>Filters</div>
  <div>Results</div>
</div>

// Drawer layout (mobile-first)
<div className="relative">
  <aside className="fixed inset-y-0 left-0 w-80 transform -translate-x-full transition-transform data-[open]:translate-x-0">
    Filters
  </aside>
  <main className="ml-0 md:ml-80">Results</main>
</div>
```

**Integration with Zustand:**
- Store current layout preference in Zustand state
- Use persist middleware for layout preference across sessions
- Switch layouts by toggling CSS classes

**Alternatives Considered:**
- **react-grid-layout:** Overkill for static layouts, adds 122KB
- **react-split:** Only needed for resizable splits, adds complexity
- **CSS-in-JS libraries:** Tailwind already provides all needed utilities

**Confidence:** HIGH (verified via [Tailwind Grid docs](https://tailwindcss.com/docs/grid-template-columns), [responsive grid guide](https://codeparrot.ai/blogs/mastering-responsive-layouts-with-tailwind-grid-in-react))

---

### 5. Parameter Persistence

**Recommendation:** Zustand persist middleware (built-in, zero dependencies)

**Why:**
- Already using Zustand for state management
- `persist` middleware included in zustand package
- Handles localStorage/sessionStorage automatically
- Supports partial persistence (persist only param state, not UI state)
- Recent bug fixes in v5.0.11 (current project uses v5.0.11)

**Installation:**
None needed (already have zustand v5.0.11)

**Implementation:**
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useParamStore = create(
  persist(
    (set) => ({
      params: {},
      setParams: (params) => set({ params }),
    }),
    {
      name: 'api2ui-params',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ params: state.params }), // Only persist params
    }
  )
);
```

**Alternatives Considered:**
- **Custom localStorage hooks:** Reinvents what Zustand middleware provides
- **react-query persistor:** Overkill, only needed if using react-query
- **Redux Persist:** Would require adding Redux (massive overhead)

**Confidence:** HIGH (verified via [Zustand persist docs](https://zustand.docs.pmnd.rs/middlewares/persist), [v5.0.11 release notes](https://github.com/pmndrs/zustand))

---

## Not Recommended

### Libraries Explicitly Avoided

| Library | Why Not | Use Case It Would Solve |
|---------|---------|-------------------------|
| `query-string` | URLSearchParams covers 95% of use cases | Only if need `parseNumbers`, `parseBooleans`, nested objects |
| `qs` | Overkill for API query strings, designed for Express.js server-side | Complex nested object parsing on server |
| `react-datepicker` | Heavy (46KB), includes styles conflicting with Tailwind | If headless approach fails |
| `Material UI DatePicker` | Massive bundle (200KB+), Material Design conflicts with Tailwind | Switching to Material Design system |
| `TanStack Ranger` | Adds complexity native range inputs provide | Multi-thumb range sliders (min-max) |
| `react-grid-layout` | 122KB for drag-drop grid, not needed for static layouts | Draggable dashboard widgets |
| `react-split` | Only needed for resizable panes | User-resizable split panels |
| `Formik` | Heavier, more re-renders than React Hook Form | Already invested in Formik ecosystem |
| `Yup` | Older, more verbose than Zod | Existing Yup schemas to maintain |

---

## Integration Notes

### How New Stack Fits with Existing Foundation

**React 19 (v19.2.0):**
- React Hook Form leverages React 19's optimized re-render behavior
- All recommended libraries compatible with React 19
- No breaking changes in recommended stack

**TypeScript 5.9:**
- Zod provides end-to-end type inference
- React Hook Form has excellent TS support
- Custom tag input component fully typeable

**Vite 7:**
- All recommended libraries support ESM
- Tree-shaking works optimally with Zod, React Hook Form
- No additional Vite config needed

**Tailwind CSS 4 (v4.1.18):**
- Native range input styling via arbitrary variants
- CSS Grid utilities replace layout libraries
- @rehookify/datepicker fully styleable with Tailwind
- No conflicts with recommended libraries

**Headless UI (v2.2.9):**
- @rehookify/datepicker follows same headless philosophy
- Can wrap custom tag input with Headless UI Combobox if needed
- Consistent DX across component types

**Zustand (v5.0.11):**
- Persist middleware already included
- No additional state management library needed
- Form state handled by React Hook Form, app state by Zustand (clear separation)

**@dnd-kit:**
- No interaction with new form/layout features
- Remains available for future drag-drop needs

---

## Bundle Size Impact

Estimated additions to bundle:

| Library | Size (minified + gzipped) | Why Acceptable |
|---------|---------------------------|----------------|
| react-hook-form | ~9KB | Replaces custom validation code, net neutral |
| zod | ~14KB | Provides type inference + validation, high value |
| @hookform/resolvers | ~2KB | Thin bridge layer |
| @rehookify/datepicker | ~8.4KB | Replaces need for full-featured date library |
| **Total** | **~33.4KB** | Equivalent to 2-3 medium images |

**Not added (avoided dependencies):**
- query-string: ~3.5KB saved (use URLSearchParams)
- Layout library: ~100KB+ saved (use CSS Grid)
- Tag input library: ~10KB saved (custom component)
- **Total saved:** ~113.5KB

**Net impact:** Added 33.4KB, avoided 113.5KB = **80KB smaller** than alternative approaches.

---

## Migration Path

### Phase 1: Validation Foundation
1. Install `react-hook-form`, `zod`, `@hookform/resolvers`
2. Create Zod schemas for existing parameter types
3. Wrap existing `ParameterForm` with React Hook Form
4. Test validation with current parameter inputs

### Phase 2: Rich Inputs
1. Install `@rehookify/datepicker`
2. Build custom tag input component
3. Enhance native range inputs with Tailwind styling
4. Replace basic inputs in `ParameterInput.tsx`

### Phase 3: Smart Parsing & Persistence
1. Implement URLSearchParams parsing utility
2. Add Zustand persist middleware to param store
3. Build type inference logic for values
4. Test round-trip param preservation

### Phase 4: Layout System
1. Create layout preset components (Sidebar, TopBar, Split, Drawer)
2. Add layout switcher UI
3. Persist layout preference in Zustand
4. Test responsive behavior

---

## Verification Status

| Technology | Version | Source | Confidence |
|------------|---------|--------|------------|
| react-hook-form | 7.71.1 | [npm](https://www.npmjs.com/package/react-hook-form), [GitHub releases](https://github.com/react-hook-form/react-hook-form/releases) | HIGH |
| zod | 4.3.5 | [npm](https://www.npmjs.com/package/zod), [GitHub releases](https://github.com/colinhacks/zod/releases) | HIGH |
| @hookform/resolvers | Latest | [npm](https://www.npmjs.com/package/@hookform/resolvers), [GitHub](https://github.com/react-hook-form/resolvers) | HIGH |
| @rehookify/datepicker | 6.6.8 | [npm](https://www.npmjs.com/package/@rehookify/datepicker) | MEDIUM |
| URLSearchParams | Native | [MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) | HIGH |
| CSS Grid + Tailwind | Native | [Tailwind docs](https://tailwindcss.com/docs/grid-template-columns) | HIGH |
| Zustand persist | Built-in | [Zustand docs](https://zustand.docs.pmnd.rs/middlewares/persist) | HIGH |

---

## Sources

**Query String Parsing:**
- [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [query-string npm](https://www.npmjs.com/package/query-string)
- [GitHub: query-string](https://github.com/sindresorhus/query-string)

**Form Validation:**
- [React Hook Form](https://react-hook-form.com/)
- [React Hook Form GitHub](https://github.com/react-hook-form/react-hook-form)
- [Zod npm](https://www.npmjs.com/package/zod)
- [Zod vs Yup comparison (Medium, 2026)](https://medium.com/@osmion/form-validation-yup-vs-zod-vs-joi-which-one-should-you-actually-use-681988f84692)
- [React Hook Form with Zod guide (DEV, 2026)](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1)
- [Best React form libraries (Croct, 2026)](https://blog.croct.com/post/best-react-form-libraries)

**Date Pickers:**
- [@rehookify/datepicker npm](https://www.npmjs.com/package/@rehookify/datepicker)
- [Headless Date Picker for React (DEV)](https://dev.to/rehookify/the-headless-ui-date-picker-for-react-apps-5kh)
- [Headless UI DatePicker discussion](https://github.com/tailwindlabs/headlessui/discussions/289)

**Sliders:**
- [Tailwind CSS Range Slider (Flowbite)](https://flowbite.com/docs/forms/range/)
- [TanStack Ranger](https://tanstack.com/ranger/latest)
- [Styling input type="range" discussion](https://github.com/tailwindlabs/tailwindcss/discussions/8748)

**Tag Inputs:**
- [Building tag input component (LogRocket)](https://blog.logrocket.com/building-a-tag-input-field-component-for-react/)
- [Tag input without packages (DEV)](https://dev.to/stephengade/create-tags-input-field-in-reactjs-s-no-package-required-5ae4)

**Layout System:**
- [Tailwind CSS Grid docs](https://tailwindcss.com/docs/grid-template-columns)
- [Mastering responsive layouts with Tailwind Grid](https://codeparrot.ai/blogs/mastering-responsive-layouts-with-tailwind-grid-in-react)
- [Tailwind Grid guide (Refine)](https://refine.dev/blog/tailwind-grid/)

**Persistence:**
- [Zustand persist middleware](https://zustand.docs.pmnd.rs/middlewares/persist)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Using localStorage with React Hooks (LogRocket)](https://blog.logrocket.com/using-localstorage-react-hooks/)
