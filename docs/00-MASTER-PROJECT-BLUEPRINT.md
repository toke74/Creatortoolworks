# Master Project Blueprint — CreatorToolWorks

**Version:** 1.0  
**Baseline date:** 2026-08-19  
**Status:** Approved planning baseline; implementation not yet started

## 1. Executive summary

Build a fast, trustworthy, free web platform containing practical utilities for YouTube creators. Launch with six tools and expand deliberately toward 100–300+ tools only when each new page has distinct utility, adequate quality, and a defensible user need.

The business begins with Google AdSense as the primary monetization model, while preserving optional future revenue from premium features, sponsorships, affiliates, API access, and creator subscriptions. The initial product avoids accounts, persistent storage, and paid AI inference wherever possible so operating cost and privacy risk remain low.

The product is a **single platform**, not a collection of disconnected microsites.

## 2. Mission and positioning

### Mission
Help YouTube creators complete small but frequent publishing tasks faster, with simple tools that work immediately and explain their outputs clearly.

### Positioning statement
For creators who want practical help without installing software or creating an account, the site provides focused browser-based creator utilities with transparent rules, useful explanations, and fast results.

### Product promise
- Free core utilities.
- No login for the initial product.
- Fast, mobile-friendly interfaces.
- Privacy-first processing where technically reasonable.
- Clear assumptions for estimates and scores.
- No fake “AI score” precision.
- No pages created solely to capture keyword variations.

## 3. Long-term business thesis

The economic model depends on a portfolio of useful tools rather than a single viral page. The portfolio should create:

1. many entry points from search and referrals;
2. high internal-tool discovery;
3. repeat usage by creators;
4. multiple pageviews per session without forced pagination;
5. monetizable informational content surrounding real utility;
6. low marginal cost for additional deterministic tools.

The target of 100–300 tools is a **capacity target, not a publishing quota**. Google Search currently warns that generating many pages with AI without adding value may violate its scaled-content-abuse policy. Therefore “number of pages shipped” is never an SEO success metric by itself. Source: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content and https://developers.google.com/search/docs/essentials/spam-policies.

## 4. Initial audience

Primary users:
- New and intermediate YouTube creators.
- YouTube Shorts creators.
- Freelance video editors.
- Channel managers and social media managers.
- Small creator agencies.

Secondary users:
- Educators and podcasters publishing to YouTube.
- Marketing teams repurposing video content.
- Creator-economy consultants.

Initial language: English. Internationalization is a later phase only after the English product has strong quality controls.

## 5. Initial six tools

1. **Thumbnail Size Checker** — inspect uploaded image dimensions, aspect ratio, format, file size, and current YouTube-related checks.
2. **YouTube Timestamp Generator** — convert structured time entries into clean timestamp lines.
3. **Video Description Formatter** — format and validate descriptions, reusable sections, links, calls to action, and length.
4. **Chapter Generator** — build and validate YouTube chapter timestamps.
5. **YouTube Earnings Estimator** — estimate revenue ranges from views and user-supplied RPM assumptions; clearly labeled as an estimate, not official YouTube data.
6. **YouTube Title Analyzer** — deterministic analysis of title length, readability signals, capitalization, repetition, keyword position, and warnings; suggestions must not imply a guaranteed ranking outcome.

Detailed specs are under `docs/tools/`.

## 6. Growth phases

### Phase 0 — Foundation
Deliver documentation, domain/brand decision, repository, design system, analytics plan, CI, deployment pipeline, and reusable tool framework.

### Phase 1 — Six-tool MVP
Ship the first six tools. Validate mobile UX, performance, crawlability, analytics, error handling, and content quality. Do not rush AdSense placement before the product experience is stable.

### Phase 2 — 20 tools
Expand into adjacent, proven creator workflows. Use Search Console queries, tool usage, related-tool clicks, and creator feedback to prioritize.

### Phase 3 — 50 tools
Add category landing pages, stronger internal linking, editorial guides, freshness audits, and automated regression testing across tool templates.

### Phase 4 — 100+ tools
Scale through a mature tool registry, reusable engines, QA automation, source freshness monitoring, and category-level ownership. Avoid near-duplicate tools.

