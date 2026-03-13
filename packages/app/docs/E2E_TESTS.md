# api2aux E2E Test Plan (Playwright MCP)

> **Version:** 1.0
> **Date:** 2026-03-12
> **Test count:** 18 core flow tests
> **Executor:** AI assistant using Playwright MCP tools

---

## Prerequisites

1. **Start the dev server:**
   ```bash
   cd /Users/jgt/apiglot/api2aux
   pnpm --filter app dev
   ```
   Wait for: `VITE vX.X.X ready` and `Local: http://localhost:5173/`

2. **Network:** Internet access required — tests hit live external APIs

3. **Browser state:** For a clean run, clear localStorage/sessionStorage before starting:
   ```
   browser_evaluate: localStorage.clear(); sessionStorage.clear()
   ```

4. **Playwright MCP tools used:**
   - `browser_navigate` — go to URLs
   - `browser_snapshot` — read accessible element tree (primary verification)
   - `browser_click` — click elements by ref
   - `browser_fill_form` — fill inputs and dropdowns
   - `browser_wait_for` — wait for text/time
   - `browser_take_screenshot` — visual evidence (optional)

---

## Test Execution Notes

- **Each test is independent.** Start every test by navigating to `http://localhost:5173`.
- **Verify via snapshots, not screenshots.** Accessibility snapshots show element text, labels, roles, and structure. They do NOT show colors, CSS, or animations.
- **Wait after fetches.** After clicking Fetch or an example card, always wait for a specific text string (e.g., "Showing", a spec title, "GraphQL") rather than using arbitrary timeouts. Use 15-second max waits.
- **External API failures are not app bugs.** If an API times out or returns an error, retry once. If it fails again, skip that test and note the API was unreachable.
- **Pass/Fail:** A test passes if ALL expected results are satisfied. It fails if any expected element is missing, wrong, or an unexpected error appears.

---

## Test Cases

### Group 1: Landing & Navigation

#### TC-01: Landing Page Loads Correctly
**Tags:** `landing`
**Preconditions:** None

**Steps:**
1. Navigate to `http://localhost:5173`
2. Take a snapshot

**Expected Results:**
- A heading with text "api2aux" is visible
- A paragraph containing "Paste an API URL" is visible
- A textbox (URL input) is present with placeholder text containing "jsonplaceholder" or similar
- A combobox (HTTP method selector) is present with options "GET" and "POST"
- A button labeled "Fetch" is present
- A button labeled "Change theme" is present
- A section with text "Try an example" is visible
- At least 8 example card buttons are visible, including ones labeled: "Product Catalog", "GitHub Profile", "Space News", "Pet Store API", "D&D 5e API", "Countries (GraphQL)"
- Three feature sections are visible with headings: "Explore", "Chat", "Share"

---

#### TC-16: Examples Page
**Tags:** `examples`, `navigation`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Take a snapshot to confirm landing page loaded
3. Click the button labeled "View all →" in the examples section
4. Wait for text "Back" to appear (examples page loaded)
5. Take a snapshot

**Expected Results after Step 5:**
- The page URL contains `#/examples`
- A "Back" button or link is visible
- Multiple category groupings are visible (look for headings or sections containing words like "Rich Content", "Entertainment", "Data Tables", "API Specs", "GraphQL")
- Multiple example cards are present (more than the 8 featured ones from the landing page)
- Each card shows a title and type badge

**Steps (continued):**
6. Click the "Back" button
7. Wait for text "Try an example" to appear
8. Take a snapshot

**Expected Results after Step 8:**
- The landing page is restored: "api2aux" heading visible, examples carousel visible, URL input visible

---

#### TC-17: Theme Toggle
**Tags:** `theme`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Take a snapshot to confirm landing page
3. Click the button labeled "Change theme"
4. Take a snapshot

**Expected Results after Step 4:**
- A dropdown/popover panel appears near the theme button
- The panel contains 10 theme preset options: Light, Dark, Midnight, Forest, Sand, Ocean, Rose, Slate, Sunset, Nord
- The "Change theme" button shows an expanded/active state

**Steps (continued):**
5. Click outside the theme dropdown (click on the main heading "api2aux") to close it
6. Take a snapshot

**Expected Results after Step 6:**
- The theme dropdown is no longer visible
- The landing page elements remain functional

---

