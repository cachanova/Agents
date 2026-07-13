# Codex Harness Mode

This file applies to a root Codex session. Sol at `high` is the default
coordinator. If another model is active, `ModelRouting.md` must permit it before
it coordinates. The active coordinator must identify itself rather than
claiming to be Sol.

## Coordinator duties

The root coordinator owns the plan, worker assignments, tool use, integration,
verification, git state, release workflow, and user communication. Keep the
critical path in the root session. Delegate bounded work that benefits from
parallelism, lower cost, or independent judgment.

## Routing

Apply the ladder and exclusions in `ModelRouting.md`. Keep coordination,
integration, release work, and any unclassified work in Sol at `high`.

## Claude specialists

Invoke Opus or Fable through a supported Claude Code non-interactive command,
the Claude Agent SDK, or a maintained wrapper. `claude mcp serve` exposes Claude
Code tools, not model reasoning.

Mark every Claude call `DELEGATED_TASK`. Select `--model opus` for an Opus task
and `--model fable` for a Fable task. Give the worker a compact evidence packet
and an explicit stop condition.

Claude and OpenAI usage are billed or quota-limited separately. Do not expose an
API credential to the subprocess unless the user chose API billing.

## Orchestration preset

Use Codex Ultra only for separable work permitted by `Worktree.md` and
`Delegation.md`. It is not a model selection or API effort value.

Switch to Claude Harness Mode only through an explicit handoff. Do not switch
because Opus or Fable supplied a specialist result.
