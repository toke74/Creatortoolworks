# Tool #1 Implementation Brief — Thumbnail Size Checker

## Objective
Implement the first production-quality CreatorToolWorks utility at:

`/youtube-tools/thumbnail-size-checker`

Use `docs/tools/01-THUMBNAIL-SIZE-CHECKER.md` as the product specification. This implementation establishes the reference pattern for future tools.

## Scope
Build a client-side thumbnail inspection tool that allows a user to select or drag-and-drop an image and immediately understand its dimensions, aspect ratio, file size, format, and compatibility with currently verified YouTube thumbnail guidance.

## Required user experience
- File picker and drag/drop input.
- Clear drop-zone instructions.
- Accept appropriate image inputs and reject non-image/unsupported inputs gracefully.
- Analyze locally in the browser; never upload the image.
- Display a safe local preview when useful.
- Display width × height.
- Display simplified/calculated aspect ratio.
- Display file size in human-readable units.
- Display declared/detected image type as available in-browser.
- Show each validation rule separately with clear `pass`, `warning`, or `fail` language.
- Explain what the result means and what the creator should do next.
- Provide reset/start-over behavior.
- Work well on narrow mobile screens and desktop.
- Be keyboard accessible and screen-reader understandable.
- Handle bad/corrupt/non-image input without crashing.
- Clean up object URLs/resources when replaced or unmounted.

## Source-dependent requirements
Before implementing YouTube-specific rules, re-open the current official custom-thumbnail source listed in `docs/17-SOURCE-REGISTER.md`.

Do not rely on old model memory such as universal `1280×720` / `2 MB` rules. YouTube guidance and device-specific file-size limits have changed.

Store verified changeable values in `src/lib/platform-facts/` with:
- fact/rule identifier;
- value/conditions;
- official source URL;
- `verifiedAt` date;
- concise human-readable source note where useful.

Validation logic must consume the centralized facts rather than duplicate magic values in components.

## Privacy
- Image bytes stay local.
- No upload endpoint.
- Do not log filename, image bytes, dimensions, exact file size, EXIF data, or other file-specific metadata to analytics.
- Strip/ignore metadata unless the tool genuinely needs it; v1 does not need EXIF inspection.

## Analytics contract
Use the repository analytics abstraction only. Do not enable a vendor.

Allowed event intent:
- `tool_view`
- `tool_start`
- `tool_complete`
- `tool_error`
- `reset_tool`

Analytics payloads must not contain user content/file properties. If the current abstraction is intentionally inert, preserve that behavior.

## Architecture expectations
Prefer a structure similar to:
- pure validation/formatting functions under a tool-specific or shared lib location;
- a focused client component for browser file interaction;
- reusable existing page shell/registry/SEO components;
- tests for business logic separately from UI interaction.

Do not create a giant universal tool framework before Tool #1 proves what needs to be shared.

## SEO/content requirements
- Keep status `draft` / `noindex` during implementation.
- Use registry metadata and existing metadata conventions.
- Add helpful page copy only where it genuinely helps the user understand the tool and YouTube thumbnail requirements.
- Do not pad the page to a word-count target.
- Avoid unsupported claims about ranking, CTR, or guaranteed performance.
- Related tools come from the tool registry.

## Required tests
At minimum cover:
- supported landscape image;
- portrait/non-recommended ratio behavior;
- below-current minimum dimension rule;
- relevant file-size rule branches based on verified source conditions;
- unsupported/non-image file;
- corrupt/unreadable image error;
- reset behavior;
- replacement of one selected image with another;
- object URL cleanup;
- keyboard-accessible file selection;
- mobile Playwright smoke path.

Do not make brittle tests depend on decorative wording when a semantic role/state can be asserted instead.

## Commands before completion
Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Use `pnpm preview` if implementation changes runtime behavior relevant to Cloudflare/OpenNext.

## Non-goals for v1
- Resizing/editing/compressing images.
- AI thumbnail scoring.
- CTR predictions.
- Thumbnail generation.
- Server-side upload/storage.
- User accounts/history.
- Ad placements.
- Enabling analytics vendors.

## Stop condition
Stop when Tool #1 and its relevant tests are complete. Do **not** implement Tool #2, turn on AdSense, deploy production, or change the tool to `live` without a separate instruction.

## Required final report
1. Files changed.
2. What the user can now do.
3. Reusable architecture created (if any).
4. Official platform facts verified and verification date.
5. Tests added.
6. Commands run with exact results.
7. Manual/browser checks still needed.
8. Definition-of-Done gaps, if any.
9. Release recommendation.
