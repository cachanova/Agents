# Codex Harness Mode

This file applies to a root Codex session. Sol is the default coordinator. If
another model is active, it is the root coordinator and must identify itself
rather than claiming to be Sol.

## Coordinator duties

The root coordinator owns the plan, worker assignments, tool use, integration,
verification, git state, release workflow, and user communication. Keep the
critical path in the root session. Delegate bounded work that benefits from
parallelism, lower cost, or independent judgment.

## Routing

| Work | Model | Effort |
| --- | --- | --- |
| Coordination and ordinary nontrivial work | Sol | `high` |
| Clear routine task | Sol or Terra | `medium` |
| Repository discovery, bounded implementation, tests, docs | Terra | `medium` or `high` |
| Mechanical search, extraction, classification, transformation | Luna | `none`, `low`, or `medium` |
| Difficult debugging or cross-cutting implementation | Sol | `xhigh` |
| Exceptional coupled single-agent problem | Sol | `max` |
| Architecture, deep challenge, high-risk review | Fable | `high` or `xhigh` |

Use the cheapest model that can meet the acceptance criteria. Escalate when a
worker lacks context, judgment, or reliability.

## Fable specialist

Invoke Fable through a supported Claude Code non-interactive command, the Claude
Agent SDK, or a maintained wrapper. `claude mcp serve` exposes Claude Code tools,
not Fable reasoning.

Mark every Fable call `DELEGATED_TASK`. Prefer read-only architecture, diagnosis,
or adversarial review. Give Fable a compact evidence packet and an explicit stop
condition.

Claude and OpenAI usage are billed or quota-limited separately. Do not expose an
API credential to the subprocess unless the user chose API billing.

## Orchestration preset

Use Codex Ultra only for separable work permitted by `Worktree.md` and
`Delegation.md`. It is not a model selection or API effort value.

Switch to Claude Harness Mode only through an explicit handoff. Do not switch
merely because Fable supplied a specialist result.