#### TC-18: Clear and Reset
**Tags:** `reset`, `landing`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://dummyjson.com/products` into the URL input textbox
3. Click the "Fetch" button
4. Wait up to 15 seconds for text "Showing" to appear (data loaded)
5. Take a snapshot to confirm data is displayed (a table/list and pagination are visible)
6. Click the button labeled "Clear and start over" (the X icon next to the URL input)
7. Wait for text "Try an example" to appear (landing page restored)
8. Take a snapshot

**Expected Results after Step 8:**
- The URL input is empty or shows only placeholder text
- The examples carousel is visible again ("Try an example" text present)
- The feature cards ("Explore", "Chat", "Share") are visible again
- No table, data rendering, or pagination controls are visible

---

### Group 2: Direct API Fetch

#### TC-02: Fetch Array Data (Products)
**Tags:** `fetch`, `array`, `table`, `pagination`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click on the URL input textbox and clear any existing text
3. Type `https://dummyjson.com/products` into the URL input textbox
4. Ensure the HTTP method combobox shows "GET" (it should be default)
5. Click the "Fetch" button
6. Wait up to 15 seconds for text "Showing" to appear
7. Take a snapshot

**Expected Results after Step 7:**
- A data rendering area is visible below the URL bar
- The rendering shows a table or card list with multiple items
- Item data includes recognizable product fields — look for text like product names, numeric values (prices), or brand names
- Pagination controls are visible at the bottom:
  - Text showing "Showing X-Y of Z" (e.g., "Showing 1-20 of 30")
  - "Prev" and "Next" buttons (Prev may be disabled on first page)
  - Page number buttons
  - A "Per page" combobox with options including 12, 24, 48, 96 (card view) or 10, 20, 50, 100 (table view)
- A drilldown mode toggle is visible with options: "Page", "Dialog", "Panel"
- Layout mode radio buttons are visible (Sidebar/Top bar/Split view)

---

#### TC-03: Fetch Object Data (Single User)
**Tags:** `fetch`, `object`, `detail`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click on the URL input textbox and clear any existing text
3. Type `https://api.github.com/users/steipete` into the URL input textbox
4. Click the "Fetch" button
5. Wait up to 15 seconds for text "steipete" to appear (profile data loaded)
6. Take a snapshot

**Expected Results after Step 6:**
- A detail/profile view is rendered (NOT a table — this is a single object)
- Recognizable GitHub profile fields are visible as labeled key-value pairs, including several of these:
  - "login" with value "steipete"
  - "name" with a person's name
  - "bio" with descriptive text
  - "public_repos" with a number
  - "followers" with a number
- URL fields may render as clickable links
- No pagination controls (this is a single object, not an array)

---

### Group 3: OpenAPI Spec

#### TC-04: Load OpenAPI Spec (D&D 5e API)
**Tags:** `openapi`, `sidebar`, `operations`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Take a snapshot to confirm landing page
3. In the examples carousel, click the button labeled "D&D 5e API"
4. Wait up to 15 seconds for text "endpoints" to appear (spec loaded and sidebar shows endpoint count)
5. Take a snapshot

**Expected Results after Step 5:**
- The URL input now contains `https://api.apis.guru/v2/specs/dnd5eapi.co/0.1/openapi.json`
- A sidebar navigation ("API endpoints") is visible on the left side
- The sidebar shows the API title (containing "5e" or "D&D" or "DnD")
- The sidebar shows an endpoint count (e.g., "X endpoints")
- Operations are listed in the sidebar, grouped by tags — look for operation buttons showing HTTP methods (GET) and paths
- The main content area shows a spec info header with:
  - The API title
  - A version badge
  - An "OpenAPI" badge (not "GraphQL")
- A parameter form area with "Fetch Data" or "Preview" button is visible

---

#### TC-11: Request Preview Modal
**Tags:** `preview`, `openapi`
**Preconditions:** D&D 5e API spec loaded (perform TC-04 steps 1-4 first)

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click the "D&D 5e API" example card
3. Wait up to 15 seconds for text "endpoints" to appear
4. Take a snapshot to confirm spec loaded
5. Locate the "Preview" button in the parameter form area and click it
6. Wait for text "Request Preview" to appear (modal opened)
7. Take a snapshot

**Expected Results after Step 7:**
- A dialog/modal is visible with heading "Request Preview"
- The modal contains a **URL section** showing an HTTP method badge (e.g., "GET") and a URL
- The modal contains a **Headers section** with a table showing header names and values (e.g., "Accept" → "application/json")
- The modal contains a **cURL section** with:
  - A heading containing "cURL"
  - A "Copy" button
  - A curl command string starting with "curl"
