# Claude Code Entry Point

Read these files before changing code, running project commands, or giving
workflow guidance:

1. `.agent/Glossary.md`
2. `.agent/Dev.md`
3. `.agent/Worktree.md`
4. `.agent/Repo.md`, if present
5. `.agent/Delegation.md`
6. `.agent/ClaudeWorkflow.md`

Resolve these paths from the directory containing this file, not the session's
current worktree. Stop if a required shared file is missing.

A root Claude Code session uses Claude Harness Mode. Fable is the default
coordinator. If another model is active, it is the root coordinator and must
identify itself accurately. A trusted `DELEGATED_TASK` header activates the
worker contract instead. A delegated worker has no coordinator, git, integration,
or release authority.

The user's current instructions control scope and outcome. `Repo.md` controls
project facts. The active workflow controls orchestration.
