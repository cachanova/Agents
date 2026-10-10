# Agents

Shared operating rules for Claude Code and Codex. One repo, wired by symlinks.

## Layout

```text
AGENTS.md                 Entry point (Codex)
CLAUDE.md -> AGENTS.md    Entry point (Claude Code)
Startup.md                Session start
Git.md                    Bare-repo workspace, worktrees, PR flow
Dev.md                    Scope, verification, performance, secrets, comms
Plans.md                  Plan files and the campaign marker
Memory.md                 Rumi memory
Repo.template.md          Template for a project's root AGENTS.md
```

## Wiring

```text
~/.claude/CLAUDE.md -> ~/agents/CLAUDE.md
~/.codex/AGENTS.md  -> ~/agents/AGENTS.md
```

Projects do not vendor this repo. Each keeps a tracked root `AGENTS.md`
(`CLAUDE.md -> AGENTS.md`); the workspace root links to `main`'s copy:

```text
~/code/<repo>/
  .bare/  .git  main/  <branch>/
  AGENTS.md -> main/AGENTS.md
  CLAUDE.md -> main/AGENTS.md
```

`Git.md` has the setup commands. `Repo.template.md` starts a project file.

## Editing

One rule, one file. Short commands. Project facts go in the project
`AGENTS.md`. No rationale unless it changes a decision.
