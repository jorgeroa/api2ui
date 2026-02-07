# Quick Task 003: Improve Configure Mode Attribute Editing UX

## Task Description
Improve the UX for editing attribute names and visibility toggle in Configure Mode:
1. Inline editing: Click label directly to edit (no separate pencil badge), show check/X icons to accept/cancel
2. Visibility icon: Move from far right to left side (near drag handle) to group meta controls

## Files Modified

1. **EditableLabel.tsx** - Inline click-to-edit with check/X icons
2. **FieldControls.tsx** - Move eye icon to left side

## Implementation

### EditableLabel Changes
- Removed pencil icon that appeared on hover
- Made label text directly clickable to enter edit mode
- Added check (save) and X (cancel) icons during edit mode
- Kept Enter/Escape keyboard shortcuts

### FieldControls Changes
- Moved eye icon from `absolute right-0` to left side using flexbox
- Eye icon now appears before field content
- Kept same toggle functionality and SVG icons
