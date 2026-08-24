# Verified Technology Baseline — 2026-08-19

This file records the external technical baseline used to create the repository foundation. Re-verify before major upgrades.

## Framework/runtime
- **Next.js:** 16.2.11 (Active LTS line selected for the starter). Next.js 16.3.1 is the current feature release, but the project favors the LTS/security line until Cloudflare/OpenNext compatibility is verified in preview.
- **React / React DOM:** 19.2.8.
- **TypeScript:** 5.9.3.
- **Node.js:** project minimum `>=22.13.0`, which also satisfies the current jsdom 30 requirement.

## Styling
- **Tailwind CSS:** 4.3.3.
- **@tailwindcss/postcss:** 4.3.3.
- **PostCSS:** 8.5.26.

## Hosting adapter
- **@opennextjs/cloudflare:** 1.20.2.
- **Wrangler:** 4.120.0 in the package baseline.
- Cloudflare recommends `wrangler.jsonc` for new projects.
- Cloudflare documents Next.js deployment through the OpenNext adapter and recommends testing with the adapter preview because deployed code runs in the Workers `workerd` runtime rather than the Node.js dev runtime.

## Testing
- **Vitest:** 4.1.11.
- **Playwright:** 1.62.1.
- **React Testing Library:** 16.3.2.
- **jsdom:** 30.0.1.

## Linting
- **ESLint:** pinned to **9.39.5** as of 2026-08-20 (see `docs/15-DECISION-LOG.md` ADR-010), not the originally recorded 10.8.1.
- ESLint 9 reached end-of-life on 2026-08-06, so 10.x remains the intended target, but `eslint-plugin-react@7.37.5` (latest published, pulled in by `eslint-config-next@16.2.11`) does not yet support ESLint 10 — its `peerDependencies` cap at `eslint@^9.7` and it calls the removed `context.getFilename()` API. Re-pin to 10.x once the plugin/config catch up.

## Authoritative/current references
- Next.js installation: https://nextjs.org/docs/app/getting-started/installation
- Next.js releases: https://nextjs.org/blog
- Cloudflare Next.js Workers guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- Wrangler configuration: https://developers.cloudflare.com/workers/wrangler/configuration/
- Tailwind PostCSS installation: https://tailwindcss.com/docs/installation/using-postcss
- GitHub Actions Node build/test guide: https://docs.github.com/actions/guides/building-and-testing-nodejs

## Upgrade policy
Do not let an AI agent casually upgrade the framework/toolchain while implementing a tool. Dependency upgrades are separate tasks and must pass:
1. unit tests;
2. production build;
3. Playwright smoke tests;
4. `pnpm preview` in the Cloudflare runtime;
5. a dependency/security review.
