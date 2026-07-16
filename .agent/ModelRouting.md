# Model Routing

Use Sol at `high` for work that does not meet another tier's boundary. A
user-selected Claude Harness session may use Fable as its root coordinator.

| Tier | Model | Effort |
| --- | --- | --- |
| Simple | Terra | `low` or `medium` |
| Intermediate | Opus | `high` |
| Default | Sol | `high` |
| Top | Fable | `xhigh` or `max` |

## Selection

The allowed model set is Terra, Opus, Sol, and Fable. A root Codex session
assumes Sol at `high` and does not inspect or confirm its own resolved model or
effort. The root coordinator must explicitly select an allowed model and effort
for every agent it launches. Claude Code calls may use the `opus` and `fable`
aliases because each alias stays within one allowed model family.

Do not use `default`, `best`, `opusplan`, or another selector whose resolved
model is unknown. The coordinator owns routing from the launch parameters;
delegated agents do not self-confirm their model identity before task work.

## Boundaries

- Use Terra only for a simple, bounded task with explicit input and output plus
  an objective check. The task must require little judgment.
- Use Opus for a bounded task that needs more context or judgment than Terra but
  does not need Sol-quality reasoning.
- Use Sol for coordination and nontrivial discovery, implementation, debugging,
  integration, synthesis, or review. Raise Sol to `xhigh` for difficult
  tool-driven work and `max` only for coupled Codex work with objective checks.
  Higher Sol effort does not replace Fable for top-tier judgment.
- Use Fable only for top-tier reasoning, such as a high-risk architecture
  decision or a long-running ambiguous investigation that needs judgment beyond
  Sol. Fable may also coordinate a user-selected Claude Harness session; it
  delegates implementation to Sol at `high` by default.

Route away from Sol only when the assignment meets another tier's boundary. Do
not raise Terra or Opus effort to cover a task above its tier. Reassign the task
to Sol or Fable.

## Excluded models

Never select these models:

- Codex Luna (`gpt-5.6-luna`)
- Claude Sonnet (any `claude-sonnet-*` model)

The exclusion covers coordinators, workers, specialists, fallbacks, and
substitutes. Reject an automatic fallback to an excluded model.

If a runtime cannot honor an allowed model, stop before task work. The root
coordinator may issue a new assignment to another allowed model.
