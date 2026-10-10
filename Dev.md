# Development Rules

## Scope

- Inspect the relevant code and current state before proposing or making a
  change.
- Make the smallest direct change that completes the requested outcome.
- Preserve unrelated user work. Do not clean up outside the task.
- Ask before an action that materially expands scope, changes external state,
  or needs a product decision the user has not made.
- Choose an approach and commit to it. Revisit it only when new information
  contradicts the reasoning behind it.
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
- Solve the general problem. Do not hardcode values, special-case the test
  inputs, or write helper scripts that only make the given tests pass. If a test
  is wrong or the task is infeasible, say so instead of working around it.
- On a test failure: attempt a fix, show the diff, and let the user approve
  before committing.
- Report every check that did not run or did not pass.

## Build and test output

- Redirect verbose output to a log file: `make -j10 > /tmp/build_<repo>.log 2>&1`.
- Run builds and tests in the background and keep working.
- Read the log only on failure. Use `tail` to check progress on long runs.
- Run the project's formatter or linter before presenting changes.
- Delete any scratch scripts, temporary files, or helpers you created for
  iteration before finishing.

## Tool calls

- When several tool calls are independent, make them in parallel in one message.
- When a call depends on an earlier result, run it after that result arrives.
  Never guess or placeholder a parameter.

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

- Say in one line what you are about to do before the first tool call.
- Lead with the result, decision, or blocker.
- Keep plans and progress updates short. Put status notes in the same message as
  the next tool call rather than ending the turn to report.
- Separate verified facts from inference.
- When handing work back, link the changed files and name the checks that ran.

## Finishing

A message with no tool call ends the turn, and work stops there. Do not end a
turn while work you were asked for is still owed. Four stops to avoid:

- A summary that announces the next step instead of taking it.
- An offer to continue unless the user would prefer otherwise.
- A list of decisions for the user when none of them blocks the remaining work.
  Give your recommendation and carry on with what does not depend on the answer.
- Stopping because a milestone is done or the turn has been long.

Stop only when nothing can move without the user, when the blocker is
deliberately protected from you, or when the task is complete and verified.
This does not override asking before risky or destructive actions.
