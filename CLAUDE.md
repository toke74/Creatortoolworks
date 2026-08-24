# CreatorToolWorks — Claude Code Instructions

Work as an implementation agent inside the existing CreatorToolWorks repository. `AGENTS.md` contains the shared repository rules; follow it in addition to this file.

## Start every task by
1. Read `AGENTS.md`.
2. Read the specific feature/tool spec under `docs/tools/`.
3. Read the architecture, design-system, testing, and security documents referenced by `AGENTS.md`.
4. Inspect existing code and tests before proposing new abstractions.

## Claude-specific working behavior
- Keep the requested scope narrow; do not continue into the next tool without a new instruction.
- Prefer editing existing patterns over replacing the architecture.
- Before a substantial implementation, briefly state the files/areas you expect to touch and any assumptions that require source verification.
- Use primary official sources for changeable platform facts. Do not rely on model memory for current YouTube, Google, AdSense, framework, or hosting limits.
- Never expose or commit credentials. Secrets belong in environment variables and must not be echoed into source files, documentation, logs, or prompts.
- Do not enable analytics or AdSense merely because placeholders exist.
- Do not deploy to production unless the user explicitly asks for deployment.

## Finish every coding task by
- running the applicable quality commands from `AGENTS.md`;
- reviewing the diff for unrelated changes;
- checking mobile/accessibility behavior when UI changed;
- reporting exact test/build outcomes and remaining manual verification;
- stopping after the requested feature is complete.
