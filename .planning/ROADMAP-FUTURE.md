# api2ui — Product Roadmap

## Vision

**The semantic understanding layer for APIs.** api2ui reads any API, infers meaning from its structure and data, and renders instant interactive UIs for humans — or exposes semantic-aware tools for AI agents. All code is open source. The hosted platform differentiates through accumulated semantic intelligence (shared field cache, curated MCP registry, community corrections, optimized prompts).

## Revenue Model

All features are available in both self-hosted and hosted versions. Paid tiers differentiate on **data advantages and managed services**, not feature gating.

| Tier | Self-hosted equivalent | Hosted value-add |
|------|----------------------|------------------|
| Free | Full feature set | Public shareable links only |
| Pro | Full feature set | Private/expiring links, managed LLM proxy, persistent auth credentials |
| Team | Full feature set | Shared team credentials, shared semantic cache, curated MCP registry |

**Revenue sequencing:** Consulting / early adopters → MCP feature (first product bet) → hosted SaaS → platform

## Open Source Model

- **All code is open source** — self-hosted installations get every feature
- **Data is the moat** — the hosted platform accumulates:
  - Shared semantic field cache (network effect: every user improves detection for all)
  - Curated MCP tool registry (quality-reviewed, versioned)
  - Managed LLM proxy (no BYOK key management needed)
  - Community corrections (field reclassifications feed back into detection)
  - Optimized prompts (refined from real usage patterns)

---

## Semantic Engine Architecture

The semantic detection engine uses a **multi-signal scoring** approach. In v0.5 it transitions from regex-based name matching to **embedding-based name matching** as the primary classification mechanism.

### Scoring Signals

| Signal | Weight | Purpose |
|--------|--------|---------|
| Embedding similarity | 0.40 | Field name → category matching (language-agnostic) |
| Type constraint | 0.20 | JSON type compatibility (number, string, array, etc.) |
| Value validator | 0.30 | Data shape analysis (email format, URL format, date format, number ranges) |
| Format hints | 0.10 | OpenAPI format strings (when available) |

### Embedding Approach: Pre-computed Static Lookup

- **Build time:** Embed ~300-500 field name tokens across target languages using `multilingual-e5-small` (100 languages, 384 dimensions). Compute category centroids (average embedding per category). Export as static JSON files.
- **Runtime:** Split field name into tokens, look up embeddings in static table, average vectors, cosine similarity against 21 category centroids. Pure math — no model download, no GPU, no WASM.
- **Bundle cost:** ~400-800KB (token embeddings + category centroids)
- **Latency:** <10ms for 50 field names
- **Languages:** Any language in multilingual-e5-small training data (100+), with focused vocabulary for EN/ES/FR/DE/PT initially

### Regex Patterns (Legacy, Optional)

The v0.0-v0.4 regex-based name matching system is retained as an optional fallback. Embeddings are the default. Users or contributors can switch to regex mode if needed (e.g., for environments where the ~400-800KB embedding bundle is unacceptable). The regex system will not receive new language additions — multilingual expansion happens through the embedding vocabulary.

---

## Milestones

### v0.5 — Public Release & Foundation

**Goal:** Ship-ready quality, public launch, embedding-first semantic engine, and foundational improvements for everything that follows.

**Phases:**
1. **Quality & Polish** — Fix known tech debt (Buffer polyfill, orphaned files, unused deps), improve error states, loading skeletons, empty states
2. **Embedding-First Semantic Engine** — Build the pre-computed static embedding lookup system:
   - Generate token embeddings for ~300-500 field name tokens across EN/ES/FR/DE/PT using multilingual-e5-small
   - Compute category centroids for all 21 categories
   - Implement token splitting (snake_case, camelCase, dot.notation)
   - Implement cosine similarity scoring integrated into the existing multi-signal pipeline
   - Wire embedding similarity as the default name-matching signal (replacing regex)
   - Retain regex system as optional fallback behind a configuration flag
3. **Value Validator Hardening** — Fix the weak validators exposed by the audit:
   - Status: expand enum to multilingual values OR switch to heuristic (short string, limited distinct values across sample)
   - Rating: tighten range (0-10 instead of 0-100), check for decimal precision patterns
   - SKU: require mixed alphanumeric (not pure alpha or pure numeric)
   - Name/address/title: replace `isNonEmptyString` with more discriminating checks (capitalization patterns, word count, character class distribution)
   - Remove format hints from maxPossibleScore when no OpenAPI spec is present (fixes the silent 10-18% confidence deflation)
