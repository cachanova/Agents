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

Codex Harness Mode assumes the user started Sol at `high`; the root session does
not self-confirm its model identity or effort. The Sol coordinator explicitly
selects the model and effort for every agent it launches. A user may start in
Claude Harness Mode with Fable as coordinator; Fable delegates implementation
to Codex Sol at `high` by default.

## Add to a project

For a bare-repository workspace with sibling worktrees, add this repository as
an `.agents` submodule in the main worktree. Keep the project's regular
`.agent/Repo.md` outside the submodule and version it in the project repository.
Only the main worktree maintains a persistent submodule checkout.

Expose the main worktree's pinned packet at the parent workspace root:

```text
workspace/
  AGENTS.md -> main/.agents/AGENTS.md
  CLAUDE.md -> main/.agents/CLAUDE.md
  .agent/
    Glossary.md -> ../main/.agents/.agent/Glossary.md
    ModelRouting.md -> ../main/.agents/.agent/ModelRouting.md
    Dev.md -> ../main/.agents/.agent/Dev.md
    Worktree.md -> ../main/.agents/.agent/Worktree.md
    Repo.md -> ../main/.agent/Repo.md
    Delegation.md -> ../main/.agents/.agent/Delegation.md
    CodexWorkflow.md -> ../main/.agents/.agent/CodexWorkflow.md
    ClaudeWorkflow.md -> ../main/.agents/.agent/ClaudeWorkflow.md
```

Codex sessions should start from the parent workspace. If direct worktree
launches must remain safe, track a small worktree `AGENTS.md` that redirects the
agent to `../AGENTS.md`; do not duplicate the shared policy there.

An application pins policy updates by updating its `.agents` gitlink. A
dedicated policy-update worktree may initialize the submodule temporarily, but
feature worktrees leave it uninitialized.

## Editing

Keep each rule in one file. Use short commands, define project facts in
`Repo.md`, and avoid rationale unless it changes a decision. Update
`Glossary.md` when a term needs a stable meaning across files.

## Claude bridge for Codex

`tools/claude-bridge` provides a local MCP server that lets Codex start, inspect,
follow up on, recover, and cancel delegated Claude Code sessions. It defaults to
Fable at high effort, read-only plan mode, disabled web tools, and Claude
subscription authentication. See its README for installation and controls.
