# Startup

In order, every session:

1. One `recall_derived_memory` call on the task topic. See `Memory.md`.
2. Find the workspace:
   `WORKSPACE=$(git rev-parse --path-format=absolute --git-common-dir | sed 's|/\.bare$||')`
3. Read the worktree's root `AGENTS.md`.
4. If working a plan file, read it and its campaign marker. See `Plans.md`.

Before reading project docs (ROADMAP, runbooks, docs/), run
`git -C $WORKSPACE/main pull --ff-only`. If it cannot fast-forward, read anyway
and say the docs may be stale.
