# Tool Specification — YouTube Title Analyzer

**Status:** MVP approved for build  
**Last reviewed:** 2026-08-19

## User problem
A creator wants quick deterministic feedback on title formatting and obvious quality signals before publishing.

## URL
`/youtube-tools/title-analyzer`

## Inputs
Title text and optional target keyword/phrase.

## Outputs
- Character count / remaining limit.
- Word count.
- Length status.
- Keyword position (if supplied).
- ALL CAPS proportion / repeated punctuation warnings.
- repeated-word warning.
- lightweight readability/succinctness observations.
- suggestions tied to explicit rules.

## Platform facts
YouTube currently documents a 100-character video title limit. Source: https://support.google.com/youtube/answer/57404?hl=en.
YouTube’s title/thumbnail tips emphasize accuracy and succinctness and warn against overusing ALL CAPS/emoji: https://support.google.com/youtube/answer/12340300?hl=en.

## Scoring policy
If an overall score exists, publish its formula and treat it as an internal heuristic—not a prediction of YouTube ranking or views. Prefer a checklist/diagnostic summary over false precision.

## Prohibited claims
- “SEO score guaranteed to rank.”
- “YouTube algorithm score.”
- claims that keyword placement is an official ranking guarantee.

## Privacy
Browser only; raw title and keyword are not analytics payloads.

## Tests
- 0/1/100/101-character boundaries using the chosen JavaScript counting definition;
- emoji/Unicode;
- all caps;
- repeated punctuation;
- repeated words;
- keyword at start/middle/end/absent;
- whitespace normalization.
