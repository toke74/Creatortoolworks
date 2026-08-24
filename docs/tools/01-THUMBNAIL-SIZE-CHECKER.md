# Tool Specification — Thumbnail Size Checker

**Status:** MVP approved for build; release-readiness pass complete, awaiting release approval  
**Last reviewed:** 2026-08-20

## User problem
A creator has an image and wants to know whether its dimensions, ratio, format, and file size fit current YouTube thumbnail expectations before uploading.

## URL
`/youtube-tools/thumbnail-size-checker`

## Inputs
- Local image file selected or dropped by the user.

## Outputs
- Width × height.
- Aspect ratio.
- File size.
- Detected/declared image format.
- Rule checks with pass/warning/fail language.
- Human-readable next steps.

## Data flow
Process entirely in the browser. Do not upload or store the image. Do not send filename/image metadata to analytics.

## Platform facts
Use the current official YouTube custom-thumbnail page: https://support.google.com/youtube/answer/72431?hl=en.

**Important:** YouTube’s thumbnail guidance/limits have changed over time. Do not hard-code old “1280×720 and 2 MB everywhere” assumptions. Centralize current values with source and `verifiedAt` date.

## Analytics
`tool_view`, `tool_start`, `tool_complete`, `tool_error`, `reset_tool`. No file properties are analytics payloads except coarse result categories if privacy-reviewed.

## Core tests
- valid landscape image;
- portrait image;
- too-small dimensions per current rule;
- unsupported/non-image file;
- very large image handled without server upload;
- object URL cleaned up;
- mobile drop/select flow.

## Non-goals
- Image editing/resizing in v1.
- AI thumbnail quality scoring.
- Server storage.
