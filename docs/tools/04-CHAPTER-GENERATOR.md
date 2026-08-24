# Tool Specification — Chapter Generator

**Status:** MVP approved for build  
**Last reviewed:** 2026-08-19

## User problem
A creator wants to produce YouTube-compatible manual chapter lines and catch rule violations before pasting them into a description.

## URL
`/youtube-tools/chapter-generator`

## Inputs
Repeatable timestamp + chapter title rows, with optional video duration for richer validation.

## Outputs
- Formatted chapter list.
- Validation summary.
- Per-row errors/warnings.
- Copy action.

## Current platform facts
Official YouTube chapter guidance: https://support.google.com/youtube/answer/9884579?hl=en.
Baseline verified 2026-08-19:
- first timestamp starts at `00:00`;
- at least three timestamps are listed in ascending order;
- minimum chapter length is 10 seconds.

Centralize these values/rules where sensible and keep source date.

## Logic
- Parse/normalize timestamps.
- Validate ascending order.
- Validate first timestamp.
- Validate minimum count.
- Validate interval length between chapter starts; last chapter interval can be validated when video duration is provided.
- Never promise YouTube will display chapters merely because formatting passes; eligibility/display can depend on platform factors.

## Privacy
Browser only.

## Tests
Include every rule boundary, especially 9 vs 10 seconds, duplicate timestamps, `00:00`, three-row minimum, and hour-long videos.
