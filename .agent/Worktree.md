# Git and Worktree Rules

`Repo.md` may specialize these defaults for a project's layout and release
process.

## Inspect first

- Identify the repository root, default branch, remotes, current branch,
  worktrees, and dirty files before branch-changing operations.
- Determine whether the workspace is a normal checkout or a container holding a
  bare repository and several worktrees.
- Preserve dirty or untracked user work. Do not reset, overwrite, or delete it.
- Never use destructive git commands without explicit user approval.

## Start and continue work

- Continue an existing branch and worktree when it already owns the task.
- For new feature work, update the default branch with a fast-forward pull, then
  create a dedicated branch and worktree.
- Reserve the default-branch worktree for the default branch.
- Keep the worktree directory name aligned with the branch name when practical.
- Stop if the required clean base cannot be established without moving user work.

## Ownership

- The root coordinator is the git owner.
- Workers do not create, switch, merge, rebase, push, or delete branches unless
  the coordinator assigns that operation.
- Give each writing worker an isolated worktree. Read-only workers may share a
  worktree.
- Serialize shared-file edits, lockfile generation, migrations, conflict
  resolution, releases, and merges.

## Sync and commit

- Fetch and integrate the current default branch before substantial work, before
  opening a PR, and before merging.
- Resolve conflicts in the feature worktree, then rerun affected verification.
- Inspect the diff and status before committing.
- Stage files by name. Do not stage unrelated work.
- Commit completed, verified work with a message that describes the result.

## PR and merge

- Treat a request to put work on the default branch as a request to prepare a PR
  unless the user explicitly requests a direct push.
- Clean superseded code before opening the PR.
- Run focused verification and independent review before calling the PR ready.
- Report the PR, branch, purpose, checks, and unresolved risks.
- Require explicit user confirmation before merging or another irreversible
  release action.
- Sync once more before merge. Use the project's required merge strategy.
- After merge and deployment verification, when applicable, update the local
  default branch and remove the merged feature worktree and branch.

## Parallel work

- Parallelize independent discovery, tests, reviews, or modules with clear
  ownership.
- Keep tightly coupled implementation serial.
- The coordinator reviews every worker result and runs integration-level checks.
