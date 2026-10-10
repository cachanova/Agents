# Git and Worktrees

## Workspace layout

Every repo is a bare-repo workspace. Create one like this:

```bash
mkdir ~/code/<repo> && cd ~/code/<repo>
git clone --bare <url> .bare
echo 'gitdir: ./.bare' > .git
git worktree add main main
```

Result:

```text
~/code/<repo>/
  .bare/           bare repository
  .git             file: gitdir: ./.bare
  main/            worktree for the default branch, and only that branch
  <branch>/        one worktree per feature branch
  CLAUDE.md  -> main/.agent/Repo.md
  AGENTS.md  -> main/.agent/Repo.md
```

- Worktree directory name equals the branch name. Branch names contain no
  slashes.
- Project rules live in `.agent/Repo.md`, tracked in the repo. The workspace
  root symlinks point at `main`'s copy so every worktree inherits them.
- Never create `CLAUDE.md`, `AGENTS.md`, or `.claude/` inside a worktree.
- Git commands work from the workspace root because of the `.git` file.
- Fix a workspace that deviates from this layout (missing `.git` file, missing
  root symlinks) when you notice it. Moving a bare dir or worktree is a user
  decision; propose it, do not do it.

## Inspect first

- Before any branch-changing operation, identify the workspace, default branch,
  remotes, current branch, worktrees, and dirty files.
- Preserve dirty or untracked work. Do not reset, overwrite, or delete it.
- No destructive git commands without explicit user approval.

## Start work

- Continue an existing branch and worktree when it already owns the task.
- For new work: `git -C $WORKSPACE/main pull --ff-only`, then
  `git -C $WORKSPACE worktree add <branch> -b <branch> main`.
- `main/` stays on the default branch. Do not commit feature work there.
- Stop if a clean base cannot be established without moving user work.

## Commit

- Inspect `git status` and the diff before committing. Stage files by name.
- Commit small, verified steps on the feature branch. The PR squashes them.
- Follow the repo's commit message style; check recent `git log`.
- Amend the previous commit when the change is an obvious continuation (typo,
  minor follow-up). Otherwise make a new commit.
- If a change alters a project fact in `.agent/Repo.md` or a doc under `docs/`,
  update it in the same commit.

## Land work

- "Put this on main" means prepare a PR. Push directly only when the user
  explicitly says push.
- Before opening a PR: fetch and integrate the default branch, resolve conflicts
  in the feature worktree, rerun affected verification, remove superseded code.
- Open the PR with `gh`. Report the PR, branch, purpose, checks run, and
  unresolved risks.
- Merge only on explicit user confirmation. Sync once more before merging.
  PRs are squash-merged unless `Repo.md` says otherwise.

## After merge

- Fast-forward `main`: `git -C $WORKSPACE/main pull --ff-only`.
- Remove the worktree and branch:
  `git -C $WORKSPACE worktree remove <branch>` then
  `git -C $WORKSPACE branch -d <branch>` and delete the remote branch.
- Only after the merge is confirmed, never before.

## Parallel work

- One writer per worktree. Give each writing agent its own worktree.
- Serialize shared-file edits, lockfile changes, migrations, conflict
  resolution, and merges.
