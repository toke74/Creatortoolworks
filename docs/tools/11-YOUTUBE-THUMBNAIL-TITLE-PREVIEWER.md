# YouTube Thumbnail & Title Previewer

Status: live, implemented, catalog-visible, and owner-approved. Production release completed 2026-10-18.

Cloudflare Worker Version ID: `72eff517-11b0-431b-a443-3ab86f18a57d` (100% rollout).

URL: `/youtube-tools/youtube-thumbnail-title-previewer`.

## Purpose and scope

Inspect a local thumbnail and unchanged title together in five approximate layouts: desktop large, desktop compact, sidebar/suggested, channel/grid, and mobile feed. Preview appearance controls apply locally to cards. Optional channel name is display-only. Fake views/time metadata is labeled as placeholder content. No duration field, exports, scoring, image analysis, uploads, API, storage, analytics additions, or dependencies.

## Behavior

- Empty image/title state is neutral; readable image plus 1–100 Unicode code points is Ready. Reuses Title Checker report logic. Exactly 100 is valid; 101 is Error.
- Local raster files use browser image decoding and object URLs. Original width, height, filename, and size are informational. Decode errors and non-images produce Error.
- Replacing, clearing, decode failure, and unmount release URLs and detach pending callbacks. Late decode completions cannot restore cleared or replaced images.
- Five cards use centered 16:9 cover presentation. Non-16:9 input is accepted with a crop explanation. Line clamps are visual simulation choices, not YouTube rules. Full input remains unchanged in DOM text and textarea.
- Load example decodes an original, deterministic inline SVG illustration with no external resources. Clear resets all inputs and preview appearance.
- Live page serves HTTP 200 with self-canonical, no noindex, catalog link, and a sitemap entry. Tools #1–#10 remain live.

## Facts and limitations

Official Help pages 72431, 12340300, and 57407 were fetched on 2026-10-18. Reuse centralized thumbnail guidance and title limit; new preview/context facts are in `youtube-thumbnail-title.ts`. See source register for verification details.

Actual rendering varies by device, viewport, font metrics, UI experiments, and updates. Cannot determine CTR, interest, recommendations, ranking, image-content policy compliance, final cropping/truncation/interface, or A/B performance. No universal title-line or safe-length promise.

## Verification

Unit/component coverage: neutral/ready/error boundaries, Unicode and exact text, image decoding states, five layouts, local appearance, example/reset, URL lifecycle, pending decode races. E2E: real fixture decode/replacement, no application/external processing requests, copy claims, live SEO, live-tool regression, keyboard access, runtime errors, responsive overflow, six owner screenshots.

Release validation passed in native Ubuntu WSL2 (Node 22.23.2, pnpm 12.3.4): 383 unit/component tests; full E2E 134 passed, 0 failed, 2 intentional duplicate mobile screenshot skips. Real Workers preview and production each passed 11 browser tests with 1 duplicate mobile screenshot skip, plus desktop/390px functional/privacy smoke checks. Tools #1–#10 passed individual live SEO checks in both environments. No Search Console submission was performed.
