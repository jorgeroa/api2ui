# Project Instructions

## Git Workflow

- **CRITICAL: Always create a new branch from main BEFORE the first commit** — this includes milestone setup, research, planning docs, everything. No exceptions. Create the branch immediately, before writing any files.
- Branch naming: use descriptive names like `v1.4-api-authentication`, `phase-16-context-aware-components`, `fix-cors-error`, etc.
- Do not commit directly to main — all work happens on feature branches and merges via PR or user instruction.

## Browser Automation

- **Always prefer Playwright** (`mcp__playwright__*`) for browser testing and verification.
- Only fall back to Chrome (`mcp__claude-in-chrome__*`) if Playwright is unavailable.
