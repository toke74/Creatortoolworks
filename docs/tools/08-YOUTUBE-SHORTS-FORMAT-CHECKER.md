# Tool #8: YouTube Shorts Format Checker

## Status
- Registry id: `youtube-shorts-format-checker`
- Slug: `youtube-shorts-format-checker`
- Category: `shorts`
- Status: `draft`
- Implemented: `true`
- Catalog-visible during owner QA: `true`

## Purpose
Check local video metadata against YouTube's current Shorts duration and square-or-vertical format conditions.

## Browser-only workflow
- The user chooses a local video file.
- The browser reads width, height, duration, file name, and optional file size metadata.
- The video file is not uploaded to CreatorToolWorks or a server.
- If browser metadata cannot be read, manual width, height, and duration fields provide a fallback.

## Official-format checks
- Aspect passes when `width <= height`.
- Aspect fails when `width > height`.
- Duration passes when `duration > 0 && duration <= 180`.
- Exactly 180 seconds passes.
- Anything materially above 180 seconds fails.
- The checker must not claim that 9:16 is required.

## Limitations
Passing this checker does not guarantee upload, distribution, monetization, recommendation, copyright clearance, or final YouTube classification. The tool cannot detect Content ID claims, copyright status, channel/account restrictions, Community Guidelines issues, monetization eligibility, music licensing, or final YouTube processing/classification.

## Sources
- https://support.google.com/youtube/answer/15424877
- https://support.google.com/youtubecreatorstudio/answer/12779649
