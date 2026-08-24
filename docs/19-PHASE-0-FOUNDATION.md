# Phase 0 — Project Foundation

Status: **Brand/domain locked; dependency installation and first local/runtime verification still required.**

## Decisions locked for the foundation
- Brand: CreatorToolWorks
- Canonical domain: `https://creatortoolworks.com`
- Tagline: Practical tools for creators.
- Framework: Next.js 16.2.11 Active LTS baseline, App Router
- Language: TypeScript strict mode
- UI: React + Tailwind CSS
- Package manager: pnpm
- Primary hosting target: Cloudflare Workers via OpenNext
- Repository/CI: GitHub + GitHub Actions
- Unit/component testing: Vitest + Testing Library
- E2E: Playwright
- MVP database/auth: none
- MVP paid AI/API calls: none
- MVP tool statuses: draft / noindex until each tool passes its release gate

## Brand/domain decision
The brand and domain are now final for the working project:

```text
CreatorToolWorks
https://creatortoolworks.com
Practical tools for creators.
```

The application should use centralized site configuration so normal brand metadata changes never require architecture changes.

## First local bootstrap
```bash
corepack enable
pnpm install
pnpm exec playwright install --with-deps chromium
cp .env.example .env.local
pnpm quality
pnpm test:e2e
pnpm dev
```

Commit the generated `pnpm-lock.yaml` immediately after the first successful install.

## Cloudflare verification
Run before first staging deployment:

```bash
pnpm preview
```

Deploy only when explicitly approved:

```bash
pnpm deploy
```

## Phase 0 exit criteria
- [x] Brand/domain chosen
- [x] Brand/domain recorded in repository
- [ ] Dependencies installed on a network-connected machine
- [ ] `pnpm-lock.yaml` generated and committed
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Playwright Chromium smoke test passes
- [ ] Cloudflare `pnpm preview` succeeds
- [ ] GitHub main branch protected with CI checks
- [ ] No analytics/ad code enabled yet

Once the technical checks pass, begin Phase 1 with **Thumbnail Size Checker** using `docs/24-TOOL-01-IMPLEMENTATION-BRIEF.md`.

## Version policy
The starter pins Next.js 16.2.11 as the foundation baseline. Upgrade dependencies only deliberately: verify current upstream compatibility, run all quality checks, and test the Cloudflare/OpenNext preview before accepting an upgrade.
