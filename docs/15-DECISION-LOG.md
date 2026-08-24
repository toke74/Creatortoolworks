# Decision Log

Use this file for durable architecture/product decisions. Add a new entry rather than silently changing a foundational assumption.

## ADR-001 — Single platform
**Date:** 2026-08-19  
**Decision:** Build one CreatorToolWorks platform, not separate sites per tool; YouTube tools are the launch category.  
**Reason:** shared authority, UX, analytics, maintenance, design system, monetization.

## ADR-002 — Next.js + TypeScript
**Date:** 2026-08-19  
**Decision:** Use Next.js App Router and TypeScript as the baseline application stack.  
**Reason:** strong routing/metadata ecosystem, reusable React UI, agent familiarity.

## ADR-003 — Cloudflare Workers default hosting
**Date:** 2026-08-19  
**Decision:** Default to Cloudflare Workers via supported Next.js/OpenNext integration.  
**Reason:** appropriate global edge platform and currently documented Next.js support. Vercel Pro remains alternative.

## ADR-004 — No database/auth for MVP
**Date:** 2026-08-19  
**Decision:** First six tools have no accounts and no persistent database.  
**Reason:** lower cost, lower privacy risk, simpler operations.

## ADR-005 — Browser processing first
**Date:** 2026-08-19  
**Decision:** Deterministic text/image tools execute client-side where practical.  
**Reason:** privacy, speed, cost.

## ADR-006 — No paid AI dependency for first six
**Date:** 2026-08-19  
**Decision:** MVP outputs are deterministic and explainable.  
**Reason:** predictable cost, testability, no fabricated scoring from opaque prompts.

## ADR-007 — Central platform facts
**Date:** 2026-08-19  
**Decision:** Changeable YouTube limits/rules use centralized values with source URL + verified date.  
**Reason:** easy audit/update across many tools.

## ADR-008 — Quality-gated scaling
**Date:** 2026-08-19  
**Decision:** 100–300 tools is long-term capacity, not a page-production quota.  
**Reason:** protect usefulness, maintainability, search policy compliance.

## ADR-009 — Brand and canonical domain
**Date:** 2026-08-19  
**Decision:** Use **CreatorToolWorks** as the brand, `https://creatortoolworks.com` as the canonical origin, and “Practical tools for creators.” as the working tagline.  
**Reason:** broad enough for the 100–300-tool creator roadmap without tying the brand to a single platform.

## ADR-010 — ESLint pinned to 9.x pending plugin compatibility
**Date:** 2026-08-20
**Status:** accepted
**Context:** The repository baseline (docs/22) recorded ESLint 10.8.1 on 2026-08-19. On first real `pnpm install`, `pnpm lint` crashed: ESLint 10 removed the deprecated `context.getFilename()` API, and `eslint-plugin-react@7.37.5` (the latest published version, pulled in transitively by `eslint-config-next@16.2.11`) still calls it. `eslint-plugin-react`'s own `peerDependencies` cap at `eslint@^9.7`, confirming no ESLint 10 support exists yet. No newer patch of `eslint-config-next` under the pinned Next.js 16.2.x line is available; the only newer release (16.3.1) is tied to a Next.js feature-version bump, which is a separate, deliberate upgrade task per docs/22's upgrade policy.
**Decision:** Pin `eslint` to `9.39.5` (latest 9.x) as a devDependency-only downgrade so `pnpm lint` runs. No application, framework, or Next.js version changed.
**Consequences:** ESLint 9 is past its stated end-of-life date (2026-08-06), so this is a known, temporary gap versus the documented baseline. Revisit when `eslint-plugin-react`/`eslint-config-next` publish ESLint 10 support, or when the project deliberately upgrades to Next.js 16.3.x.
**Alternatives considered:** upgrading Next.js + `eslint-config-next` to 16.3.1 (rejected: out of scope for a bootstrap task, needs its own preview/e2e verification); suppressing the crashing rule in `eslint.config.mjs` (rejected: silently reduces lint coverage instead of fixing the root incompatibility); leaving `pnpm lint` broken (rejected: user asked for the working baseline).

## ADR template
### ADR-XXX — Title
**Date:** YYYY-MM-DD  
**Status:** proposed/accepted/superseded  
**Context:**  
**Decision:**  
**Consequences:**  
**Alternatives considered:**
