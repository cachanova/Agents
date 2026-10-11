# Startup

In order, every session:

1. One `recall_derived_memory` call on the task topic. See `Memory.md`.
2. When working in a Git repository, find the workspace:
   `WORKSPACE=$(git rev-parse --path-format=absolute --git-common-dir | sed 's|/\.bare$||')`
   Then read the worktree's root `AGENTS.md`. Skip this step outside a Git
   repository; a general working directory need not contain `AGENTS.md`.
3. If working a plan file, read it and its campaign marker. See `Plans.md`.

In a bare-repo workspace, before reading project docs (ROADMAP, runbooks,
docs/), run `git -C $WORKSPACE/main pull --ff-only`. If it cannot
fast-forward, read anyway and say the docs may be stale.
