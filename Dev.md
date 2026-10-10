# Development

## Scope

- Inspect the code and current state before changing it.
- Make the smallest direct change that completes the request.
- Leave unrelated work alone.
- Ask before expanding scope, changing external state, or making a product
  decision the user has not made.
- Pick an approach and commit. Revisit only on contradicting evidence.
- Judgment calls (naming, structure, tests): state the intent in one line,
  proceed. Record it in the plan file when working a plan.
- Unrelated issue found: tell the user, move on.

## One implementation

- Change the canonical code in place.
- No shadow modules, duplicate helpers, alternate endpoints, parallel paths.
- New behavior is live. No flags, env gates, dead branches, or commented
  alternatives unless asked.
- No shims, deprecated aliases, dual behavior, or silent fallbacks. Update
  callers and delete the old path together.
- Fail clearly on missing required input.

## Verification

- Reproduce a defect before fixing it. For a regression, write the failing
  test first.
- Trace real callers, payloads, and contracts. Do not infer from names.
- Run focused tests, lint, and typecheck. Run broader checks when shared
  contracts or release behavior change.
- Trust test output, builds, diffs, logs, and runtime checks over self-review.
- Fix a failed required check and rerun it. Never call a failure harmless.
- Solve the general problem. No hardcoded values, special-cased test inputs, or
  helper scripts that only pass the given tests. If a test is wrong or the task
  is infeasible, say so.
- Test failure: fix, show the diff, get approval before committing.
- Report every check that did not run or did not pass.

## Build and test output

- Redirect verbose output: `make -j10 > /tmp/build_<repo>.log 2>&1`.
- Run builds and tests in the background. Keep working.
- Read the log only on failure. `tail` for progress.
- Run the project formatter or linter before presenting changes.
- Delete scratch files and helper scripts you created before finishing.

## Tool calls

- Independent calls go in parallel, in one message.
- Dependent calls wait for their inputs. Never guess or placeholder a
  parameter.

## Performance

- Evaluate memory, CPU, latency, I/O, network, and connections at full scale.
- Stream, batch, chunk, or paginate. Push filtering and aggregation into the
  data store.
- Bound queues, caches, concurrency, retries, intermediate data. No full
  in-memory joins or needless copies.
- State a material resource tradeoff. Recommend the lower sustained cost.

## Secrets

- Use the project's secrets manager. No credentials in code, docs, prompts,
  logs, output, or tracked env files.
- Never invent a credential. Stop and report what is needed.
- Exposed secret: stop using it, report the rotation.

## System changes

- Minor package installs (pip, npm, cargo): go ahead.
- System packages or global config: ask first.

## Communication

- One line on what you are about to do before the first tool call.
- Lead with the result, decision, or blocker.
- Short updates. Put status notes in the same message as the next tool call;
  do not end the turn to report.
- Separate verified facts from inference.
- Handing back: link changed files, name the checks that ran.

## Finishing

A message with no tool call ends the turn. Do not end a turn with work still
owed. Four stops to avoid:

- A summary that announces the next step instead of doing it.
- An offer to continue unless the user prefers otherwise.
- A list of decisions when none blocks the remaining work. Recommend, then
  continue with what does not depend on the answer.
- Stopping because a milestone is done or the turn ran long.

Stop only when nothing can move without the user, the blocker is deliberately
protected from you, or the task is complete and verified. Still ask before
risky or destructive actions.
