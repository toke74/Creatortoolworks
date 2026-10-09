# Tool 09 - YouTube Upload Limit Checker

## Registry
- id: `youtube-upload-limit-checker`
- slug: `youtube-upload-limit-checker`
- category: `uploads`
- status: `draft`
- implemented: `true`
- visibleInCatalog: `true`

## Purpose
Check locally readable video file size and duration against YouTube's currently published upload limits.

## Official facts
Verified 2026-09-19 from YouTube Help:
- Maximum upload size: 256 GB or 12 hours, whichever is less.
- Default upload duration: up to 15 minutes.
- Verified accounts can upload videos longer than 15 minutes.
- Supported video formats are published separately.

## Behavior
- Reads local file name, file size, browser-readable duration, and browser MIME type when available.
- Provides manual fallback for file size and duration.
- Uses decimal GB for validation: 1 GB = 1,000,000,000 bytes.
- Treats exactly 256 GB and exactly 12:00:00 as passing.
- Shows account verification as informational for durations over 15 minutes.
- Does not guarantee upload acceptance, processing, publishing, monetization, account eligibility, rights status, codec validity, or daily upload capacity.

## Privacy
Runs in the browser. The selected video is not uploaded to CreatorToolWorks or a server. Object URLs must be revoked on replacement, clear, and component unmount.
