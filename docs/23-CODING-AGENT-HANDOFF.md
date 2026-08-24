# Coding Agent Handoff — CreatorToolWorks

This is the practical handoff guide for running the repository with Claude Code or OpenAI Codex.

## What the agent must receive
Give the coding agent the **entire repository**, not isolated prompt files. The repository includes the business blueprint, architecture, tool specifications, reusable app foundation, testing setup, and durable agent rules.

Minimum repository context:
- `AGENTS.md`
- `CLAUDE.md` (Claude Code)
- `/docs`
- `/src`
- `/tests`
- `.github/workflows/ci.yml`
- `package.json`
- Next.js, Playwright, Vitest, OpenNext, and Wrangler configuration files

## First machine/bootstrap task
On a network-connected development machine, before feature implementation:

```bash
corepack enable
pnpm install
pnpm exec playwright install --with-deps chromium
cp .env.example .env.local
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm preview
```

Commit the generated `pnpm-lock.yaml` after the first successful install. Do not fabricate one.

If any bootstrap command fails because of the foundation rather than machine setup, fix the foundation before implementing Tool #1.

## Secrets policy
Do not give a coding agent passwords in chat prompts or commit them to Git.

Do not provide AdSense, Google, Cloudflare, GitHub, registrar, email, or analytics secrets until a task genuinely requires them. When needed, use the provider's secret/environment mechanism and least-privilege access.

## Claude Code kickoff
Open Claude Code at repository root and paste the kickoff prompt from `docs/20-MASTER-CODING-AGENT-PROMPT.md`, followed by the current task from `docs/24-TOOL-01-IMPLEMENTATION-BRIEF.md`.

Claude should read `CLAUDE.md` and `AGENTS.md` before implementation.

## Codex kickoff
Open Codex at repository root and give it the current task. Codex should automatically receive applicable `AGENTS.md` guidance; still explicitly instruct it to read the project docs named by `AGENTS.md` before changing code.

Use `docs/20-MASTER-CODING-AGENT-PROMPT.md` as the durable kickoff when starting a fresh session.

## One-tool workflow
Use three passes for each substantial tool:

### Pass 1 — Implement
Build only the approved tool specification and its tests.

### Pass 2 — Audit
In a separate agent turn, ask the agent to review its implementation against:
- tool specification;
- testing/QA document;
- accessibility requirements;
- security/privacy document;
- SEO/content guidance;
- launch checklist.

The audit should fix verified gaps but should not add unrelated features.

### Pass 3 — Human verification
A human checks:
- desktop and mobile UX;
- actual browser behavior;
- copy clarity;
- edge cases with real inputs;
- visual consistency;
- source-dependent claims;
- whether the tool genuinely deserves to be published/indexed.

Only after this should release status be considered.

## After Tool #1
Before Tool #2, run one dedicated reuse/refactoring pass. Identify components, hooks, validation utilities, test helpers, layouts, and patterns from Tool #1 that genuinely benefit future tools. Refactor only clear duplication/general-purpose patterns; avoid premature framework-building.

Tool #1 is the reference implementation for future utility pages.
