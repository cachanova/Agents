# Git

## Layout

Every repo is a bare-repo workspace:

```bash
mkdir ~/code/<repo> && cd ~/code/<repo>
git clone --bare <url> .bare
echo 'gitdir: ./.bare' > .git
git worktree add main main
```

```text
~/code/<repo>/
  .bare/                   bare repo
  .git                     gitdir: ./.bare
  main/                    default branch only
  <branch>/                one worktree per branch, dir name = branch name
  AGENTS.md -> main/AGENTS.md
  CLAUDE.md -> main/AGENTS.md
```

- Branch names have no slashes.
- Project rules: tracked root `AGENTS.md`, `CLAUDE.md -> AGENTS.md`.
- No `.claude/` or other agent config inside a worktree.
- Fix a missing `.git` file or root symlink when you see it. Do not move a
  bare dir or worktree; propose it.

## Before branch operations

- Check workspace, default branch, remotes, current branch, worktrees, dirty
  files.
- Keep dirty and untracked work. No reset, overwrite, or delete.
- No destructive git commands without explicit approval.

## Start work

- Reuse the branch and worktree that already owns the task.
- New work: `git -C $WORKSPACE/main pull --ff-only`, then
  `git -C $WORKSPACE worktree add <branch> -b <branch> main`.
- Never commit feature work in `main/`.
- Stop if a clean base needs moving user work.

## Commit

- Check `git status` and the diff. Stage files by name.
- Small verified commits on the branch. The PR squashes.
- Match the repo's commit style from `git log`.
- Amend for a trivial follow-up to your last commit. Otherwise new commit.
- Update `AGENTS.md` and `docs/` in the same commit when a change alters them.

## Land

- "Put this on main" means open a PR. Push directly only when told to push.
- Before the PR: integrate the default branch, resolve conflicts in the
  feature worktree, rerun verification, remove superseded code.
- Open with `gh`. Report PR, branch, purpose, checks, open risks.
- Merge only on explicit confirmation. Sync first. Squash unless the project
  `AGENTS.md` says otherwise.

## After merge

- `git -C $WORKSPACE/main pull --ff-only`
- `git -C $WORKSPACE worktree remove <branch>`
- `git -C $WORKSPACE branch -d <branch>` and delete the remote branch.
- Only after the merge is confirmed.

## Parallel work

- One writer per worktree.
- Serialize shared-file edits, lockfiles, migrations, conflicts, merges.
