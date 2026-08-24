# AI Coding Agent Workflow

## Purpose
Make Claude Code, Codex/ChatGPT, and future coding agents predictable contributors to the same codebase.

## Source of truth
1. User/task instruction.
2. Repository `AGENTS.md` / `CLAUDE.md`.
3. Relevant `/docs` specs.
4. Existing tested code patterns.

If a request conflicts with a policy/architecture doc, the agent must surface the conflict rather than silently rewriting the standard.

## Standard implementation prompt structure
A good task includes:
- tool/feature name;
- relevant spec path;
- acceptance criteria;
- files/areas allowed to change if constrained;
- required tests;
- explicit instruction not to deploy unless authorized.

## Agent execution checklist
1. Read spec and architecture docs.
2. Inspect closest existing tool implementation.
3. Identify shared logic/components to reuse.
4. Implement without unrelated refactors.
5. Add/update tests.
6. Run relevant quality commands.
7. Review diff for duplicated code, data leakage, SEO/ad-policy violations.
8. Update source registry if platform facts changed.
9. Report exactly what was changed and what tests ran.

## Prohibited autonomous behavior
An agent must not, without explicit instruction:
- deploy to production;
- add paid services or APIs;
- create a database/account system;
- add advertising placements;
- change analytics consent behavior;
- bulk-generate live tool pages;
- change canonical URL patterns;
- add a major dependency merely for convenience;
- invent YouTube rules or statistics.

## Agent-specific repository instructions
OpenAI Codex supports repository `AGENTS.md`: https://developers.openai.com/codex/agent-configuration/agents-md

Claude Code supports project memory/instructions through `CLAUDE.md`: https://docs.anthropic.com/en/docs/claude-code/memory

Keep these instruction files concise; detailed rules live in `/docs`.

## Review roles (can be separate agent passes)
- **Implementer:** makes the change.
- **Test reviewer:** looks for missed edge cases.
- **SEO/content reviewer:** checks metadata, uniqueness, claims.
- **Security/privacy reviewer:** checks inputs, dependencies, data flow.
- **Final human:** accepts/rejects release.

Separate review passes are valuable, but automated agent review never replaces final product ownership.
