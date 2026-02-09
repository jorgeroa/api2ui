---
phase: quick
plan: 004
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/renderers/DetailRenderer.tsx
  - src/components/renderers/DetailRendererGrouped.tsx
autonomous: true

must_haves:
  truths:
    - "Null/undefined fields are hidden by default in detail view"
    - "A toggle allows the user to reveal all fields including nulls"
    - "Toggle state text shows count of hidden null fields (e.g. 'Show 5 empty fields')"
    - "Non-null fields always display regardless of toggle"
    - "Configure mode is unaffected (always shows all fields)"
    - "Grouped detail view also respects null filtering"
  artifacts:
    - path: "src/components/renderers/DetailRenderer.tsx"
      provides: "Null field filtering logic and toggle UI"
      contains: "showNullFields"
    - path: "src/components/renderers/DetailRendererGrouped.tsx"
      provides: "Null field filtering in grouped view"
      contains: "showNullFields"
  key_links:
    - from: "DetailRenderer.tsx"
      to: "DetailRendererGrouped.tsx"
      via: "showNullFields prop"
      pattern: "showNullFields"
---

<objective>
Hide null/undefined fields by default in the detail view, with a toggle to show all fields.

Purpose: Many APIs return objects with numerous null values that clutter the detail view. Hiding them by default gives a cleaner, more focused view while still allowing users to see all fields when needed.

Output: Updated DetailRenderer and DetailRendererGrouped with null-field filtering and a toggle button.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/renderers/DetailRenderer.tsx
@src/components/renderers/DetailRendererGrouped.tsx
@src/components/renderers/FieldRow.tsx
@src/store/configStore.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add null-field filtering and toggle to DetailRenderer</name>
  <files>src/components/renderers/DetailRenderer.tsx</files>
  <action>
Add null-field filtering to DetailRenderer.tsx with these specific changes:

1. Add a `showNullFields` boolean state (default `false`) using useState, near the existing `showGrouped` state (line 69).

2. Create a helper function `isNullOrUndefined(value: unknown): boolean` that returns true if value is `null` or `undefined`. Place it near the other helper functions at the top of the file (around line 16-60). Do NOT treat empty strings, `0`, `false`, or empty arrays as null -- only actual `null` and `undefined`.

3. In the view-mode field filtering (around lines 143-149), add a second filter step after the visibility filter. When `showNullFields` is false, filter out fields where `obj[fieldName]` is null or undefined. This ensures null filtering applies to both grouped and ungrouped paths since `visibleFields` feeds both.

4. Count the number of null/undefined fields that are being hidden. Calculate this as: `sortedFields` that pass the visibility check but fail the null check. Store as `nullFieldCount`.

5. Add a toggle button in the view-mode render output. Place it alongside the existing "Show grouped"/"Show all (ungrouped)" toggle area. The button should:
   - Only appear when `nullFieldCount > 0` (there are actually null fields to show/hide)
   - Not appear in configure mode
   - Show text like "Show N empty" when nulls are hidden, "Hide empty" when shown
   - Use an eye/eye-off icon pattern (simple SVG inline, consistent with existing icon style in the file)
   - Use the same styling pattern as the existing grouping toggle: `text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors px-3 py-1.5`
   - Be placed in a flex row with the grouping toggle (if present), using `gap-2`

6. For the flat (ungrouped) view mode return block (lines 540-601): Wrap the existing grouping toggle and the new null toggle in a shared flex container at the top:
   ```
   <div className="flex justify-end items-center gap-2 -mt-2 -mr-2 mb-2">
     {/* null toggle button */}
     {/* grouping toggle button (existing, moved here) */}
   </div>
   ```
   Show this container if either toggle should appear.

7. Pass `showNullFields` and `setShowNullFields` (or a toggle callback) as props to DetailRendererGrouped when rendering grouped mode. Also pass `nullFieldCount` so the grouped view can show its own toggle.

Important: Do NOT change the configure mode behavior at all. Configure mode already shows all fields (line 143-144) and should continue to do so regardless of null values.

Important: Reset `showNullFields` to `false` when data changes. Add a useEffect that watches `data` and resets the state, so each new API response starts with nulls hidden.
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no type errors. Run `npm run build` to confirm the build succeeds.</verify>
  <done>
    - DetailRenderer filters out null/undefined fields by default in view mode
    - A "Show N empty" / "Hide empty" toggle button appears when null fields exist
    - The toggle correctly shows/hides null fields
    - Configure mode is completely unaffected
    - showNullFields resets to false on data change
  </done>
</task>

<task type="auto">
  <name>Task 2: Add null-field filtering to DetailRendererGrouped</name>
  <files>src/components/renderers/DetailRendererGrouped.tsx</files>
  <action>
Update DetailRendererGrouped to support null-field filtering:

1. Add new props to the `DetailRendererGroupedProps` interface:
   - `showNullFields: boolean`
   - `onToggleNullFields: () => void`
   - `nullFieldCount: number`

2. In the component body, when rendering fields within groups (`renderGroupFields` function, line 185-205), filter out fields where `data[fieldInfo.name]` is null or undefined when `showNullFields` is false. If a group has zero visible fields after filtering, hide the entire group accordion section.

3. Similarly filter the ungrouped overview fields (lines 237-264) and ungrouped tertiary fields (lines 297-299) when `showNullFields` is false.

4. Add the null-field toggle button in the top-right area alongside the existing "Show all (ungrouped)" button (line 210-219). Place both buttons in a flex row with gap-2. Use the same styling and text pattern as Task 1 ("Show N empty" / "Hide empty"). Only show when `nullFieldCount > 0`.

5. Update the caller in DetailRenderer.tsx to pass the three new props when rendering `<DetailRendererGrouped>`:
   - `showNullFields={showNullFields}`
   - `onToggleNullFields={() => setShowNullFields(prev => !prev)}`
   - `nullFieldCount={nullFieldCount}`
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no type errors. Run `npm run build` to confirm the build succeeds. Manually test with an API that returns null fields (e.g., jsonplaceholder.typicode.com/users/1 has some, or dummyjson.com/products/1).</verify>
  <done>
    - Grouped detail view filters null fields from all sections (overview, groups, tertiary)
    - Empty groups are hidden entirely when all their fields are null
    - Toggle button appears in grouped view header alongside the ungrouped toggle
    - Toggle state is shared between grouped and ungrouped views (controlled by parent)
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. Load an API with null fields -- null fields should be hidden by default
4. "Show N empty" button appears when there are hidden null fields
5. Clicking the toggle reveals all fields including nulls
6. Clicking again hides nulls
7. Switching between grouped/ungrouped view preserves the toggle state
8. Configure mode shows all fields regardless (no toggle visible)
9. Loading a new API URL resets the toggle to hidden
</verification>

<success_criteria>
- Null/undefined fields hidden by default in both flat and grouped detail views
- Toggle button with count appears when null fields exist
- Toggle correctly shows/hides null fields in real-time
- Configure mode unaffected
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/004-hide-null-fields-with-show-all-toggle/004-SUMMARY.md`
</output>