### Phase 5 — 200–300+ tools
Only proceed if the platform still demonstrates discoverability, repeat use, operational maintainability, and meaningful differentiation. Consider non-YouTube creator categories only if the brand architecture supports them.

## 7. Technology decision

### Default stack
- **Framework:** Next.js App Router
- **Language:** TypeScript
- **UI:** React + Tailwind CSS
- **Hosting:** Cloudflare Workers using the supported Next.js/OpenNext path
- **Source control:** GitHub
- **Package manager:** pnpm
- **Unit/component tests:** Vitest + Testing Library
- **Browser/E2E tests:** Playwright
- **Analytics:** Google Analytics 4 plus Google Search Console
- **Monetization:** Google AdSense, centrally controlled
- **Database:** None for MVP; add only when a real feature requires persistence

Cloudflare currently documents support for Next.js App Router, SSG, SSR, ISR, Server Actions, and other common features through its OpenNext adapter. Source: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/.

Vercel remains a valid alternative, but its current Hobby plan is restricted to non-commercial personal use; a monetized site should therefore budget for an appropriate commercial plan if choosing Vercel. Source: https://vercel.com/docs/plans/hobby.

## 8. Architecture principles

1. **Client-side first:** deterministic tools should run in the browser when possible.
2. **No unnecessary data collection:** do not upload user files to a server merely for convenience.
3. **One tool registry:** name, slug, category, status, SEO metadata, related tools, and source freshness live in structured data.
4. **Shared tool shell:** every tool reuses layout, input/output patterns, analytics, errors, content sections, and ad-safe spacing.
5. **Central monetization layer:** individual tools do not embed arbitrary ad code.
6. **Central analytics layer:** events use one typed naming scheme.
7. **Source-aware platform facts:** YouTube limits and requirements have a source URL and `verifiedAt` date.
8. **Progressive complexity:** no database, auth, queues, or AI API unless a validated feature requires them.
9. **Agent-readable repository:** documentation is concise, versioned, and referenced by `AGENTS.md` and `CLAUDE.md`.
10. **Human release authority:** an AI agent may implement and test, but does not independently approve publication.

## 9. SEO strategy

Google Search’s stated focus is helpful, reliable, people-first content, with crawlable links, descriptive page signals, and compliance with spam policies. Sources: https://developers.google.com/search/docs/fundamentals/creating-helpful-content and https://developers.google.com/search/docs/essentials.

### Index only pages that deserve to exist
A tool page may be indexable only when it has:
- functioning utility;
- a unique user intent;
- a stable canonical URL;
- unique explanatory content where explanation is useful;
- examples or guidance appropriate to the task;
- related-tool links chosen for usefulness;
- meaningful title and meta description;
- no placeholder sections or AI filler.

### No fixed word-count target
There is no project rule such as “every page must have 1,000 words.” Content length follows user need. Short tools can have concise instructions; complex estimators require fuller methodology and assumptions.

### No programmatic keyword clones
Do not create variants such as `/youtube-title-analyzer-free`, `/best-youtube-title-analyzer`, `/youtube-title-checker-online` when they solve the same task. One strong canonical tool is preferable.

### Technical SEO baseline
Use Next.js metadata APIs plus generated `sitemap` and `robots` files. Sources: https://nextjs.org/docs/app/getting-started/metadata-and-og-images, https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap, https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots.

## 10. AdSense and monetization strategy

AdSense is a monetization layer, not the product design system. Google’s program policies and ad placement rules must be treated as release constraints. Sources: https://support.google.com/adsense/answer/48182?hl=en and https://support.google.com/adsense/answer/1346295?hl=en.

### Hard guardrails
- Do not encourage ad clicks.
- Do not make ads look like tool actions, downloads, results, navigation, or related tools.
- Keep ads away from high-frequency interactive controls.
- Reserve space for ad containers where possible to reduce layout shift and accidental clicks.
- Do not auto-refresh ads outside permitted behavior.
- Do not let coding agents invent ad placements ad hoc.
- Use a shared `AdSlot` abstraction and approved placement map.
- Test ad layouts at mobile and desktop breakpoints.

