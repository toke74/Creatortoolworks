# Analytics and Measurement Plan

## Goals
Measure whether tools solve tasks, which workflows deserve expansion, how users discover related tools, and whether monetization harms experience.

## Core event schema
All events use lowercase snake_case.

| Event | Trigger | Key parameters |
|---|---|---|
| `tool_view` | tool page becomes active | tool_id, category |
| `tool_start` | first meaningful interaction | tool_id, input_mode |
| `tool_complete` | valid result produced | tool_id, result_type |
| `tool_error` | user-visible/tool error | tool_id, error_code |
| `copy_result` | result copied | tool_id, result_type |
| `download_result` | output downloaded | tool_id, file_type |
| `reset_tool` | user resets | tool_id |
| `related_tool_click` | related tool selected | source_tool_id, target_tool_id |
| `source_link_click` | authoritative reference opened | tool_id, source_key |

## Privacy rules
- Never send raw title/description text as analytics parameters.
- Never send uploaded filenames unless explicitly anonymized and justified; default is no.
- Never send full URLs containing user-generated query parameters.
- Avoid user IDs before accounts exist.

## Funnel metrics
1. Tool views.
2. Start rate.
3. Completion rate.
4. Error rate.
5. Copy/download rate.
6. Related-tool continuation rate.

## SEO metrics
Use Search Console for:
- clicks;
- impressions;
- CTR;
- average position (diagnostic, not a standalone success metric);
- page/query coverage;
- index/crawl issues.

## Scale prioritization score
For a live category, prioritize new tools based on a weighted review of:
- demonstrated user demand;
- adjacent Search Console queries;
- repeated creator pain points;
- code reuse potential;
- revenue relevance;
- uniqueness vs existing tools;
- maintenance/freshness burden.

Do not use search volume alone.
