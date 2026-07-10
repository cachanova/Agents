# Claude Bridge MCP

Local MCP server for calling Claude Code from Codex. It uses the installed
`claude` CLI and Claude subscription login; it never forwards API billing
credentials.

## Contract

- The bridge defaults to Fable at `high` effort. It supports `fable`,
  `claude-fable-5`, `opus`, and `sonnet`, with efforts from `low` through `max`.
- The bridge restricts jobs to `Read`, `Glob`, and `Grep`.
- Set `allow_web: true` on each job that needs web tools. Repository content can
  then inform web requests.
- Claude's `--safe-mode` disables local customizations. Each start supplies a
  trusted `policy_root`; the bridge attaches regular non-symlink `CLAUDE.md` and
  shared `.agent/` files from that root. `cwd` must be inside it.
- The bridge sends prompts over stdin and passes a small environment allowlist
  for keyring-based subscription login.
- The bridge forks finished sessions for follow-ups. It cannot steer a running
  turn.

Use the portable policy layout and trust the worktree and policy packet before
calling Claude. The bridge ignores nested policy files and does not provide an
OS filesystem sandbox.

## Tools

- `claude_health`: Check CLI and sanitized subscription status.
- `claude_start`: Start a detached specialist job.
- `claude_status`: Read state and sanitized event metadata.
- `claude_result`: Read a bounded terminal result.
- `claude_reply`: Fork a finished session for a follow-up.
- `claude_cancel`: Stop the owned Claude process group.
- `claude_jobs`: Recover jobs from another Codex session.
- `claude_forget`: Delete one terminal job's local state.

## Install

Requires Linux with util-linux `flock`, Node 20+, Claude Code with an active
first-party subscription login, and Codex CLI. Use the Node version that will
run Codex when installing the global package.

```bash
cd tools/claude-bridge
npm ci
npm test
npm pack
npm install -g ./cachanova-claude-bridge-mcp-0.1.0.tgz
codex mcp add claude-bridge -- claude-bridge-mcp
```

Restart Codex after adding or upgrading the server. Repack and reinstall to
upgrade; installing the archive avoids a global symlink to a feature worktree.
Run `codex mcp get claude-bridge`, then call `claude_health` in a new Codex
session.

To remove it:

```bash
codex mcp remove claude-bridge
npm uninstall -g @cachanova/claude-bridge-mcp
```

## State and quota

Jobs contain the prompt, attached policy, logs, result, and resumable session ID.
They live under `$XDG_STATE_HOME/claude-bridge` or
`~/.local/state/claude-bridge`, use `0600` files, and expire after seven days by
default. Cleanup runs at server start, hourly while running, on new jobs, and on
job listing. `claude_forget` deletes bridge state; Claude may retain its own
session.

Set `CLAUDE_BRIDGE_RETENTION_DAYS` to change retention and
`CLAUDE_BRIDGE_MAX_ACTIVE_JOBS` to change the default four-job cap. OpenAI and
Claude quotas are independent. Claude subscription calls may consume paid extra
usage credits when that account-level feature is enabled. `npm run test:live`
uses Claude allowance.