- A "Close" button is visible at the bottom of the modal

**Steps (continued):**
8. Click the "Close" button
9. Take a snapshot

**Expected Results after Step 9:**
- The modal is no longer visible
- The underlying spec view and parameter form are still present

---

#### TC-12: Parameter Form Submission (OpenAPI)
**Tags:** `openapi`, `parameters`, `fetch`
**Preconditions:** D&D 5e API spec loaded

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click the "D&D 5e API" example card
3. Wait up to 15 seconds for text "endpoints" to appear
4. Take a snapshot to see the sidebar operations
5. In the sidebar, look for an operation that is likely to return data without required params (e.g., a GET endpoint for listing resources like monsters, spells, classes, etc.). Click that operation button.
6. Take a snapshot to confirm the operation is selected and its parameter form is shown
7. Click the "Fetch Data" button
8. Wait up to 15 seconds for response data to appear — look for text "Showing" or "Response" or a data heading
9. Take a snapshot

**Expected Results after Step 9:**
- Response data is rendered below the parameter form
- The data shows D&D-related content (monster names, spell names, class names, etc.)
- If the response is an array, pagination controls are visible
- If the response is an object, a detail view with key-value pairs is shown
- No error message is displayed

---

### Group 4: GraphQL

#### TC-05: Load GraphQL Spec (Countries)
**Tags:** `graphql`, `sidebar`, `fetch`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Take a snapshot to confirm landing page
3. In the examples carousel, click the button labeled "Countries (GraphQL)"
4. Wait up to 15 seconds for text "GraphQL" to appear on the page (introspection completed, spec loaded)
5. Take a snapshot

**Expected Results after Step 5:**
- The URL input contains `https://countries.trevorblades.com/graphql`
- The HTTP method combobox shows "POST" (not GET)
- A sidebar navigation is visible with heading containing "countries.trevorblades.com"
- The sidebar lists 6 operations displayed as: "POST GraphQL query: continent", "POST GraphQL query: continents", "POST GraphQL query: countries", "POST GraphQL query: country", "POST GraphQL query: language", "POST GraphQL query: languages"
- The spec info area shows a badge with text "GraphQL" (NOT "OpenAPI")
- A request body textarea is visible containing a JSON string with a "query" field

**Steps (continued):**
6. In the sidebar, click the button labeled "POST GraphQL query: countries"
7. Take a snapshot to confirm the countries operation is selected
8. Click the "Fetch Data" button
9. Wait up to 15 seconds for text "Showing" to appear (data loaded with pagination)
10. Take a snapshot

**Expected Results after Step 10:**
- A data rendering area shows country records in a table or list
- Visible country data includes fields like: Name, Capital, Emoji, Currency, or Code
- Country names like "Andorra", "United Arab Emirates", "Afghanistan", or similar are visible
- Emoji flag characters are visible in the data
- Pagination controls show "Showing 1-20 of 250" (approximately 250 countries)
- "Prev"/"Next" buttons and page number links are present
- A "Per page" combobox is visible

---

### Group 5: Authentication

> **Common setup for all auth tests:** Navigate to `http://localhost:5173`. Type any URL into the URL input. The app will auto-fetch and may show an error — **ignore any fetch errors**, they are irrelevant to the auth panel test. Click the lock icon button (labeled "No authentication configured") to open the auth panel.
>
> **Note:** The URL input auto-triggers a fetch when a URL is entered. An error like "API returned 404" may appear because the URL goes through a CORS proxy. This does not affect the auth panel functionality being tested.

#### TC-06: Auth Panel — Cookie
**Tags:** `auth`, `cookie`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://httpbin.org/get` into the URL input textbox
3. Wait 2 seconds for any auto-fetch to complete (an error may appear — ignore it)
4. Click the button labeled "No authentication configured" (lock icon)
5. Take a snapshot to confirm auth panel opened with "Auth Type" dropdown visible
6. In the "Auth Type" combobox, select "Cookie"
7. Take a snapshot

**Expected Results after Step 7:**
- The "Auth Type" combobox shows "Cookie" as selected
- Two form fields appear:
  - A label "Cookie Name" with a text input (placeholder: "session_id")
  - A label "Value" with a password-masked input (placeholder: "Enter cookie value")
