# CreatorToolWorks

**Practical tools for creators.**

CreatorToolWorks (`https://creatortoolworks.com`) is a long-term commercial creator-utility platform. The launch category is YouTube tools, with an architecture intended to grow into 100–300 genuinely useful creator tools over time.

## Current state
- Brand/domain locked: CreatorToolWorks / `creatortoolworks.com`
- Documentation pack included under `/docs`
- Six MVP YouTube tools registered as `draft`
- Next.js App Router + TypeScript + Tailwind foundation
- Cloudflare Workers/OpenNext configuration
- Vitest + Playwright test scaffolding
- GitHub Actions CI
- Draft tools are excluded from the sitemap and use `noindex`
- Analytics/AdSense integrations are not enabled

## Bootstrap

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

Because the initial foundation artifact was generated without npm-registry access, it intentionally does not contain `node_modules` or a fabricated lockfile. Run the first install on a network-connected development machine and commit the resulting `pnpm-lock.yaml`.

## Coding-agent entry points
1. `AGENTS.md`
2. `CLAUDE.md` (Claude Code)
3. `docs/20-MASTER-CODING-AGENT-PROMPT.md`
4. `docs/23-CODING-AGENT-HANDOFF.md`
5. `docs/24-TOOL-01-IMPLEMENTATION-BRIEF.md`

## First implementation target
After Phase 0 technical checks pass, implement the **Thumbnail Size Checker**. Do not implement all six MVP tools in a single first pass.
