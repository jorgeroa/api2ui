# Quick Task 002: Add API URL Parameter for Auto-Load and Sync

## Summary

Add an `api` URL parameter that:
1. Auto-loads the API URL into the textbox on page load
2. Auto-fetches the API data when the parameter is present
3. Updates the browser URL with the `api` param when Fetch is clicked

Example: `http://localhost:5173/?api=https://dummyjson.com/products`

## Tasks

1. **Read `api` param on load** - Add useEffect in App.tsx to read URL param and auto-fetch
2. **Sync browser URL on Fetch** - Update URLInput.tsx to push state with api param
3. **Sync on example clicks** - Also update URL when clicking example cards

## Files Modified

- `src/App.tsx` - Added useEffect for reading api param on mount
- `src/components/URLInput.tsx` - Added URL sync in handleSubmit and handleExampleClick