- A visibility toggle button (eye icon) is present next to the Value field

---

#### TC-07: Auth Panel — Bearer Token
**Tags:** `auth`, `bearer`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://httpbin.org/get` into the URL input textbox
3. Wait 2 seconds for any auto-fetch to complete (ignore errors)
4. Click the button labeled "No authentication configured"
5. In the "Auth Type" combobox, select "Bearer Token"
6. Take a snapshot

**Expected Results after Step 6:**
- The "Auth Type" combobox shows "Bearer Token" as selected
- One form field appears:
  - A label "Token" with a password-masked input (placeholder: "Enter bearer token")
- A visibility toggle button (eye icon) is present next to the Token field

---

#### TC-08: Auth Panel — Basic Auth
**Tags:** `auth`, `basic`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://httpbin.org/get` into the URL input textbox
3. Wait 2 seconds for any auto-fetch to complete (ignore errors)
4. Click the button labeled "No authentication configured"
5. In the "Auth Type" combobox, select "Basic Auth"
6. Take a snapshot

**Expected Results after Step 6:**
- The "Auth Type" combobox shows "Basic Auth" as selected
- Two form fields appear:
  - A label "Username" with a text input (placeholder: "Enter username")
  - A label "Password" with a password-masked input (placeholder: "Enter password")
- A visibility toggle button (eye icon) is present next to the Password field

---

#### TC-09: Auth Panel — API Key
**Tags:** `auth`, `apikey`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://httpbin.org/get` into the URL input textbox
3. Wait 2 seconds for any auto-fetch to complete (ignore errors)
4. Click the button labeled "No authentication configured"
5. In the "Auth Type" combobox, select "API Key"
6. Take a snapshot

**Expected Results after Step 6:**
- The "Auth Type" combobox shows "API Key" as selected
- Two form fields appear:
  - A label "Header Name" with a text input pre-filled with "X-API-Key"
  - A label "Value" with a password-masked input (placeholder: "Enter API key value")
- A visibility toggle button (eye icon) is present next to the Value field

---

#### TC-10: Auth Panel — Query Parameter
**Tags:** `auth`, `queryparam`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://httpbin.org/get` into the URL input textbox
3. Wait 2 seconds for any auto-fetch to complete (ignore errors)
4. Click the button labeled "No authentication configured"
5. In the "Auth Type" combobox, select "Query Parameter"
6. Take a snapshot

**Expected Results after Step 6:**
- The "Auth Type" combobox shows "Query Parameter" as selected
- Two form fields appear:
  - A label "Parameter Name" with a text input pre-filled with "api_key"
  - A label "Value" with a password-masked input (placeholder: "Enter parameter value")
- A visibility toggle button (eye icon) is present next to the Value field

---

### Group 6: Data Interaction

#### TC-13: Pagination Controls
**Tags:** `pagination`, `table`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://dummyjson.com/products` into the URL input textbox
3. Click the "Fetch" button
4. Wait up to 15 seconds for text "Showing" to appear
5. Take a snapshot to record initial pagination state

**Expected Results after Step 5:**
- Pagination text shows "Showing 1-20 of" followed by a number (e.g., "Showing 1-20 of 30")
- A "Prev" button is present (disabled on first page)
- A "Next" button is present (enabled)
- Page number buttons are visible (at least "1" and "2")
- A "Per page" combobox is visible with options including 12, 24, 48, 96 (card view) or 10, 20, 50, 100 (table view)

**Steps (continued):**
6. Click the "Next" button (or click page number "2")
7. Take a snapshot

**Expected Results after Step 7:**
- The "Showing" text updates to a new range (e.g., "Showing 21-30 of 30" or similar)
- The "Prev" button is now enabled
- The displayed data items are different from the first page
- Page 2 button shows as selected/current

---

#### TC-14: Layout Switcher
**Tags:** `layout`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Click the "D&D 5e API" example card
3. Wait up to 15 seconds for text "endpoints" to appear
4. Take a snapshot to confirm spec loaded with layout controls visible

**Expected Results after Step 4:**
- A layout toggle group is visible with three radio options: "Sidebar layout", "Top bar layout", "Split view layout"
- One of them is checked (default is typically "Top bar layout")

**Steps (continued):**
5. Click the "Sidebar layout" radio button
6. Take a snapshot

**Expected Results after Step 6:**
- The "Sidebar layout" radio is now checked
- The page structure has changed — the parameter form and spec info are arranged differently from the previous layout

