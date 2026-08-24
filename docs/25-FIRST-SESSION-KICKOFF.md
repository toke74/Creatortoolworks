# First Coding Session Kickoff — CreatorToolWorks

Paste the following as the first implementation instruction after opening the repository in Claude Code or Codex.

---

Work directly in this repository as the implementation agent for CreatorToolWorks.

First, read `AGENTS.md`. If you are Claude Code, also read `CLAUDE.md`. Then read:
- `docs/00-MASTER-PROJECT-BLUEPRINT.md`
- `docs/19-PHASE-0-FOUNDATION.md`
- `docs/20-MASTER-CODING-AGENT-PROMPT.md`
- `docs/23-CODING-AGENT-HANDOFF.md`

Do not redesign the architecture, change the brand/domain, enable ads/analytics, add auth/database/paid APIs, or deploy production.

## Part A — Validate the foundation
On this network-connected machine:
1. enable/use the repository package manager;
2. install dependencies;
3. install the Playwright Chromium dependency if needed;
4. create `.env.local` from `.env.example` if it does not exist;
5. run the repository quality/build tests;
6. run the Playwright smoke tests;
7. run the Cloudflare/OpenNext preview if the environment supports it.

Expected commands include:

```bash
corepack enable
pnpm install
pnpm exec playwright install --with-deps chromium
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
pnpm preview
```

If foundation checks fail because of repository code/configuration, diagnose and fix the minimum necessary issue. Do not hide failures. Do not make broad dependency/framework changes without a concrete compatibility reason.

After a successful first install, ensure the generated `pnpm-lock.yaml` is included for commit.

## Part B — Implement Tool #1
After the foundation is healthy enough to proceed, read:
- `docs/tools/01-THUMBNAIL-SIZE-CHECKER.md`
- `docs/24-TOOL-01-IMPLEMENTATION-BRIEF.md`
- `docs/04-TECHNICAL-ARCHITECTURE.md`
- `docs/05-DESIGN-SYSTEM.md`
- `docs/06-TOOL-PAGE-SPEC.md`
- `docs/07-SEO-CONTENT-GUIDELINES.md`
- `docs/09-ANALYTICS-MEASUREMENT-PLAN.md`
- `docs/10-TESTING-QA.md`
- `docs/11-SECURITY-PRIVACY.md`
- `docs/16-LAUNCH-CHECKLIST.md`
- `docs/17-SOURCE-REGISTER.md`

Implement only the Thumbnail Size Checker to production-quality code according to those documents.

Before coding YouTube-specific validation rules, verify the current official YouTube custom-thumbnail documentation referenced in the source register. Put changeable YouTube facts into the centralized platform-facts system with source and verification date. Do not copy old thumbnail limits from model memory.

The image must remain local in the browser. Do not create an upload endpoint. Do not send filename, file contents, exact image metadata, title/text inputs, or other user content to analytics.

Add appropriate tests, run the quality/build/E2E commands again, fix failures caused by your work, and review the final diff.

Keep this tool `draft`/`noindex`. Do not mark it live, do not implement Tool #2, do not enable AdSense, and do not deploy production.

## Final response format
Return:
1. foundation/bootstrap results;
2. files changed;
3. Tool #1 functionality implemented;
4. platform facts verified and source date;
5. tests added/updated;
6. exact commands run and outcomes;
7. manual QA still required;
8. known limitations/non-goals;
9. Definition-of-Done status;
10. release recommendation (`NOT READY`, `READY FOR HUMAN QA`, or `READY FOR RELEASE APPROVAL`).
