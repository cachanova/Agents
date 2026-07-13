# Agents

Portable operating rules for Claude Code and Codex.

## Layout

```text
AGENTS.md                 Codex entry point
CLAUDE.md                 Claude Code entry point
.agent/Glossary.md        Shared terms
.agent/ModelRouting.md    Shared model ladder and exclusions
.agent/Dev.md             Implementation and performance rules
.agent/Worktree.md        Git, worktree, and PR rules
.agent/Delegation.md      Worker and handoff contract
.agent/CodexWorkflow.md   Sol-led Codex workflow
.agent/ClaudeWorkflow.md  Fable-led Claude workflow
.agent/Repo.template.md   Template for project-specific rules
```

The active harness selects the workflow. Codex reads `AGENTS.md`; Claude Code
reads `CLAUDE.md`. A delegated agent remains a worker even when its native
harness would normally make it the coordinator.

Codex Harness Mode uses Sol at `high` as its default coordinator. A user may
start in Claude Harness Mode with Fable as coordinator; Fable delegates
implementation to Codex Sol at `high` by default.

## Add to a project

Copy `AGENTS.md`, `CLAUDE.md`, and `.agent/` to the project workspace root. The
workspace root may be a repository checkout or a container that holds a bare
repository and its worktrees.

Policy paths resolve from the copied entrypoint's directory, so sessions may work
inside child worktrees after loading the workspace entrypoint.

Rename `.agent/Repo.template.md` to `.agent/Repo.md`, then record the project's
layout, commands, secrets source, verification, and release process. Keep
`Repo.md` local to that project.

When updating a project, copy the shared files again without replacing its
`Repo.md`. Updates are manual by design.

## Editing

Keep each rule in one file. Use short commands, define project facts in
`Repo.md`, and avoid rationale unless it changes a decision. Update
`Glossary.md` when a term needs a stable meaning across files.
