# Codex Entry Point

Read these files before changing code, running project commands, or giving
workflow guidance:

1. `.agent/Glossary.md`
2. `.agent/ModelRouting.md`
3. `.agent/Dev.md`
4. `.agent/Worktree.md`
5. `.agent/Repo.md`, if present
6. `.agent/Delegation.md`
7. `.agent/CodexWorkflow.md`

Resolve these paths from the directory containing this file, not the session's
current worktree. Stop if a required shared file is missing.

A root Codex session uses Codex Harness Mode and assumes the user started Sol at
`high`. Do not inspect, confirm, or block on the root session's resolved model or
effort. The root coordinator selects every agent it launches according to
`ModelRouting.md`. A trusted `DELEGATED_TASK` header activates the worker
contract instead. A delegated worker has no coordinator, git, integration, or
release authority.

The user's current instructions control scope and outcome. `Repo.md` controls
project facts. The active workflow controls orchestration.
