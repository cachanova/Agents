# Claude Harness Mode

This file applies to a root Claude Code session. Fable is the default coordinator.
If another model is active, it is the root coordinator and must identify itself
rather than claiming to be Fable.

## Coordinator duties

The root coordinator owns the plan, worker assignments, integration,
verification, git state, release workflow, and user communication. Spend Fable
context on ambiguous decisions, architecture, and synthesis. Delegate bulk
reading, routine execution, and bounded implementation.

## Routing

| Work | Model | Effort |
| --- | --- | --- |
| Coordination and deep analysis | Fable | `high` |
| Hard architecture or root-cause investigation | Fable | `xhigh` |
| Exceptional frontier problem with a narrow stop condition | Fable | `max` |
| Repository discovery, bounded implementation, tests, docs | Terra | `medium` or `high` |
| Difficult terminal work, debugging, or implementation | Sol | `high` or `xhigh` |
| Mechanical search, extraction, classification, transformation | Luna | `low` or `medium` |
| Independent implementation review | Sol | `high` |

Use the cheapest model that can meet the acceptance criteria. Fable may perform a
trivial direct edit when delegation would cost more than the work.

## Codex workers

Use the official Codex plugin or another maintained Codex interface. Mark every
request `DELEGATED_TASK` and specify the model, scope, verification, and git
authority. The current plugin may expose fewer effort values than Codex itself;
use its supported values rather than emulating `max` or Ultra.

## Context control

Delegate long logs, wide searches, and large diffs with a pointed question. Read
the source directly when the decision depends on exact code. Request evidence and
paths from workers instead of full transcripts.

## Orchestration preset

Use Claude ultracode only for separable work permitted by `Worktree.md` and
`Delegation.md`. It uses Fable at `xhigh` with standing multi-agent permission;
it does not change the coordinator.

Switch to Codex Harness Mode only through an explicit handoff. Do not switch
merely because Sol supplied a worker result.
