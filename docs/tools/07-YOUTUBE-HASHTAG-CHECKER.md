# Tool 07 - YouTube Hashtag Checker

## Status
Draft for owner QA. Implemented and visible in catalog, but not live/indexable.

## Purpose
Help creators paste a YouTube title, description, or hashtag list and deterministically extract hashtags in the browser.

## Core behavior
- Extract no-space hashtags from user text without guessing multi-word intent.
- Show total hashtag count, unique hashtag count, duplicate count, and extracted hashtag preview.
- Compare the exact total with YouTube's published more-than-60 threshold.
- Disable copying when 61 or more hashtags are present.
- Copy exactly the displayed extracted hashtag output.
- Provide explicit duplicate cleanup that removes later exact duplicate occurrences only, preserves first occurrence/order, and is idempotent.

## States
- Neutral: empty input or text with no hashtags.
- Ready: 1-60 extracted hashtags.
- Error: 61 or more extracted hashtags.

## Official facts
Source: https://support.google.com/youtube/answer/6390658
Verified: 2026-09-16

- Hashtags may be added to video titles and descriptions.
- Hashtags do not contain spaces.
- If content has more than 60 hashtags, YouTube ignores every hashtag on that content.
- Up to three description hashtags considered most engaging may appear near the video title.
- YouTube determines which hashtags appear; the tool must not claim the first three entered will display.
- Hashtags must comply with YouTube policies.

## Non-goals
No SEO score, popularity score, search volume, trending hashtags, recommended niche hashtags, or best hashtag count.

## Privacy
Entirely browser-only. No API, account connection, upload, server processing, external hashtag lookup, analytics payload with raw input, or network request is required for the calculation.