### Privacy baseline
A privacy policy must describe relevant third-party advertising/cookie use, and consent/opt-out flows must be implemented where required. Google provides Privacy & messaging tooling for applicable regulations. Sources: https://support.google.com/adsense/answer/1348695?hl=en, https://support.google.com/adsense/answer/7549925?hl=en, https://support.google.com/adsense/answer/10924669?hl=en.

### Monetization expansion options
After product-market evidence:
- affiliate links where genuinely relevant and clearly disclosed;
- premium batch/export features;
- ad-free subscription;
- saved workspaces/account features;
- API access for selected deterministic utilities;
- sponsored creator resources with strict labeling.

## 11. AI coding-agent operating model

OpenAI Codex reads repository `AGENTS.md` instructions before work, while Claude Code supports project instructions via `CLAUDE.md`. Sources: https://developers.openai.com/codex/agent-configuration/agents-md and https://docs.anthropic.com/en/docs/claude-code/memory.

The repository uses both files as thin routing documents. Durable detail stays under `/docs/` to avoid conflicting duplicate policy.

### Agent task lifecycle
1. Read relevant docs.
2. Restate implementation scope internally.
3. Inspect existing patterns before creating new ones.
4. Implement the smallest complete change.
5. Add/update tests.
6. Run typecheck, lint, unit tests, and relevant E2E tests.
7. Review changed files for duplication and policy violations.
8. Update docs/source dates if platform facts changed.
9. Produce a concise handoff with tests run, risks, and files changed.
10. Do not deploy production unless explicitly authorized.

## 12. Tool factory model

Each tool should be composed of reusable platform layers:

```text
Tool registry entry
      ↓
Shared tool page shell
      ↓
Tool-specific input schema + logic
      ↓
Shared result components
      ↓
Shared validation and analytics
      ↓
Unique explanatory content
      ↓
Related-tool graph
```

Adding tool #80 should not require rebuilding site navigation, metadata infrastructure, ad layout, event naming, or accessibility patterns.

## 13. Quality gates

A tool is not “done” because it renders.

Mandatory release gates:
- correct functional output;
- tests for core logic and edge cases;
- responsive mobile/desktop verification;
- keyboard and basic accessibility verification;
- no console errors;
- no leaked secrets;
- no unnecessary network calls;
- accurate current platform facts;
- metadata/canonical/indexing check;
- analytics events verified;
- AdSense-safe layout check;
- original/helpful page copy check;
- build and CI passing.

GitHub branch protection can require status checks before changes merge; this project should use that capability when the repository is established. Source: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches.

## 14. Analytics and KPIs

### Product events
- `tool_view`
- `tool_start`
- `tool_complete`
- `tool_error`
- `copy_result`
- `download_result` (where applicable)
- `reset_tool`
- `related_tool_click`
- `outbound_reference_click`

### Business KPIs
- Organic clicks and impressions by tool/category.
- Tool completion rate.
- Return-user rate.
- Related-tool click-through rate.
- Pages/session.
- Ad viewability and RPM after monetization.
- Core Web Vitals / performance trend.
- Error rate.
- Percentage of indexed pages with meaningful impressions.
- Revenue concentration by tool/category.

Do not optimize CTR by manipulating ad proximity or user confusion.

## 15. Content strategy

Content has four jobs:
1. explain what the tool does;
2. teach correct use;
3. explain assumptions/limitations;
4. connect the user to the next relevant workflow.

Possible content types:
- short on-page guidance;
- examples;
- methodology sections for analyzers/estimators;
- creator guides;
- glossary/help center;
- update notes when YouTube rules change.

All factual YouTube platform limits must be tied to the source register and periodically re-verified.

## 16. Initial operating budget

Keep fixed cost low until traffic validates the concept.

### Expected early cost categories
- Domain registration: annual.
- Hosting: start within an appropriate Cloudflare Workers tier if usage permits; budget to upgrade rather than assuming perpetual free hosting.
- GitHub: free/private repository capabilities may be sufficient initially depending on needed features.
- Analytics/Search Console: no direct product fee for standard use.
- AdSense: no publisher subscription fee.
- AI coding agents: variable subscription/API cost; treat as development expense, not hosting COGS.
- Optional monitoring/email/database: introduce only when required.

