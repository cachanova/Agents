# Development Rules

## Scope

- Inspect the relevant code and current state before proposing or making a
  change.
- Make the smallest direct change that completes the requested outcome.
- Preserve unrelated user work. Do not clean up outside the task.
- Ask before an action that materially expands scope, changes external state,
  or requires a product decision the user has not made.

## One implementation

- Modify the canonical implementation in place.
- Do not add shadow modules, duplicate helpers, alternate endpoints, or parallel
  code paths.
- New behavior is live by default. Do not add feature flags, environment gates,
  dead branches, or commented alternatives unless the user requests one.
- Do not add compatibility shims, deprecated aliases, dual behavior, or silent
  fallbacks by default. Update callers and remove the replaced path together.
- Fail clearly when required input is missing.

## Correctness

- Reproduce a defect before fixing it when practical. For a subtle regression,
  add a test that fails for the reported reason before changing the code.
- Trace real callers, payloads, and contracts. Do not infer them from names.
- Run focused tests for the changed area. Add broader checks when the change can
  affect shared contracts or release behavior.
- Prefer test output, typechecks, builds, diffs, logs, and runtime checks over a
  model's self-review.
- Fix a failed required check and rerun it. Do not accept a model's claim that the
  failure is harmless.
- Report verification that did not run or did not pass.

## Performance

- Evaluate memory, CPU, latency, I/O, network volume, and connection use at full
  scale, not only on samples.
- Stream, batch, chunk, or paginate large work. Push filtering and aggregation
  into the data store when that reduces transfer or memory.
- Bound queues, caches, concurrency, retries, and intermediate data. Avoid full
  in-memory joins and unnecessary copies.
- State a material resource tradeoff and recommend the lower sustained-cost
  design.

## Secrets

- Use the project's configured secrets manager. Do not place credentials in
  code, docs, prompts, logs, command output, or tracked environment files.
- Do not invent a missing credential. Stop and report what the project needs.
- If a secret is exposed, stop using it and report the required move or rotation.

## Communication

- Lead with the result, decision, or blocker.
- Keep plans and progress updates short.
- Separate verified facts from inference.
- Link changed files and name the checks that ran when handing work back.
