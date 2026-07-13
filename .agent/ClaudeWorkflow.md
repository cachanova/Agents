# Claude Harness Mode

This file applies to a root Claude Code session. Fable is the default
coordinator. If another model is active, `ModelRouting.md` must permit it before
it coordinates. The active coordinator must identify itself rather than
claiming to be Fable.

## Coordinator duties

The root coordinator owns the plan, worker assignments, integration,
verification, git state, release workflow, and user communication. Spend Fable
context on coordination, ambiguous decisions, architecture, and synthesis.
Delegate implementation to Codex Sol at `high` by default.

## Routing

Apply the ladder and exclusions in `ModelRouting.md`. Fable owns root
coordination in this mode. Use Sol at `high` for implementation and other
nontrivial delegated work unless a bounded assignment meets the Terra or Opus
boundary. Keep work in Fable when it needs top-tier reasoning or root-level
integration.

## Workers

Use the official Codex plugin or another maintained Codex interface. Send the
assignment envelope from `Delegation.md`. The current plugin may expose fewer
effort values than Codex itself; use its supported values rather than emulating
`max` or Ultra.

For a native Claude worker, select `opus` or `fable` rather than inheriting an
unspecified model. Apply the tier boundary before assigning the worker.

## Context control

Delegate long logs, wide searches, and large diffs with a pointed question. Read
the source directly when the decision depends on exact code. Request evidence and
paths from workers instead of full transcripts.

## Orchestration preset

Use Claude ultracode only for separable work permitted by `Worktree.md` and
`Delegation.md`. It uses Fable at `xhigh` with standing multi-agent permission;
it does not change the coordinator.

Switch to Codex Harness Mode only through an explicit handoff. Do not switch
because Sol or Opus supplied a worker result.
