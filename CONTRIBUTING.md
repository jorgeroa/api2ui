# Contributing to api2ui

## Setup

```bash
git clone <repo-url>
cd api2ui
npm install
npm run dev
```

## Running Tests

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- src/services/semantic  # Run a specific directory
```

## Adding a New Semantic Category

Semantic categories define how fields are automatically detected and formatted. To add a new one:

1. **Add to vocabulary** in `scripts/categories.json`:
   ```json
   "my_category": {
     "synonyms": ["my_category", "alias1", "alias2", "sinon_es", "sinon_fr"]
   }
   ```
   Include multilingual synonyms (EN, ES, FR, DE, PT).

2. **Regenerate embeddings**:
   ```bash
   npm run generate-embeddings
   ```
   This runs the `multilingual-e5-small` model against all tokens and outputs:
   - `src/data/category-embeddings.json` (centroids)
   - `src/data/token-embeddings.json` (per-token vectors)

3. **Add the type** to `src/services/semantic/types.ts`:
   ```typescript
   export type SemanticCategory = '...' | 'my_category'
   ```

4. **Create a pattern** in the appropriate file under `src/services/semantic/patterns/`:
   ```typescript
   export const myPattern: SemanticPattern = {
     category: 'my_category',
     namePatterns: [{ regex: /\b(my_category|alias)\b/i, weight: 0.4, languages: ['en'] }],
     typeConstraint: { allowed: ['string'], weight: 0.2 },
     valueValidators: [{ name: 'isMyFormat', validator: (v) => ..., weight: 0.3 }],
     formatHints: [],
     thresholds: { high: 0.75, medium: 0.50 },
   }
   ```

5. **Register the pattern** in `src/services/semantic/detector.ts`.

6. **Add tests** in `detector.test.ts` covering positive matches, negative cases, and multilingual names.

## Adding a Value Validator

Value validators help discriminate between categories. A good validator:
- Returns `true` for values that genuinely belong to the category
- Returns `false` for values that could be anything (avoids false positives)
- Is fast (called per field per sample value)

Example: The SKU validator requires mixed letters + numbers, so pure alphabetic strings ("hello") and pure numeric strings ("12345") fail.

Edit the relevant pattern file in `src/services/semantic/patterns/`.

## Adding a Rendering Component

1. Create the component in `src/components/renderers/`.
2. Register it in `src/components/registry/componentRegistry.ts`.
3. Add selection heuristics in `src/services/selection/heuristics.ts`.
4. The `DynamicRenderer` uses a three-tier precedence: user override > smart selection > fallback.

## Architecture Overview

```
URL Input → Fetch → Schema Inference → Semantic Analysis → Component Selection → Render
                                          ↓
                                    Embedding Classifier
                                    (cosine similarity to
                                     category centroids)
```

The semantic engine uses **competitive scoring**: for each field name, it computes cosine similarity to all 21 category centroids and rank-normalizes (best match = 1.0, worst = 0.0). This handles the dense embedding space where all similarities are 0.85-0.97.

## Code Style

- TypeScript strict mode with `noUncheckedIndexedAccess`
- Functional components with hooks
- Zustand for state management
- No class components
- Tests colocated with source files (`*.test.ts`)
