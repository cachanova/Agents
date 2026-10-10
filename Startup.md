# Session Startup

Do these in order at the start of every session:

1. **Recall memory.** Make one `recall_derived_memory` call about the task topic
   (see `Memory.md`).
2. **Find the workspace.** `WORKSPACE=$(git rev-parse --path-format=absolute --git-common-dir | sed 's|/\.bare$||')`.
   In a bare-repo workspace this is the directory holding `.bare/`, `main/`,
   and the branch worktrees. In a normal checkout it is the repo root.
3. **Read project rules.** Read the worktree's root `AGENTS.md` if it exists
   (`CLAUDE.md` is a symlink to it). The workspace root's `AGENTS.md` and
   `CLAUDE.md` are symlinks to `main/AGENTS.md`.
4. **Read the plan.** If the task works through a plan file, read it and its
   campaign marker (see `Plans.md`) before doing anything else.

Before reading project docs (ROADMAP, runbooks, docs/, architecture), run
`git -C $WORKSPACE/main pull --ff-only`. Docs change from other machines. If
the pull cannot fast-forward or you are offline, read anyway and say the docs
may be stale.