**Budget policy:** pricing is volatile. Do not hard-code third-party plan prices into business forecasts without a dated quote. Recheck pricing at purchase/upgrade time.

## 17. Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Thin AI-generated pages | Search/brand risk | Unique utility gate, human QA, no page quota |
| Near-duplicate tools | Crawl dilution and poor UX | Intent-dedup review before backlog approval |
| Incorrect YouTube limits | Loss of trust | Source register + freshness dates |
| Accidental ad clicks | AdSense risk | Central placements, spacing, mobile QA |
| AI agent code drift | Maintenance cost | AGENTS/CLAUDE rules, shared patterns, CI |
| Excess dependencies | Security/performance risk | dependency approval rule |
| Server-side file uploads | Privacy/security risk | browser processing by default |
| Unbounded AI API cost | Margin risk | no inference in initial six tools |
| Premature scaling | hundreds of weak pages | 6 → 20 → 50 gates based on evidence |
| Platform dependence | YouTube/Search/AdSense changes | source audits, diversified traffic/revenue later |

## 18. 90-day implementation sequence

This is a sequence, not a promise of calendar duration.

### Foundation
- Brand/domain locked: CreatorToolWorks / creatortoolworks.com.
- Create GitHub repository.
- Scaffold Next.js/TypeScript/Tailwind project.
- Configure Cloudflare development/deployment path.
- Add lint/typecheck/tests/CI.
- Implement global design tokens and tool registry.
- Implement SEO metadata, sitemap, robots, canonical helpers.
- Implement analytics abstraction.
- Implement privacy/legal page placeholders for later legal review.

### First tools
Recommended implementation order:
1. Timestamp Generator — proves simplest tool pattern.
2. Chapter Generator — reuses timestamp primitives and validation.
3. Title Analyzer — proves analyzer/result pattern.
4. Description Formatter — proves large-text editor pattern.
5. Thumbnail Size Checker — proves local file handling.
6. Earnings Estimator — proves numeric assumptions/ranges/methodology.

### Pre-launch
- Run complete QA checklist.
- Add original supporting copy.
- Verify all external YouTube facts.
- Configure GA4 and Search Console.
- Test production crawlability.
- Establish error monitoring.
- Launch without forcing ads into unstable UI.

### Monetization readiness
- Confirm privacy and consent implementation.
- Review Google Publisher/AdSense policies again on the actual date of integration.
- Add approved ad slots through central component only.
- Test accidental-click risk and layout shift.
- Apply/enable AdSense when the site is substantively useful and policy-ready; there is no internal rule that a specific traffic number guarantees approval.

## 19. Decisions already made

- One brand/site, not six microsites.
- Next.js + TypeScript.
- Cloudflare Workers default hosting.
- No database at MVP.
- No user accounts at MVP.
- No paid AI inference required for first six tools.
- Browser-side processing by default.
- One tool registry.
- Central ad/analytics components.
- AI agents must follow versioned repository instructions.
- Quality and distinct utility outrank page-count growth.

## 20. Decisions still required

- Brand: CreatorToolWorks; domain: creatortoolworks.com.
- Legal entity/owner details for policies and monetization accounts.
- Final visual identity.
- Exact analytics consent setup by target geographies.
- Whether the initial site includes a blog at launch or after the six tools.
- Whether hosting begins on Workers Free or a paid plan based on then-current limits/terms.
- Whether error monitoring uses Sentry, Cloudflare tooling, or another service.

## 21. Definition of business success

The site is succeeding when users repeatedly accomplish creator tasks, discover related useful tools, trust the results, and generate sustainable monetization without compromising product experience or policy compliance.

A larger page count without usage, trust, discoverability, or maintainability is **not** success.

## 22. Companion documents

The detailed rules required to execute this blueprint are in documents `01` through `18`, plus `AGENTS.md`, `CLAUDE.md`, the six initial tool specs, the pull-request template, and the tool-request issue template.
