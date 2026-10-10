# Memory (Rumi)

Long-term memory is Rumi, via the `basic-memory-mozi` MCP server. Never local.
No local memory files or symlinks.

## Read

- Session start: one `recall_derived_memory` call on the task topic. Free,
  consolidated across the bank, defaults to the current repo's bank.
- `search_notes` and `read_note` for specific notes and exact wording.
- Query project `leela` for user preferences.
- Recall lags up to an hour. For recent writes, use `search_notes`.

## Write

- Durable facts and decisions: `write_note`. The proxy routes and tags.
- `-private` projects are write-only. Never read them; ask Rumi.

## Routing

- Topic beats cwd. Theseus homelab and everything on it (mozi, media server,
  Rumi/Hermes, kosha, Proxmox, home network) goes to project `theseus`. Pass
  `project="theseus"` explicitly.
- New line of work with no fitting project: check `list_memory_projects`,
  then `create_memory_project` with a lowercase slug. Do not wedge it into an
  old project or a general folder under `leela`.
- New code repo: name the project after the repo directory.
