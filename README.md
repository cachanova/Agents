# Agents

Portable operating rules for Claude Code and Codex.

## Layout

```text
AGENTS.md                 Codex entry point
CLAUDE.md                 Claude Code entry point
.agent/Glossary.md        Shared terms
.agent/Dev.md             Implementation and performance rules
.agent/Worktree.md        Git, worktree, and PR rules
.agent/Delegation.md      Worker and handoff contract
.agent/CodexWorkflow.md   Sol-led workflow
.agent/ClaudeWorkflow.md  Fable-led workflow
.agent/Repo.template.md   Template for project-specific rules
```

The active harness selects the workflow. Codex reads `AGENTS.md`; Claude Code
reads `CLAUDE.md`. A delegated agent remains a worker even when its native
harness would normally make it the coordinator.

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

## Claude bridge for Codex

`tools/claude-bridge` provides a local MCP server that lets Codex start, inspect,
follow up on, recover, and cancel delegated Claude Code sessions. It defaults to
Fable at high effort, read-only plan mode, disabled web tools, and Claude
subscription authentication. See its README for installation and controls.
