# Tool Specification — YouTube Timestamp Generator

**Status:** MVP approved for build  
**Last reviewed:** 2026-08-19

## User problem
A creator wants clean timestamp lines without manually normalizing time formats.

## URL
`/youtube-tools/timestamp-generator`

## Inputs
Repeatable rows with time and label. Optional bulk paste mode can be added if it remains simple.

## Outputs
Normalized lines such as `00:00 Intro` suitable for copying.

## Logic
- Parse `m:ss`, `mm:ss`, `h:mm:ss`, and reasonable whitespace.
- Normalize presentation consistently.
- Warn on invalid time.
- Optional sort action must be explicit; do not silently reorder by default unless spec implementation decides and documents it.
- Preserve user labels as text.

## Platform facts
When explaining YouTube chapters, link to official chapters guidance: https://support.google.com/youtube/answer/9884579?hl=en. The generic timestamp formatter itself should not falsely state that every timestamp list automatically becomes chapters.

## Privacy
Browser only; no persistence required.

## Analytics
`tool_view`, `tool_start`, `tool_complete`, `copy_result`, `reset_tool`.

## Tests
- `0:05`, `00:05`, `1:02:03`;
- invalid seconds/minutes;
- duplicate timestamps;
- out-of-order input;
- blank labels;
- Unicode labels;
- copy output.
