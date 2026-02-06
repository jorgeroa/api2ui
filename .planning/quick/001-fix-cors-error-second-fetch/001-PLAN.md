---
type: quick
plan: 001
files_modified:
  - src/App.tsx
  - src/services/urlParser/parser.ts
autonomous: true
---

<objective>
Fix CORS error that occurs on second fetch when parameters contain bracket notation (e.g., `ddcFilter[zipcode]`).

Purpose: The URL reconstruction uses `URLSearchParams` which encodes brackets, causing the reconstructed URL to differ from the original. This breaks CORS because the server sees a different URL pattern.

Output: Second fetch preserves original URL parameter format, preventing CORS errors.
</objective>

<context>
@src/App.tsx
@src/services/urlParser/parser.ts
@src/services/urlParser/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add URL reconstruction helper that preserves original keys</name>
  <files>src/services/urlParser/parser.ts</files>
  <action>
Add a new exported function `reconstructQueryString` that:
1. Takes a Map/Record of parameter names to values
2. Takes the original parsed parameters array (to access `originalKey`)
3. Reconstructs the query string using original keys (not encoded brackets)
4. For parameters not in the original list, use standard encoding

```typescript
/**
 * Reconstruct query string preserving original parameter key format.
 * Uses originalKey from parsed params to preserve bracket notation.
 */
export function reconstructQueryString(
  values: Record<string, string>,
  originalParams: ParsedUrlParameter[]
): string {
  const parts: string[] = []
  const originalKeyMap = new Map(
    originalParams.map(p => [p.name, p.originalKey])
  )

  for (const [name, value] of Object.entries(values)) {
    if (!value) continue // Skip empty values
    const key = originalKeyMap.get(name) ?? name
    // Encode value but preserve key format
    parts.push(`${key}=${encodeURIComponent(value)}`)
  }

  return parts.join('&')
}
```

This preserves `ddcFilter[zipcode]` instead of encoding to `ddcFilter%5Bzipcode%5D`.
  </action>
  <verify>
Run: `npm run build` - should compile without errors
Grep: `reconstructQueryString` appears in parser.ts
  </verify>
  <done>
New helper function exists in parser.ts that reconstructs URLs preserving bracket notation.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update App.tsx to use the new reconstruction helper</name>
  <files>src/App.tsx</files>
  <action>
In the "Direct API URL flow" section (around line 302-337), update the onSubmit handler:

1. Import the new helper and parseUrlParameters:
```typescript
import { parseUrlParameters, reconstructQueryString } from './services/urlParser/parser'
```

2. Change the onSubmit logic from:
```typescript
onSubmit={(values) => {
  const params = new URLSearchParams(values).toString()
  const newUrl = params ? `${baseUrl}?${params}` : baseUrl
  fetchAndInfer(newUrl)
}}
```

To:
```typescript
onSubmit={(values) => {
  // Parse original URL to get original param keys
  const { parameters: originalParams } = parseUrlParameters(currentUrl)
  // Reconstruct preserving original key format (brackets etc)
  const queryString = reconstructQueryString(values, originalParams)
  const newUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl
  fetchAndInfer(newUrl)
}}
```

This ensures `ddcFilter[zipcode]=90242` stays as `ddcFilter[zipcode]=90242` instead of becoming `ddcFilter%5Bzipcode%5D=90242`.
  </action>
  <verify>
Run: `npm run build` - should compile without errors
Run: `npm run dev` and test:
  1. Paste URL with bracket params: `https://skunkworks.doctor.com/widget/get-providers?partner_site_id=241&ddcFilter[zipcode]=90242`
  2. First fetch should work
  3. Modify a parameter and submit
  4. Second fetch should now also work (no CORS error)
  </verify>
  <done>
Second fetch preserves original parameter format, CORS error is fixed.
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes
2. Test with the problematic URL pattern containing brackets
3. Verify first fetch works
4. Modify parameters, verify second fetch works without CORS error
5. Check browser Network tab - reconstructed URL should have unencoded brackets
</verification>

<success_criteria>
- Both first and second fetches work for URLs with bracket notation parameters
- No CORS errors when parameters are modified and re-fetched
- URL in network tab shows unencoded brackets matching original format
</success_criteria>

<output>
After completion, verify the fix works with the specific URL pattern from the bug report.
</output>
