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

Parallelism and model choice are separate decisions. Use multiple Sol workers
when independent lanes each require Sol-level judgment. Do not downgrade a lane
only to diversify models or reduce cost.

## Fable specialist

Use the `claude-bridge` MCP server when available:

1. `claude_start` begins a delegated job.
2. `claude_status` checks state and activity; `claude_result` returns the answer.
3. `claude_reply` forks a finished session for a follow-up.
4. `claude_cancel` stops work that is no longer useful.
5. `claude_jobs` recovers detached work and `claude_forget` deletes local state.

Use `claude_health` when authentication or availability is uncertain. The bridge
adds the delegation envelope, blocks recursive agents, runs read-only plan mode,
uses Claude subscription authentication, and disables web tools by default.
`claude mcp serve` exposes Claude Code tools, not Fable reasoning.

For `claude_start`, pass the directory containing the trusted portable
`CLAUDE.md` as `policy_root`; the target `cwd` must be inside it. The bridge marks
the call `DELEGATED_TASK`. Prefer architecture, diagnosis, or adversarial review.
Give Fable a compact evidence packet and an explicit stop condition.

Claude and OpenAI usage are quota-limited separately. This bridge never forwards
API billing credentials, but Claude may consume paid extra-usage credits when
that account feature is enabled. A follow-up is post-completion, not live
mid-turn steering.

## Orchestration preset

Use Codex Ultra only for separable work permitted by `Worktree.md` and
`Delegation.md`. It is not a model selection or API effort value.

Switch to Claude Harness Mode only through an explicit handoff. Do not switch
merely because Fable supplied a specialist result.
