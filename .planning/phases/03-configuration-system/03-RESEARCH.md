# Phase 3: Configuration System - Research

**Researched:** 2026-02-02
**Domain:** React configuration UI with localStorage persistence
**Confidence:** HIGH

## Summary

Phase 3 requires building a configuration system for customizing component rendering, field visibility, labels, and styling. The user has decided on a dual-mode UX (Configure/View toggle), inline editing with slide-out panel, visual preview pickers, drag-and-drop reordering, theme presets with granular overrides, and localStorage persistence.

Research focused on six key technical domains: (1) Zustand persist middleware for localStorage state management, (2) dnd-kit for accessible drag-and-drop reordering, (3) Headless UI Dialog for slide-out panels, (4) HTML5 color input for color picking, (5) CSS variables with Tailwind CSS 4 for theming, and (6) configuration state architecture patterns.

The standard approach combines Zustand's persist middleware (already using Zustand 5) with dnd-kit for drag-and-drop (performant, accessible, TypeScript-first), Headless UI Dialog for the slide-out panel (already integrated), native HTML5 color input (universal browser support in 2026), CSS variables via Tailwind CSS 4's @theme directive for dynamic theming, and a configuration store separate from application state.

**Primary recommendation:** Use Zustand persist middleware with versioned schemas, dnd-kit sortable preset for field reordering, Headless UI Dialog with transitions for the slide-out panel, native HTML5 color input with curated swatches, and Tailwind CSS 4 theme variables for runtime style customization.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0+ | State management with persist middleware | Already integrated; official persist middleware handles localStorage, versioning, and migrations |
| @dnd-kit/core | Latest | Drag-and-drop foundation | Modern, performant, accessible, extensible toolkit with excellent TypeScript support |
| @dnd-kit/sortable | Latest | Sortable list preset | Official preset with keyboard accessibility and optimized collision detection |
| @headlessui/react | 2.2+ | Accessible UI components | Already integrated; Dialog component perfect for slide-out panels with transitions |
| tailwindcss | 4.1+ | CSS framework with theme variables | Already integrated; CSS 4 @theme directive enables runtime CSS variable overrides |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | HTML5 color input | Use native `<input type="color">` - universal support in 2026, no library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dnd-kit | react-beautiful-dnd | Deprecated; replaced by Pragmatic Drag and Drop |
| dnd-kit | hello-pangea/dnd | Fork of react-beautiful-dnd; heavier, list-only, less flexible |
| dnd-kit | Pragmatic Drag and Drop | Framework-agnostic but less React-idiomatic, limited visual feedback |
| Zustand persist | Redux Persist | More boilerplate, overkill for this use case |
| HTML5 color | react-color | Adds bundle size for limited benefit; native input sufficient |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── store/
│   ├── appStore.ts          # Existing application state
│   ├── configStore.ts       # NEW: Configuration state with persist
│   └── types.ts             # Shared types
├── components/
│   ├── config/              # NEW: Configuration UI components
│   │   ├── ConfigPanel.tsx  # Slide-out side panel
│   │   ├── ConfigToggle.tsx # Floating toggle button
│   │   ├── FieldControls.tsx # Inline field overlays
│   │   ├── ComponentPicker.tsx # Visual preview picker
│   │   ├── ColorPicker.tsx  # Swatch palette + native input
│   │   ├── ThemePresets.tsx # Theme preset selector
│   │   └── DraggableField.tsx # Sortable field wrapper
│   └── renderers/           # Existing renderers
└── hooks/
    ├── useConfigMode.ts     # NEW: Configure/View mode toggle
    └── useFieldConfig.ts    # NEW: Per-field configuration access
```

### Pattern 1: Separate Configuration Store
**What:** Dedicated Zustand store for configuration state, separate from application data state, using persist middleware.

**When to use:** Configuration needs independent lifecycle from application state (persists across sessions, different update patterns).

**Example:**
```typescript
// Source: Zustand persist middleware docs
// https://zustand.docs.pmnd.rs/middlewares/persist

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface FieldConfig {
  visible: boolean
  label?: string
  componentType?: string
  order: number
}

interface ConfigState {
  version: number
  mode: 'configure' | 'view'
  globalTheme: string
  fieldConfigs: Record<string, FieldConfig>
  styleOverrides: Record<string, unknown>

