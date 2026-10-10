# Development Rules

## Scope

- Inspect the relevant code and current state before proposing or making a
  change.
- Make the smallest direct change that completes the requested outcome.
- Preserve unrelated user work. Do not clean up outside the task.
- Ask before an action that materially expands scope, changes external state,
  or needs a product decision the user has not made.
- When making a judgment call (naming, structure, test approach): state the
  intent briefly, then proceed. Record it in the plan file when working a plan.
- If you find an unrelated issue (bug, stale code, missing test), tell the
  user and move on. Do not fix it unasked.

## One implementation

- Modify the canonical implementation in place.
- No shadow modules, duplicate helpers, alternate endpoints, or parallel code
  paths.
- New behavior is live by default. No feature flags, environment gates, dead
  branches, or commented alternatives unless the user asks.
- No compatibility shims, deprecated aliases, dual behavior, or silent
  fallbacks by default. Update callers and remove the replaced path together.
- Fail clearly when required input is missing.

## Verification

- Reproduce a defect before fixing it. For a regression, add a test that fails
  for the reported reason before changing the code.
- Trace real callers, payloads, and contracts. Do not infer them from names.
- Run focused tests for the changed area, plus lint and typecheck. Run broader
  checks when the change touches shared contracts or release behavior.
- Trust test output, typechecks, builds, diffs, logs, and runtime checks over a
  model's self-review.
- Fix a failed required check and rerun it. Do not call a failure harmless.
- On a test failure: attempt a fix, show the diff, and let the user approve
  before committing.
- Report every check that did not run or did not pass.

## Build and test output

- Redirect verbose output to a log file: `make -j10 > /tmp/build_<repo>.log 2>&1`.
- Run builds and tests in the background and keep working.
- Read the log only on failure. Use `tail` to check progress on long runs.
- Run the project's formatter or linter before presenting changes.

## Performance

- Evaluate memory, CPU, latency, I/O, network volume, and connection use at
  full scale, not on samples.
- Stream, batch, chunk, or paginate large work. Push filtering and aggregation
  into the data store when that reduces transfer or memory.
- Bound queues, caches, concurrency, retries, and intermediate data. Avoid full
  in-memory joins and unnecessary copies.
- State a material resource tradeoff and recommend the lower sustained-cost
  design.

## Secrets

- Use the project's configured secrets manager. Never put credentials in code,
  docs, prompts, logs, command output, or tracked environment files.
- Do not invent a missing credential. Stop and report what the project needs.
- If a secret is exposed, stop using it and report the required rotation.

## System changes

- Minor package installs (pip, npm, cargo) are fine.
- System packages or global config changes: ask first.

## Communication

- Lead with the result, decision, or blocker.
- Keep plans and progress updates short.
- Separate verified facts from inference.
- When handing work back, link the changed files and name the checks that ran.
