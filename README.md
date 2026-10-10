# Agents

Shared operating rules for Claude Code and Codex, kept in one place and wired
in with symlinks.

## Layout

```text
AGENTS.md                 Entry point (Codex)
CLAUDE.md -> AGENTS.md    Entry point (Claude Code)
Startup.md                Session start sequence
Git.md                    Bare-repo workspace layout, worktrees, PR flow
Dev.md                    Scope, verification, performance, secrets, comms
Plans.md                  Plan files and the campaign status marker
Memory.md                 Rumi memory rules
Repo.template.md          Template for a project's root AGENTS.md
```

## Wiring

This repo lives at `~/agents`. The harness global config files are symlinks
into it:

```text
~/.claude/CLAUDE.md -> ~/agents/CLAUDE.md
~/.codex/AGENTS.md  -> ~/agents/AGENTS.md
```

Projects do not vendor this repo. Each project keeps its own facts in a tracked
root `AGENTS.md` (with `CLAUDE.md -> AGENTS.md`), and the workspace root links
to `main`'s copy:

```text
~/code/<repo>/
  .bare/  .git  main/  <branch>/
  CLAUDE.md -> main/AGENTS.md
  AGENTS.md -> main/AGENTS.md
```

See `Git.md` for how to create a workspace and `Repo.template.md` to start a
project `AGENTS.md`.

## Editing

Keep each rule in one file. Use short commands. Put project facts in the project `AGENTS.md`,
not here. Avoid rationale unless it changes a decision.