4. **Shareable Links (Public)** — Generate client-side shareable URLs encoding API endpoint + view configuration (no backend needed, URL-encoded state)
5. **Documentation & Landing** — Usage guide, example gallery, contributor guide, updated landing page with real demos
6. **Launch Prep** — GitHub release, npm/CDN distribution, Product Hunt / Hacker News preparation

**Key decisions:**
- Embeddings are default, regex is optional fallback (configuration flag)
- multilingual-e5-small for embedding generation (build-time only, not shipped to browser)
- Static lookup table + cosine similarity at runtime (no model in browser)
- Value validator fixes are independent of the embedding work and equally important
- Shareable links use URL hash encoding (no backend), public only in free tier

---

### v1.6 — Semantic MCP Tool Generation

**Goal:** First product bet. Any API becomes a set of semantic-aware MCP tools automatically.

**Phases:**
1. **MCP Protocol Integration** — Implement MCP server protocol, tool/resource primitives
2. **Semantic Tool Generation** — Convert semantic field analysis into typed MCP tool definitions (e.g., price fields get currency-aware parameters, date fields get range filters)
3. **Tool Testing & Validation** — MCP Inspector integration, tool invocation testing, error handling
4. **Export & Distribution** — Export MCP server config as JSON/YAML, one-click copy for Claude Desktop / Cursor / other MCP clients
5. **Diff from Mechanical Conversion** — The differentiator: semantic-aware tools include field descriptions, value constraints, and type hints that mechanical OpenAPI-to-MCP converters miss

**Key decisions:**
- MCP tools are generated client-side (no backend needed yet)
- Each API endpoint becomes one MCP tool with semantically-typed parameters
- Export format follows MCP specification for tool definitions
- Semantic annotations from the embedding engine feed directly into tool descriptions

---

### v1.7 — Natural Language API Querying (BYOK)

**Goal:** Users ask questions about their API data in natural language. Client-side, bring-your-own-key.

**Phases:**
1. **BYOK Key Management** — Secure client-side API key input for OpenAI/Anthropic/etc, sessionStorage persistence (same pattern as API auth in v0.4)
2. **Query Interface** — Chat-style or search-bar query input integrated into the existing UI
3. **Semantic Context Injection** — Feed semantic field analysis into LLM prompts (the API has a "price" field, a "rating" field, etc.) so the LLM understands the data's meaning
4. **Response Rendering** — LLM responses rendered using existing component system (tables, cards, values) — not just plain text

