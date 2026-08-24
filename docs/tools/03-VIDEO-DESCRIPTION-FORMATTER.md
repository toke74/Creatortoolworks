# Tool Specification — Video Description Formatter

**Status:** MVP approved for build  
**Last reviewed:** 2026-08-19

## User problem
Creators want to assemble a clean description from reusable sections without accidental spacing/formatting problems or exceeding platform limits.

## URL
`/youtube-tools/video-description-formatter`

## Inputs
- Description text.
- Optional structured sections: summary, links, credits, CTA, chapters placeholder, disclosures.

## Outputs
- Clean formatted plain text.
- Character count and remaining count.
- Warnings for obvious formatting issues.
- Copy action.

## Platform facts
YouTube currently documents a 5,000-character video description limit. Source: https://support.google.com/youtube/answer/57404?hl=en and https://support.google.com/youtube/answer/12948449?hl=en. Store the actual limit in centralized platform facts with a verified date.

## Rules
- Do not claim formatting features that YouTube does not support.
- Do not rewrite creator content with generative AI in MVP.
- Never automatically insert affiliate claims/disclosures that may be legally inaccurate.

## Privacy
All text remains in browser. Do not send description text to analytics.

## Tests
- empty/whitespace input;
- exactly at limit;
- over limit;
- CRLF/LF normalization;
- repeated blank lines;
- Unicode/emoji counts consistent with selected counting definition;
- copy output.
