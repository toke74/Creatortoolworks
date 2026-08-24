# Technical Architecture

## Chosen baseline
- Next.js App Router
- TypeScript (strict mode)
- React
- Tailwind CSS
- pnpm
- Cloudflare Workers deployment via supported Next.js/OpenNext workflow
- GitHub repository + CI
- Vitest + Testing Library
- Playwright

## Rationale
Next.js provides mature routing and metadata primitives suitable for a site with many canonical tool pages. Cloudflare currently documents broad Next.js feature support on Workers through OpenNext. Official reference: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/.

## Repository concept
```text
app/
  (marketing)/
  tools/[slug]/
  categories/[slug]/
components/
  ads/
  analytics/
  layout/
  tool/
lib/
  analytics/
  seo/
  tools/
  validation/
  platform-facts/
content/
  tools/
  guides/
tests/
public/
docs/
```

## Tool registry
A typed registry should be the authoritative discovery layer.

Suggested fields:
```ts
interface ToolDefinition {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  status: 'draft' | 'live' | 'deprecated';
  summary: string;
  relatedToolIds: string[];
  sourceFacts?: string[];
  analyticsId: string;
}
```

Do not put large article bodies in the registry. Keep content separate.

## Tool logic rule
Core transformations/calculations belong in pure TypeScript functions where practical. UI components call the functions; tests validate them independently.

## Rendering rule
- Prefer static generation for stable tool/content pages.
- Use client components only around actual interactivity.
- Use server behavior only when required.
- Avoid forcing every page to dynamic rendering merely because one global component is dynamic.

## Data/storage
MVP uses no database. Browser local storage may be used only for clearly non-sensitive convenience features. If future accounts/saved projects require storage, evaluate a managed PostgreSQL solution and write a new architecture decision record.

## External APIs
Require explicit architecture approval when an API:
- introduces per-use cost;
- receives user content;
- affects core output correctness;
- requires a secret;
- adds a new data processor/vendor.

## Platform facts registry
Facts that can change (title limits, thumbnail requirements, chapter rules) should be centralized:
```ts
{
  key: 'youtube.video.title.maxCharacters',
  value: 100,
  sourceUrl: 'official YouTube Help URL',
  verifiedAt: 'YYYY-MM-DD'
}
```
This makes policy/rule updates auditable.

## Performance rules
- No heavy dependency for a calculation that can be implemented plainly.
- Lazy-load non-critical modules.
- Images have dimensions/aspect ratio reserved.
- Ad containers reserve reasonable layout space when enabled.
- Avoid client-side hydration for static explanatory content.

## Environment variables
- Never commit secrets.
- Document all variables in `.env.example` (without values).
- Validate required variables at build/runtime boundaries.
- Public analytics IDs use explicit public naming; secrets remain server-only.

## CI quality gate
At minimum:
```text
install
→ typecheck
→ lint
→ unit tests
→ build
→ selected Playwright smoke tests
```
Protect the production branch with required checks once repository settings are configured.