  // Actions
  setMode: (mode: 'configure' | 'view') => void
  setFieldConfig: (path: string, config: Partial<FieldConfig>) => void
  toggleFieldVisibility: (path: string) => void
  setFieldOrder: (path: string, order: number) => void
  applyTheme: (theme: string, overrides?: Record<string, unknown>) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      version: 1,
      mode: 'view',
      globalTheme: 'light',
      fieldConfigs: {},
      styleOverrides: {},

      setMode: (mode) => set({ mode }),
      setFieldConfig: (path, config) => set((state) => ({
        fieldConfigs: {
          ...state.fieldConfigs,
          [path]: { ...state.fieldConfigs[path], ...config }
        }
      })),
      toggleFieldVisibility: (path) => set((state) => ({
        fieldConfigs: {
          ...state.fieldConfigs,
          [path]: {
            ...state.fieldConfigs[path],
            visible: !state.fieldConfigs[path]?.visible ?? true
          }
        }
      })),
      setFieldOrder: (path, order) => set((state) => ({
        fieldConfigs: {
          ...state.fieldConfigs,
          [path]: { ...state.fieldConfigs[path], order }
        }
      })),
      applyTheme: (theme, overrides = {}) => set({
        globalTheme: theme,
        styleOverrides: overrides
      })
    }),
    {
      name: 'api2ui-config-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Don't persist mode - always start in View mode
        version: state.version,
        globalTheme: state.globalTheme,
        fieldConfigs: state.fieldConfigs,
        styleOverrides: state.styleOverrides
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return persistedState as ConfigState
        }
        return persistedState as ConfigState
      }
    }
  )
)
```

### Pattern 2: Slide-Out Panel with Headless UI Dialog
**What:** Fixed-position Dialog that overlays content from the right side, using Transition for animations.

**When to use:** Deep settings panel that shouldn't push or shrink content, needs modal-like focus trapping.

**Example:**
```typescript
// Source: Headless UI Dialog documentation
// https://headlessui.com/v1/react/dialog

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

function ConfigPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        {/* Slide-out panel */}
        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition ease-in-out duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <Dialog.Panel className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold p-4 border-b">
              Configure View
            </Dialog.Title>

            <div className="p-4">
              {/* Panel content: sections for fields, component types, styling */}
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  )
}
```

### Pattern 3: Sortable Fields with dnd-kit
**What:** SortableContext wraps list of fields, each using useSortable hook, with keyboard-accessible reordering.

**When to use:** User needs to reorder fields/columns in Configure mode.

**Example:**
```typescript
// Source: dnd-kit sortable documentation
// https://docs.dndkit.com/presets/sortable

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableField({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle - only show in Configure mode */}
      <button {...attributes} {...listeners} className="drag-handle">
        ⋮⋮
      </button>
      {children}
    </div>
  )
}