**Key decisions:**
- BYOK only — no backend LLM proxy yet (that's v2.0)
- API keys stored in sessionStorage (same security model as v0.4 auth credentials)
- Vercel AI SDK for provider-agnostic LLM abstraction

---

### v1.8 — Semantic Annotations & Community Layer

**Goal:** Users can correct, refine, and annotate the semantic detection. Groundwork for the shared intelligence network.

**Phases:**
1. **Field Reclassification UI** — Users can manually override semantic categories (e.g., mark a field as "phone" when auto-detection missed it)
2. **Annotation Persistence** — Store corrections in localStorage per-API, export/import annotation sets
3. **Annotation Format Spec** — Define the schema for semantic annotations (field path to category override, confidence adjustment, notes)
4. **Feedback Loop** — Corrections feed into a local "learned patterns" store that improves future detection for that API. New tokens from corrections can be added to the embedding vocabulary.

**Key decisions:**
- Client-side only — annotations stored locally
- Annotation format designed to be backend-compatible (for v2.0 shared cache)
- User corrections can expand the local embedding vocabulary (new field name tokens)
- No shared/community features yet — that requires the hosted platform

---

### v2.0 — Hosted Platform (Backend Begins)

**Goal:** Launch the hosted version. Backend enables shared state, managed LLM, and private shareable links.

**Phases:**
1. **Backend Stack Evaluation** — Evaluate and select backend framework, ORM, database, hosting (candidates discussed: NestJS + Prisma + PostgreSQL on Railway/fly.io — decision deferred to this milestone)
2. **Auth & Accounts** — User accounts, OAuth sign-in, API key management (server-side)
3. **Shared Semantic Cache** — Aggregate anonymous semantic corrections from all users, improve detection for everyone (network effect). Shared embedding vocabulary grows with each correction.
4. **Managed LLM Proxy** — Server-side LLM calls (users don't need their own API keys), with rate limits per tier
5. **Private Shareable Links** — Authenticated links with expiry, link-level permissions
6. **Snapshot Mode** — For authenticated APIs: capture and share a point-in-time data snapshot so recipients don't need API credentials
7. **Server-Side Embedding Classification** — Use OpenAI text-embedding-3-small (or equivalent) for field names not in the static lookup table. Handles any language, any novel field name. Cost: ~$0.000003 per batch of 50 fields. Static lookup remains as offline/free fallback.

**Key decisions:**
- Backend stack decided at the start of this milestone, not before (avoid premature architecture)
- Snapshot mode: default for sharing authenticated APIs (live data requires shared credentials, Team tier)
- Server-side embeddings as the authoritative classifier; client-side static lookup as offline fallback
- Free tier: public links only. Pro: private + expiring links. Team: shared credentials + live data sharing

---

### v2.1 — Team Collaboration

**Goal:** Multiple users work with the same APIs, share configurations, and manage credentials together.

**Phases:**
1. **Team Workspaces** — Team creation, member management, role-based access
2. **Shared API Configurations** — Team-level view configs, component overrides, semantic annotations
3. **Shared Credentials** — Team-level API credentials (Team tier), so team members can access authenticated APIs without sharing keys individually
4. **Activity & Audit** — Who changed what, when, on which API configuration

---

### v2.2 — Export Ecosystem

**Goal:** api2ui as a hub — export semantic understanding to multiple formats and platforms.

**Phases:**
1. **OpenAPI Enhancement** — Export enriched OpenAPI specs with semantic annotations (field descriptions, value constraints, format hints)
2. **TypeScript Type Generation** — Generate TypeScript interfaces from semantic analysis (price fields as number, email as string, etc.)
3. **Postman/Insomnia Export** — Export API configurations to popular API tools
4. **Documentation Generation** — Auto-generate API documentation from semantic analysis

**Branching point:** Evaluate demand for additional export targets (GraphQL schema, database schema, SDK generation)

---

### v2.3 — Smart Caching & Performance

**Goal:** Intelligent caching based on API behavior patterns, reducing unnecessary fetches and improving perceived performance.

**Phases:**
1. **Response Fingerprinting** — Detect which API responses change frequently vs. are stable
2. **Predictive Prefetching** — Pre-fetch related endpoints based on navigation patterns
3. **Offline Mode** — Cache last-known API responses for offline browsing
4. **CDN-Cached Snapshots** — For the hosted platform: cache popular public API renders at the edge

---

### v3.0 — The API Workspace

**Goal:** api2ui becomes the place where APIs are understood, explored, shared, and connected — for both humans and AI agents.

**Phases:**
1. **Multi-API Dashboards** — Combine data from multiple APIs into unified views
2. **API Relationship Mapping** — Detect and visualize relationships between fields across APIs
3. **Agent Orchestration** — Chain MCP tools across multiple APIs for complex workflows
4. **Curated MCP Registry** — Community-contributed, quality-reviewed MCP tool definitions (hosted platform differentiator)
5. **Community Corrections at Scale** — Shared semantic field database, community voting on classifications, continuously expanding embedding vocabulary

**Branching point:** Evaluate AG-UI / A2UI protocol integration for agent-to-user streaming interfaces

---

## Semantic Layer Evolution (Cross-Cutting)

| Milestone | Improvement | Approach |
|-----------|-------------|----------|
| v0.5 | Embedding-first name matching | Pre-computed static lookup (~400-800KB), multilingual-e5-small, cosine similarity |
| v0.5 | Value validator hardening | Fix status enum, rating range, sku specificity, name/address/title discrimination |
| v0.5 | Format hint weight fix | Exclude from maxPossibleScore when no OpenAPI spec present |
| v0.5 | Regex retained as optional | Legacy regex system behind configuration flag, not default |
| v1.8 | User corrections | Manual reclassification, local token vocabulary expansion |
| v2.0 | Server-side embedding API | OpenAI text-embedding-3-small for novel/unknown field names |
| v2.0 | Shared semantic cache | Aggregate corrections + vocabulary from all users (network effect) |
| v3.0 | Community corrections | Voting, moderation, curated field database |

## Sharing Model (Cross-Cutting)

| Feature | v0.5 | v2.0 Free | v2.0 Pro | v2.0 Team |
|---------|------|-----------|----------|-----------|
| Public links | URL-encoded, client-side | Hosted | Hosted | Hosted |
| Private links | -- | -- | With expiry | With expiry |
| Snapshot mode | -- | -- | Yes | Yes |
| Live data sharing | -- | -- | -- | Shared credentials |
| Auth credential persistence | sessionStorage | sessionStorage | Server-side (encrypted) | Server-side (team-scoped) |

---

*Drafted: 2026-02-14, updated 2026-02-14*
*Based on: v0.0-v0.4 shipped, strategic planning session, semantic layer research*
*Architecture decisions (backend stack, hosting) are intentionally deferred to v2.0*
*Semantic engine architecture informed by: codebase audit, Orama evaluation, server-side vector DB comparison, embedding classification research*
