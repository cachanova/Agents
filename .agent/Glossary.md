# Glossary

Use these terms consistently.

- **Harness:** The application running a session and controlling its tools,
  context, permissions, and agents.
- **Mode:** The workflow selected by the root harness. Codex Harness Mode uses
  Sol at `high` by default. Claude Harness Mode uses Fable by default and may
  delegate implementation to Codex Sol.
- **Root coordinator:** The model that owns the task plan, delegation,
  integration, verification, git state, and user communication. Each task has
  one root coordinator.
- **Parent:** The root coordinator that assigned a delegated task. Delegation
  depth is one.
- **Delegated worker:** An agent assigned a bounded task. It does not own the
  overall task or widen its scope.
- **Specialist:** A delegated worker selected for expertise rather than routine
  execution.
- **Cross-harness call:** A coordinator invoking a model through the other
  harness. It does not change the active mode.
- **Handoff:** An explicit transfer of coordinator authority. The previous
  coordinator stops coordinating after the transfer.
- **Write scope:** The files or directories a worker may modify.
- **Git owner:** The coordinator responsible for branches, worktrees, commits,
  integration, PRs, merges, and cleanup.
- **Integration:** Combining worker results and resolving conflicts or contract
  mismatches.
- **Verification:** Objective evidence such as tests, typechecks, builds,
  runtime checks, or inspected output.
- **Complete:** The requested outcome is implemented and verified, with no
  required work remaining.

## Models

- **Sol:** `gpt-5.6-sol`
- **Terra:** `gpt-5.6-terra`
- **Opus:** `claude-opus-4-8`
- **Fable:** `claude-fable-5`

`ModelRouting.md` assigns their roles and names excluded models.

## Effort terms

- GPT effort: `none`, `low`, `medium`, `high`, `xhigh`, or `max`.
- Claude effort: `low`, `medium`, `high`, `xhigh`, or `max`.
- **Codex Ultra:** Sol at maximum reasoning with proactive delegation. It is an
  orchestration preset, not an API effort value or harness mode.
- **Claude ultracode:** Claude Code at `xhigh` effort with standing multi-agent
  permission. It does not change coordinator authority and is unrelated to Codex
  Ultra.
