# Codex Harness Mode

This file applies to a root Codex session. Assume the user started Sol at `high`.
Do not inspect, confirm, or block on the root session's resolved model or effort.
The root coordinator is responsible for selecting the correct model and effort
for every agent it launches according to `ModelRouting.md`.

## Coordinator duties

The root coordinator owns the plan, worker assignments, tool use, integration,
verification, git state, release workflow, and user communication. Keep the
critical path in the root session. Delegate bounded work that benefits from
parallelism, lower cost, or independent judgment.

## Routing

Apply the ladder and exclusions in `ModelRouting.md`. Keep coordination,
integration, release work, and any unclassified work in Sol at `high`.

Parallelism and model choice are separate decisions. Use multiple Sol workers
when independent lanes each require Sol-level judgment. Do not downgrade a lane
only to diversify models or reduce cost.

## Claude specialists

Use the `claude-bridge` MCP server when available:

1. `claude_start` begins a delegated job.
2. `claude_status` checks state and activity; `claude_result` returns the answer.
3. `claude_reply` forks a finished session for a follow-up.
4. `claude_cancel` stops work that is no longer useful.
5. `claude_jobs` recovers detached work and `claude_forget` deletes local state.
Use `claude_health` when authentication or availability is uncertain. The bridge
adds the delegation envelope, blocks recursive agents, runs read-only plan mode,
uses Claude subscription authentication, and disables web tools by default.
`claude mcp serve` exposes Claude Code tools, not model reasoning.

For `claude_start`, set `model` to `opus` or `fable` according to
`ModelRouting.md` and set `effort` explicitly. Pass the initialized Agents
submodule as `policy_root`. For sibling-worktree layouts, also pass the parent
container as `workspace_root` and the main worktree's regular project
`.agent/Repo.md` as `repo_policy_file`. The bridge marks the call
`DELEGATED_TASK`. Give the worker a compact evidence packet and an explicit stop
condition.

Claude and OpenAI usage are quota-limited separately. This bridge never forwards
API billing credentials, but Claude may consume paid extra-usage credits when
that account feature is enabled. A follow-up is post-completion, not live
mid-turn steering.

## Orchestration preset

Use Codex Ultra only for separable work permitted by `Worktree.md` and
`Delegation.md`. It is not a model selection or API effort value.

Switch to Claude Harness Mode only through an explicit handoff. Do not switch
because Opus or Fable supplied a specialist result.
