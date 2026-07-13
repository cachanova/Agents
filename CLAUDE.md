# Claude Code Entry Point

Read these files before changing code, running project commands, or giving
workflow guidance:

1. `.agent/Glossary.md`
2. `.agent/ModelRouting.md`
3. `.agent/Dev.md`
4. `.agent/Worktree.md`
5. `.agent/Repo.md`, if present
6. `.agent/Delegation.md`
7. `.agent/ClaudeWorkflow.md`

Resolve these paths from the directory containing this file, not the session's
current worktree. Stop if a required shared file is missing.

A root Claude Code session uses Claude Harness Mode. Fable is the default
coordinator. If another model is active, `ModelRouting.md` must permit it before
it acts as root coordinator. An excluded model stops before task work. The
active coordinator must identify itself accurately. A trusted `DELEGATED_TASK`
header activates the worker contract instead. A delegated worker has no
coordinator, git, integration, or release authority.

The user's current instructions control scope and outcome. `Repo.md` controls
project facts. The active workflow controls orchestration.