function FieldList({ fields }: { fields: Array<{ id: string; content: React.ReactNode }> }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      // Update field order in config store
      // Use arrayMove from @dnd-kit/sortable to reorder
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
        {fields.map((field) => (
          <SortableField key={field.id} id={field.id}>
            {field.content}
          </SortableField>
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

### Pattern 4: CSS Variables for Runtime Theming
**What:** Use Tailwind CSS 4's @theme directive to define CSS variables, then override at runtime via inline styles or class-based overrides.

**When to use:** Need to change colors, spacing, typography dynamically without rebuilding CSS.

**Example:**
```css
/* Source: Tailwind CSS 4 theme documentation
   https://tailwindcss.com/docs/theme */

/* In index.css or theme.css */
@import "tailwindcss";

@theme {
  /* Define base theme variables */
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-background: #ffffff;
  --color-text: #1f2937;

  --spacing-row: 0.5rem;
  --font-size-base: 1rem;
  --border-radius-base: 0.375rem;
}

/* Theme presets as CSS classes */
@layer base {
  .theme-light {
    --color-background: #ffffff;
    --color-text: #1f2937;
  }

  .theme-dark {
    --color-background: #1f2937;
    --color-text: #f9fafb;
  }

  .theme-compact {
    --spacing-row: 0.25rem;
    --font-size-base: 0.875rem;
  }

  .theme-spacious {
    --spacing-row: 1rem;
    --font-size-base: 1.125rem;
  }
}
```

```typescript
// Apply theme dynamically via className or inline styles
function ApplyTheme() {
  const { globalTheme, styleOverrides } = useConfigStore()

  // Option 1: Class-based preset
  useEffect(() => {
    document.documentElement.className = `theme-${globalTheme}`
  }, [globalTheme])

  // Option 2: Runtime CSS variable overrides
  useEffect(() => {
    Object.entries(styleOverrides).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, String(value))
    })
  }, [styleOverrides])

  return null
}
```

### Pattern 5: Inline Editing with ContentEditable
**What:** Click-to-edit labels inline, with accessibility attributes for screen readers.

**When to use:** Quick label editing in Configure mode without opening dialog.

**Example:**
```typescript
// Source: React contentEditable best practices
// Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/textbox_role

import { useState, useRef, KeyboardEvent } from 'react'

function EditableLabel({
  value,
  onChange,
  fieldId
}: {
  value: string
  onChange: (newValue: string) => void
  fieldId: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const editableRef = useRef<HTMLDivElement>(null)

  const handleBlur = () => {
    setIsEditing(false)
    if (draft !== value) {
      onChange(draft)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      editableRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setDraft(value)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={editableRef}
      contentEditable={isEditing}
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Edit label for ${fieldId}`}
      aria-multiline="false"
      onClick={() => setIsEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onInput={(e) => setDraft(e.currentTarget.textContent || '')}
      className={isEditing ? 'border border-blue-500 px-2 py-1' : 'cursor-pointer hover:bg-gray-100 px-2 py-1'}
    >
      {draft}
    </div>
  )
}
```

### Pattern 6: Visual Preview Picker
**What:** Show thumbnail/preview of each component alternative before user commits to switching.

**When to use:** User needs to see what component types look like before selecting (user decision: visual preview picker).

**Example:**
```typescript
// Pattern: Render miniature versions of each component with sample data

interface ComponentOption {
  id: string
  name: string
  preview: React.ComponentType<{ sample: boolean }>
}

function ComponentPicker({
  options,
  selected,
  onSelect
}: {
  options: ComponentOption[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`
            relative border-2 rounded-lg p-4 hover:border-blue-500
            ${selected === option.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
          `}
        >
          {/* Preview thumbnail - render at reduced scale */}
          <div className="transform scale-75 origin-top-left pointer-events-none">
            <option.preview sample={true} />
          </div>

          {/* Label */}
          <div className="mt-2 text-sm font-medium">{option.name}</div>

          {/* Selected indicator */}
          {selected === option.id && (
            <div className="absolute top-2 right-2">✓</div>
          )}
        </button>
      ))}
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Global state for ephemeral UI:** Don't put panel open/closed state in persisted store - use component state
- **Persisting functions:** Zustand persist can't serialize functions - only persist data, not actions
- **Shallow merge with nested configs:** Default persist middleware does shallow merge - use custom merge function for nested field configurations
- **Same component in DragOverlay:** Don't render the same useSortable component inside DragOverlay - create separate presentational component
- **Forgetting screen reader updates:** When changing keyboard shortcuts for dnd-kit, must update screenReaderInstructions prop

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage versioning/migration | Manual version checking, data transformation | Zustand persist middleware `version` + `migrate` option | Handles version mismatch, provides migration callback, manages schema evolution |
| Deep merge for nested config | Custom recursive merge function | Zustand persist middleware `merge` option or library like lodash.merge | Edge cases: circular refs, arrays, null/undefined handling |
| Drag-and-drop keyboard accessibility | Custom keyboard event handlers | dnd-kit KeyboardSensor with sortableKeyboardCoordinates | ARIA compliance, screen reader announcements, focus management |
| Focus trap in modal | Manual focus management | Headless UI Dialog `initialFocus` and built-in trap | Automatic focus return, Esc handling, click-outside detection |
| Color picker UI | Custom color selection component | Native `<input type="color">` | Universal browser support (2026), native OS integration, accessibility built-in |
| Array reordering after drag | Manual splice/insert logic | @dnd-kit/sortable `arrayMove` utility | Immutable, handles edge cases (same position, out of bounds) |

**Key insight:** Configuration UIs have deep accessibility requirements (keyboard navigation, screen readers, focus management) and complex state synchronization (localStorage versioning, nested merges, undo/redo). Using battle-tested libraries avoids accessibility violations and data corruption bugs.

## Common Pitfalls

### Pitfall 1: SSR/Hydration Mismatch with Persisted State
**What goes wrong:** When using persist middleware, server renders with default state but browser hydrates with localStorage state, causing "Text content does not match" errors.

**Why it happens:** localStorage is browser-only API, unavailable during SSR. Zustand hydrates state synchronously by default, causing mismatch on first render.

**How to avoid:**
- Set `skipHydration: true` in persist options and manually call `rehydrate()` after mount
- Or use `useState` + `useEffect` to defer rendering until hydration complete
- This project is client-only (Vite SPA), but good to know if adding SSR later

**Warning signs:** Console errors about hydration mismatch, content "flashing" from default to persisted state

### Pitfall 2: Persisting Functions or Non-Serializable Data
**What goes wrong:** Store update fails silently, or localStorage contains `[Object object]` / `undefined`, losing configuration on reload.

**Why it happens:** Zustand persist uses JSON.stringify - functions, Symbols, WeakMaps not serializable.

**How to avoid:**
- Only persist plain data (strings, numbers, booleans, arrays, objects)
- Use `partialize` option to exclude non-serializable fields
- Separate data state (persisted) from derived/computed state (runtime only)

**Warning signs:** Config doesn't persist, localStorage value shows `{}` or `null` for expected fields

### Pitfall 3: Shallow Merge Erasing Nested Config Fields
**What goes wrong:** User configures field visibility for nested object fields, then configures label for same object - visibility config is lost.

**Why it happens:** Default persist middleware merge does `{ ...persisted, ...current }`, erasing nested keys not present in current state.

**How to avoid:**
```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'config-storage',
    merge: (persistedState, currentState) => {
      // Use deep merge library or custom recursive merge
      return deepMerge(currentState, persistedState)
    }
  }
)
```

**Warning signs:** Saving one config property "forgets" other properties for same field path

### Pitfall 4: DragOverlay Renders useSortable Component
**What goes wrong:** Drag overlay doesn't render, or renders incorrectly positioned, causing visual glitches.

**Why it happens:** useSortable component has specific positioning/transform logic that conflicts with DragOverlay's overlay rendering.

**How to avoid:** Create separate presentational component for DragOverlay, don't use useSortable inside overlay:
```typescript
// WRONG
<DragOverlay>
  {activeId ? <SortableField id={activeId} /> : null}
</DragOverlay>

// RIGHT
<DragOverlay>
  {activeId ? <FieldPreview id={activeId} /> : null}
</DragOverlay>
```

**Warning signs:** Drag preview not appearing, positioned incorrectly, or causing layout shift

### Pitfall 5: Not Updating Keyboard Sensor Screen Reader Instructions
**What goes wrong:** Screen reader announces incorrect keyboard shortcuts (e.g., "Press Space to activate" when you changed activation to Enter).

**Why it happens:** dnd-kit assumes default keyboard mappings in screenReaderInstructions, doesn't automatically update when you customize keyboard sensor.

**How to avoid:**
```typescript
<DndContext
  sensors={sensors}
  screenReaderInstructions={{
    draggable: 'To pick up a sortable item, press the enter key...',
  }}
>
```
Provide custom instructions whenever changing keyboard sensor configuration.

**Warning signs:** Accessibility audit fails, screen reader users report confusing instructions

### Pitfall 6: ContentEditable Accessibility Issues
**What goes wrong:** Screen readers don't announce editable labels, keyboard focus doesn't work correctly, or label changes don't register.

**Why it happens:** contentEditable without proper ARIA attributes isn't recognized as input by assistive technology.

**How to avoid:**
- Always include `role="textbox"` on contentEditable element
- Provide `aria-label` or `aria-labelledby` for accessible name
- Set `aria-multiline="false"` for single-line inputs
- Make element keyboard-focusable (default for contentEditable)

**Warning signs:** Accessibility linting errors, screen reader doesn't announce "Edit label" or similar

### Pitfall 7: localStorage Quota Exceeded
**What goes wrong:** Config save fails silently, or throws "QuotaExceededError" in console, configurations not persisted.

**Why it happens:** localStorage has 5-10MB limit per origin. Storing large objects (e.g., every API response for preview thumbnails) exhausts quota.

**How to avoid:**
- Only persist minimal configuration data, not full API responses
- Use `partialize` to exclude large fields
- Wrap setItem in try-catch to handle quota errors gracefully
- Consider IndexedDB for larger datasets (not needed for this phase)

**Warning signs:** Console error "QuotaExceededError", localStorage.setItem failing, configs randomly resetting

### Pitfall 8: Stale Closures in Persisted State Updates
**What goes wrong:** Config updates use old state values, causing race conditions where last save doesn't include previous changes.

**Why it happens:** Accessing state outside set callback captures stale value, especially with async operations or rapid updates.

**How to avoid:**
```typescript
// WRONG - captures stale state
const updateConfig = (path: string) => {
  const current = useConfigStore.getState().fieldConfigs[path]
  set({ fieldConfigs: { ...fieldConfigs, [path]: { ...current, visible: false } } })
}

// RIGHT - uses functional update
const updateConfig = (path: string) =>
  set((state) => ({
    fieldConfigs: {
      ...state.fieldConfigs,
      [path]: { ...state.fieldConfigs[path], visible: false }
    }
  }))
```

**Warning signs:** Config changes sometimes "lost", especially when rapidly toggling settings

## Code Examples

Verified patterns from official sources:

### Zustand Store with Persist and Versioning
```typescript
// Source: https://zustand.docs.pmnd.rs/middlewares/persist

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ConfigState {
  version: number
  fieldConfigs: Record<string, { visible: boolean; label?: string }>
  setFieldVisible: (path: string, visible: boolean) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      version: 1,
      fieldConfigs: {},
      setFieldVisible: (path, visible) => set((state) => ({
        fieldConfigs: {
          ...state.fieldConfigs,
          [path]: { ...state.fieldConfigs[path], visible }
        }
      }))
    }),
    {
      name: 'api2ui-config',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from v0 to v1: rename field
          return {
            ...persistedState,
            version: 1,
            fieldConfigs: persistedState.fields || {}
          }
        }
        return persistedState
      }
    }
  )
)
```

### dnd-kit Sortable with Keyboard Support
```typescript
// Source: https://docs.dndkit.com/presets/sortable

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

function SortableList({ items }: { items: string[] }) {
  const [activeItems, setActiveItems] = useState(items)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setActiveItems((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={activeItems} strategy={verticalListSortingStrategy}>
        {/* Render sortable items */}
      </SortableContext>
    </DndContext>
  )
}
```

### Headless UI Slide-Out Panel
```typescript
// Source: https://headlessui.com/v1/react/dialog

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

function SlideOutPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="transform transition ease-in-out duration-300"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transform transition ease-in-out duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <Dialog.Panel className="fixed right-0 top-0 h-full w-96 bg-white overflow-y-auto">
            {/* Panel content */}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  )
}
```

### Native Color Input with Curated Swatches
```typescript
// Source: HTML5 specification + common pattern
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color

const CURATED_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#6366f1'
]

function ColorPicker({
  value,
  onChange
}: {
  value: string
  onChange: (color: string) => void
}) {
  return (
    <div className="space-y-2">
      {/* Curated swatches */}
      <div className="grid grid-cols-4 gap-2">
        {CURATED_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className="w-8 h-8 rounded border-2"
            style={{
              backgroundColor: color,
              borderColor: value === color ? '#000' : '#e5e7eb'
            }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>

      {/* Native color picker for custom colors */}
      <label className="flex items-center gap-2">
        <span>Custom:</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 cursor-pointer"
        />
      </label>
    </div>
  )
}
```

### CSS Theme Variables with Tailwind CSS 4
```css
/* Source: https://tailwindcss.com/docs/theme */

@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --spacing-row: 0.5rem;
  --font-size-base: 1rem;
  --border-radius-base: 0.375rem;
}

@layer base {
  .theme-dark {
    --color-primary: #60a5fa;
    --color-secondary: #a78bfa;
  }

  .theme-compact {
    --spacing-row: 0.25rem;
    --font-size-base: 0.875rem;
  }
}
```

```typescript
// Apply theme at runtime
function ThemeApplier() {
  const { globalTheme, styleOverrides } = useConfigStore()

  useEffect(() => {
    // Apply preset class
    document.documentElement.className = `theme-${globalTheme}`

    // Apply granular overrides
    Object.entries(styleOverrides).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, String(value))
    })
  }, [globalTheme, styleOverrides])

  return null
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | dnd-kit or Pragmatic Drag and Drop | 2023-2024 | react-beautiful-dnd deprecated; dnd-kit more performant, better TypeScript |
| Redux + redux-persist | Zustand + persist middleware | 2020-2024 | Less boilerplate, simpler API, better TypeScript inference |
| Styled-components theming | CSS variables with Tailwind CSS 4 | 2024-2025 | No runtime CSS-in-JS cost, better performance, simpler overrides |
| React Context for modals | Headless UI components | 2021-2024 | Accessibility built-in, less boilerplate, better keyboard/screen reader support |
| Third-party color pickers | Native HTML5 color input | 2018-2026 | Universal browser support achieved, native OS integration |

**Deprecated/outdated:**
- **react-beautiful-dnd**: Officially deprecated, replaced by Pragmatic Drag and Drop (or community uses dnd-kit)
- **Redux for simple state**: Overkill for configuration state; Zustand sufficient for small-to-medium apps
- **Custom localStorage hooks without versioning**: Zustand persist middleware handles migrations, partial persistence
- **Custom modal implementations**: Headless UI provides accessible, tested Dialog/Popover components

## Open Questions

Things that couldn't be fully resolved:

1. **Component Preview Thumbnail Generation**
   - What we know: User wants visual preview picker showing thumbnails of component alternatives before switching
   - What's unclear: How to generate previews (render at small scale? screenshots? SVG icons? hand-designed mockups?)
   - Recommendation: Start with scaled-down live renders (transform: scale(0.5)) with sample data, consider static thumbnails if performance issues arise

2. **"Apply to just this field, or all similar fields?" Dialog UX**
   - What we know: User wants to prompt when overriding component type
   - What's unclear: How to define "similar fields" (same type signature? same path prefix? same data shape?)
   - Recommendation: Define similarity by TypeSignature match (e.g., all Array<object> fields), show list of matching fields in confirmation dialog

3. **Drag-and-Drop Scope for Nested Objects**
   - What we know: Fields can be reordered via drag-and-drop
   - What's unclear: Can user reorder fields within nested objects? Across different nesting levels?
   - Recommendation: Limit reordering to siblings at same nesting level initially; avoid cross-level drag complexity

4. **localStorage Migration Strategy for Breaking Changes**
   - What we know: Zustand persist supports version + migrate function
   - What's unclear: Should old configs be migrated or purged? How to handle incompatible schema changes?
   - Recommendation: Use migrate function for additive changes (new fields with defaults), purge (bump version without migration) for breaking changes

5. **Hidden Field Count Badge Granularity**
   - What we know: Badge count on config button shows number of hidden fields
   - What's unclear: Total hidden fields globally? For current endpoint only? For visible data only?
   - Recommendation: Count hidden fields in current rendered data (not total in schema), makes badge contextually relevant

## Sources

### Primary (HIGH confidence)
- Zustand persist middleware documentation - https://zustand.docs.pmnd.rs/middlewares/persist
- dnd-kit sortable documentation - https://docs.dndkit.com/presets/sortable
- dnd-kit accessibility guide - https://docs.dndkit.com/guides/accessibility
- Headless UI Dialog documentation - https://headlessui.com/v1/react/dialog
- MDN HTML5 color input - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color
- Tailwind CSS 4 theme variables - https://tailwindcss.com/docs/theme
- MDN ARIA textbox role - https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/textbox_role

### Secondary (MEDIUM confidence)
- [Top 5 Drag-and-Drop Libraries for React in 2026 | Puck](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Library comparison
- [How to use CSS variables with React | Josh W. Comeau](https://www.joshwcomeau.com/css/css-variables-for-react-devs/) - CSS variable patterns
- [Build a Flawless, Multi-Theme System using New Tailwind CSS v4 & React | Medium](https://medium.com/render-beyond/build-a-flawless-multi-theme-ui-using-new-tailwind-css-v4-react-dca2b3c95510) - Tailwind CSS 4 theming
- [Mastering State Persistence with Local Storage in React | Medium](https://medium.com/@roman_j/mastering-state-persistence-with-local-storage-in-react-a-complete-guide-1cf3f56ab15c) - localStorage best practices
- [How to migrate Zustand local storage store to a new version | DEV](https://dev.to/diballesteros/how-to-migrate-zustand-local-storage-store-to-a-new-version-njp) - Migration patterns

### Tertiary (LOW confidence)
- [Can I use... HTML5 color input](https://caniuse.com/input-color) - Browser support data
- Various DEV Community and Medium articles on React patterns (WebSearch results) - Community patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official documentation and Context7, already using Zustand 5 and Headless UI 2
- Architecture: HIGH - Patterns verified with official examples from Zustand, dnd-kit, and Headless UI documentation
- Pitfalls: MEDIUM - Common issues documented in GitHub discussions and community articles, some inferred from experience
- Code examples: HIGH - All examples adapted from official documentation with source URLs provided
- Browser support: HIGH - HTML5 color input verified with MDN and Can I Use for 2026

**Research date:** 2026-02-02
**Valid until:** 2026-03-02 (30 days - stable ecosystem)
