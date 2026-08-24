# SEO and Content Guidelines

## Policy basis
Google states that generative AI can help with research/structure, but generating many pages without adding user value may violate scaled content abuse policies. It also emphasizes helpful, reliable, people-first content.

Official references:
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials

## Indexing gate
Do not index:
- unfinished tools;
- placeholder content;
- keyword variants of the same function;
- thin category/tag pages;
- internal search results by default;
- test/demo routes;
- pages whose output is known to be inaccurate.

## On-page rules
- One clear H1 reflecting the tool task.
- Title/meta written for humans, not stuffed with synonyms.
- Explain the output honestly.
- Scores must have documented logic.
- Estimates must expose assumptions.
- Use examples that are original to the page.
- Link to authoritative sources for volatile platform rules.
- Avoid claims such as “guaranteed to rank,” “boost views instantly,” or invented benchmarks.

## AI-assisted content workflow
AI may draft, summarize sources, propose examples, and check consistency. Before publication, a human/product review must verify:
1. factual claims;
2. platform rules;
3. uniqueness;
4. usefulness;
5. no unsupported statistics;
6. no repetitive filler.

## Technical SEO
- Stable canonical URLs.
- Generated sitemap includes only intended public pages.
- `robots.txt` does not accidentally block tool content or required assets.
- Crawlable `<a>` links for key navigation.
- Descriptive internal anchor text.
- Proper status codes for missing/deprecated content.
- Redirect only when replacement intent matches.

Next.js supports metadata, sitemap, and robots conventions:
- https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

## Programmatic page rule
Programmatic generation is permitted only when the page represents a genuinely distinct task/data entity and passes the same quality gate as a manually authored page. A template does not justify indexing thousands of variants.

## Content freshness
Changeable facts use the source register. Review priority:
- High: YouTube limits/policies and monetization rules.
- Medium: product best-practice wording.
- Low: timeless calculation explanations.
