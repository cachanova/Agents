# Memory (Rumi)

Long-term memory lives on Rumi via the `basic-memory-mozi` MCP server, never
on this machine. Do not create local memory files or symlinks.

## Reading

- At session start make one `recall_derived_memory` call about the task
  topic. It is free, Hindsight-backed, and returns facts consolidated across
  every note in the bank. It defaults to the current repo's bank.
- Use `search_notes` and `read_note` for specific notes and exact wording.
- Query the `leela` project for user preferences when relevant.
- Recall lags the markdown by up to an hour. For anything written this session
  or very recently, use `search_notes`.

## Writing

- Store durable facts and decisions with `write_note`. The proxy routes and
  tags them.
- Projects ending in `-private` are write-only here. Never read them; ask Rumi
  instead. Recall refuses them too.

## Routing

- Topic overrides cwd. Anything about the Theseus homelab and what runs there
  (mozi, the media server, Rumi/Hermes, kosha storage, Proxmox, home
  networking) lives in the `theseus` project. Pass `project="theseus"` on
  searches and `write_note` for those topics, whatever repo you are in.
- For a genuinely new project or line of work, check `list_memory_projects`
  first, then `create_memory_project` with a lowercase-slug name. Do not wedge
  notes into an old project or a general folder under `leela`.
- Name a new code repo's project after the repo directory so sessions in that
  repo scope to it automatically.
