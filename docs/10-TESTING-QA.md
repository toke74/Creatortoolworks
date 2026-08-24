# Testing and QA Standard

## Test pyramid

### Unit tests
Required for parsers, calculators, analyzers, validators, and formatting logic.

### Component tests
Required for important validation/result states and reusable interaction components.

### E2E smoke tests
At minimum verify:
- homepage loads;
- category/tools discovery works;
- each critical MVP tool can complete its primary task;
- copy/reset works where relevant;
- metadata/404 behavior for representative routes.

## Tool edge cases
Every spec must identify:
- empty input;
- minimum/maximum input;
- whitespace and Unicode;
- malformed numbers/timestamps;
- duplicate values;
- mobile viewport;
- clipboard/download failure where relevant.

## Browser matrix
At minimum test recent Chromium; smoke test Safari/WebKit behavior through Playwright where practical. Mobile viewport testing is mandatory for launch.

## Performance QA
- no obvious layout shift around tool result/ad areas;
- no giant client bundle introduced without justification;
- no image upload sent over network when the spec says client-side only;
- no unnecessary repeated analytics events.

## Content QA
- H1 and metadata are unique;
- platform facts match current official sources;
- no placeholder or duplicated boilerplate paragraphs;
- methodology is visible for scores/estimates;
- related links are useful.

## CI required checks
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- selected `pnpm playwright test` smoke suite

Exact scripts can change, but the capabilities remain mandatory.