**Steps (continued):**
7. Click the "Split view layout" radio button
8. Take a snapshot

**Expected Results after Step 8:**
- The "Split view layout" radio is now checked
- The layout has changed again

**Steps (continued):**
9. Click the "Top bar layout" radio button to restore default
10. Take a snapshot

**Expected Results after Step 10:**
- The "Top bar layout" radio is checked
- The original layout is restored

---

#### TC-15: Drilldown Modes
**Tags:** `drilldown`, `detail`
**Preconditions:** App at landing page

**Steps:**
1. Navigate to `http://localhost:5173`
2. Type `https://dummyjson.com/products` into the URL input textbox
3. Click the "Fetch" button
4. Wait up to 15 seconds for text "Showing" to appear
5. Take a snapshot to confirm data table/list is visible

**Expected Results after Step 5:**
- Data items are visible (table rows or cards)
- Drilldown mode toggle is visible with buttons: "Page", "Dialog", "Panel"
- "Page" mode should be selected by default

**Steps — Test Page mode:**
6. Ensure "Page" mode is selected (click "Page" button if not already active)
7. Click on any data item row/card (the first one) to drill down
8. Take a snapshot

**Expected Results after Step 8:**
- The table is replaced by a detail view showing the item's fields
- A breadcrumb navigation is visible at the top, allowing navigation back
- Individual field values of the product are shown (name, price, description, etc.)

**Steps (continued):**
9. Click the breadcrumb link or back navigation to return to the list
10. Wait for the table to reappear

**Steps — Test Dialog mode:**
11. Click the "Dialog" button in the drilldown mode toggle
12. Click on any data item to drill down
13. Take a snapshot

**Expected Results after Step 13:**
- A modal dialog overlay is visible
- The dialog shows the detail view of the clicked item
- The table/list is still present behind the modal backdrop

**Steps (continued):**
14. Close the dialog (click the X button or close button in the dialog)
15. Take a snapshot to confirm the table is visible again

**Steps — Test Panel mode:**
16. Click the "Panel" button in the drilldown mode toggle
17. Click on any data item to drill down
18. Take a snapshot

**Expected Results after Step 18:**
- A side panel is visible on the right side of the screen
- The panel shows the detail view of the clicked item
- The table/list remains visible on the left side (not hidden)

---

## Appendix

### Example APIs Reference

| API | URL | Method | Body | Used in |
|-----|-----|--------|------|---------|
| DummyJSON Products | `https://dummyjson.com/products` | GET | — | TC-02, TC-13, TC-15, TC-18 |
| DummyJSON Single User | `https://dummyjson.com/users/1` | GET | — | TC-03 |
| D&D 5e API (OpenAPI) | `https://api.apis.guru/v2/specs/dnd5eapi.co/0.1/openapi.json` | GET | — | TC-04, TC-11, TC-12, TC-14 |
| Countries (GraphQL) | `https://countries.trevorblades.com/graphql` | POST | `{"query":"{ countries { name capital emoji currency languages { name } } }"}` | TC-05 |
| httpbin (any URL for auth tests) | `https://httpbin.org/get` | GET | — | TC-06–TC-10 |

### Auth Type Quick Reference

| Auth Type | Dropdown Value | Field 1 | Field 2 | Pre-filled values |
|-----------|---------------|---------|---------|-------------------|
| Bearer | "Bearer Token" | Token (masked) | — | — |
| Basic | "Basic Auth" | Username (text) | Password (masked) | — |
| API Key | "API Key" | Header Name (text) | Value (masked) | Header Name = "X-API-Key" |
| Query Param | "Query Parameter" | Parameter Name (text) | Value (masked) | Parameter Name = "api_key" |
| Cookie | "Cookie" | Cookie Name (text) | Value (masked) | — |

### Known Limitations

1. **Accessibility snapshots** cannot verify colors, CSS styles, animations, or pixel-level layout. Tests only assert element presence, text content, and structural nesting.
2. **External API responses** may change over time (field names, counts, values). Expected results use approximate assertions where possible.
3. **Streaming/SSE (Phase F)** cannot be tested without a live SSE endpoint. The StreamDisplay component is verified through unit tests instead.
4. **LLM Chat (Phase E)** requires an API key and is not tested in this plan. The LLM client refactor is verified through code review.
5. **localStorage persistence** between tests may cause unexpected state. Clear storage before a full test run.
