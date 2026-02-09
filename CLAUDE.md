# Project Instructions

## Git Workflow

- **Always create a new branch from main** before starting any new work (feature, phase execution, bug fix, etc.)
- Branch naming: use descriptive names like `phase-16-context-aware-components`, `fix-cors-error`, etc.
- Do not commit directly to main — work on branches and merge via PR or user instruction.

## Browser Automation

- **Always prefer Playwright** (`mcp__playwright__*`) for browser testing and verification.
- Only fall back to Chrome (`mcp__claude-in-chrome__*`) if Playwright is unavailable.
