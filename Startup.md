# Session Startup

Do these in order at the start of every session:

1. **Recall memory.** Make one `recall_derived_memory` call about the task topic
   (see `Memory.md`).
2. **Find the workspace.** `WORKSPACE=$(git rev-parse --path-format=absolute --git-common-dir | sed 's|/\.bare$||')`.
   In a bare-repo workspace this is the directory holding `.bare/`, `main/`,
   and the branch worktrees. In a normal checkout it is the repo root.
3. **Read project rules.** Read `$WORKSPACE/main/.agent/Repo.md` if it exists
   (the workspace root's `CLAUDE.md` and `AGENTS.md` are symlinks to it). In a
   normal checkout read `.agent/Repo.md`.
4. **Read the plan.** If the task works through a plan file, read it and its
   campaign marker (see `Plans.md`) before doing anything else.

Before reading project docs (ROADMAP, runbooks, docs/, architecture), run
`git -C $WORKSPACE/main pull --ff-only`. Docs change from other machines. If
the pull cannot fast-forward or you are offline, read anyway and say the docs
may be stale.
