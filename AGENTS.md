# CreatorToolWorks — Repository Instructions for Coding Agents

This repository powers **CreatorToolWorks** (`https://creatortoolworks.com`), a long-term commercial utility platform for content creators. The launch category is YouTube tools; the architecture must remain able to support 100–300 useful creator tools across additional categories over time.

## Read before changing code
1. `docs/00-MASTER-PROJECT-BLUEPRINT.md`
2. `docs/04-TECHNICAL-ARCHITECTURE.md`
3. `docs/05-DESIGN-SYSTEM.md`
4. `docs/06-TOOL-PAGE-SPEC.md`
5. `docs/10-TESTING-QA.md`
6. `docs/11-SECURITY-PRIVACY.md`
7. `docs/13-AI-AGENT-WORKFLOW.md`
8. The relevant `docs/tools/*.md` specification

For SEO/content/monetization work also read docs 07, 08, 09, 16, 17, and 18.

## Product rules
- Brand: **CreatorToolWorks**.
- Canonical production origin: **https://creatortoolworks.com**.
- Tagline: **Practical tools for creators.**
- YouTube is the first category, not the permanent limit of the brand.
- Build one coherent platform, not independent mini-sites.
- Do not bulk-generate tools or thin SEO pages.
- A tool must provide distinct, working user utility before it can become `live`/indexable.

## Engineering guardrails
- Do not deploy production unless explicitly instructed.
- Do not add paid APIs, AI inference, databases, authentication, analytics vendors, ad placements, or major dependencies without explicit approval.
- Do not invent YouTube/Google/platform requirements. Check `docs/17-SOURCE-REGISTER.md`; verify changeable facts from primary sources before shipping dependent logic.
- Centralize changeable platform facts under `src/lib/platform-facts/` with source and verification date.
- Never upload local images/files when the tool spec says browser-only processing.
- Never send raw user input, filenames, file contents, titles, descriptions, timestamps, or other sensitive content to analytics.
- Prefer deterministic, pure TypeScript business logic that can be unit tested.
- Reuse the tool registry, shared layouts, SEO helpers, analytics contract, design tokens, validation patterns, and common components.
- Avoid unrelated refactors and speculative abstractions.
- Preserve canonical URL structure unless a documented architecture decision explicitly changes it.
- Draft tools remain `noindex` and excluded from the sitemap until the release checklist passes.

## Quality requirements
For coding changes, run when applicable:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

For Cloudflare/runtime-sensitive changes, also run:

```bash
pnpm preview
```

If a command cannot run, state why; never claim it passed.

## Completion report
Every completed implementation task must state:
1. scope completed;
2. files changed;
3. tests added/updated;
4. commands run and exact outcomes;
5. manual checks still required;
6. platform facts verified or still needing verification;
7. whether the requested feature satisfies the repository Definition of Done.

Detailed standards live in `/docs`. Keep this file durable and concise; do not duplicate long specifications here.
