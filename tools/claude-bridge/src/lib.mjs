import { randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const JOB_ID_RE = /^[0-9a-f-]{36}$/;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER_PATH = path.join(HERE, "runner.mjs");
const LOCK_HOLDER_PATH = path.join(HERE, "lock-holder.mjs");
const REQUIRED_POLICY_FILES = [
  "CLAUDE.md",
  ".agent/Glossary.md",
  ".agent/ModelRouting.md",
  ".agent/Dev.md",
  ".agent/Worktree.md",
  ".agent/Delegation.md",
  ".agent/ClaudeWorkflow.md"
];
const POLICY_FILES = [
  ...REQUIRED_POLICY_FILES.slice(0, 5),
  ".agent/Repo.md",
  ...REQUIRED_POLICY_FILES.slice(5)
];
const SAFE_ENV_KEYS = [
  "HOME",
  "PATH",
  "SHELL",
  "USER",
  "LOGNAME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "TERM",
  "TMPDIR",
  "XDG_CONFIG_HOME",
  "XDG_CACHE_HOME",
  "XDG_DATA_HOME",
  "XDG_STATE_HOME",
  "CLAUDE_CONFIG_DIR",
  "DBUS_SESSION_BUS_ADDRESS",
  "GNOME_KEYRING_CONTROL",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy"
];
const PROXY_ENV_KEYS = new Set([
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy"
]);
const CREATE_LOCK_NAME = ".create.lock";
const CREATE_LOCK_WAIT_SECONDS = 15;

let createQueue = Promise.resolve();

export function stateRoot() {
  if (process.env.CLAUDE_BRIDGE_STATE_DIR) {
    return path.resolve(process.env.CLAUDE_BRIDGE_STATE_DIR);
  }
  const base = process.env.XDG_STATE_HOME
    ? path.resolve(process.env.XDG_STATE_HOME)
    : path.join(os.homedir(), ".local", "state");
  return path.join(base, "claude-bridge");
}

export function effectiveRetentionDays() {
  const configured = Number.parseInt(process.env.CLAUDE_BRIDGE_RETENTION_DAYS || "7", 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 7;
}

export function effectiveMaxActiveJobs() {
  const configured = Number.parseInt(process.env.CLAUDE_BRIDGE_MAX_ACTIVE_JOBS || "4", 10);
  return Number.isInteger(configured) && configured > 0 ? configured : 4;
}

export async function ensureStateRoot() {
  const root = stateRoot();
  await mkdir(root, { recursive: true, mode: 0o700 });
  return root;
}

export function assertJobId(jobId) {
  if (!JOB_ID_RE.test(jobId)) throw new Error("Invalid job ID.");
}

export async function jobDirectory(jobId) {
  assertJobId(jobId);
  return path.join(await ensureStateRoot(), jobId);
}

export async function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(tempPath, filePath);
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonIfPresent(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function readJobRequest(jobId) {
  return readJson(path.join(await jobDirectory(jobId), "request.json"));
}

export async function processStartTime(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null;
  try {
    const raw = await readFile(`/proc/${pid}/stat`, "utf8");
    const commandEnd = raw.lastIndexOf(")");
    if (commandEnd < 0) return null;
    const fields = raw.slice(commandEnd + 2).trim().split(/\s+/);
    return fields[19] || null;
  } catch (error) {
    if (["ENOENT", "ESRCH"].includes(error?.code)) return null;
    throw error;
  }
}

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function isOwnedProcessAlive(pid, expectedStartTime) {
  if (!isProcessAlive(pid)) return false;
  if (!expectedStartTime) return true;
  return (await processStartTime(pid)) === expectedStartTime;
}

export async function killProcessGroup(pid, signal, expectedStartTime = null) {
  if (!(await isOwnedProcessAlive(pid, expectedStartTime))) return false;
  return signalProcessGroup(pid, signal);
}

export function signalProcessGroup(pid, signal) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(-pid, signal);
    return true;
  } catch (error) {
    if (error?.code === "ESRCH") return false;
    throw error;
  }
}

async function wait(milliseconds) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

export async function terminateOwnedProcessGroup(pid, expectedStartTime, graceMs = 1000) {
  const owned = await killProcessGroup(pid, "SIGTERM", expectedStartTime);
  if (!owned) return false;
  await wait(graceMs);
  // Ownership was verified before SIGTERM. A process group cannot be reused while
  // one of its original members remains, so the final group signal also reaches
  // descendants that outlive the leader.
  signalProcessGroup(pid, "SIGKILL");
  return true;
}

export async function readJobState(jobId) {
  const dir = await jobDirectory(jobId);
  const statePath = path.join(dir, "state.json");
  const state = await readJson(statePath);
  const runner = state.runner_pid
    ? { pid: state.runner_pid, start_time: state.runner_start_time || null }
    : await readJsonIfPresent(path.join(dir, "runner.json"));
  const hydrated = runner
    ? { ...state, runner_pid: runner.pid, runner_start_time: runner.start_time }
    : state;

  if (hydrated.status === "queued" && !runner?.pid) {
    const launcherAlive = hydrated.launcher_pid
      ? await isOwnedProcessAlive(hydrated.launcher_pid, hydrated.launcher_start_time)
      : false;
    const launchExpired = Date.parse(hydrated.launch_deadline || "") <= Date.now();
    if (!launcherAlive || launchExpired) {
      const failed = {
        ...hydrated,
        status: "failed",
        finished_at: new Date().toISOString(),
        error: "Bridge runner was not started before the launch reservation expired."
      };
      await writeJsonAtomic(statePath, failed);
      return failed;
    }
  }

  if (["queued", "running", "cancelling"].includes(hydrated.status) && runner?.pid) {
    if (!(await isOwnedProcessAlive(runner.pid, runner.start_time))) {
      if (hydrated.claude_pid) {
        await terminateOwnedProcessGroup(
          hydrated.claude_pid,
          hydrated.claude_start_time,
          500
        ).catch(() => {});
      }
      const terminal = {
        ...hydrated,
        status: hydrated.status === "cancelling" ? "cancelled" : "failed",
        finished_at: new Date().toISOString(),
        error: hydrated.status === "cancelling"
          ? "Cancelled by Codex."
          : "Bridge runner exited before recording a result."
      };
      await writeJsonAtomic(statePath, terminal);
      return terminal;
    }
  }
  return hydrated;
}

export async function readTail(filePath, maxChars = 6000) {
  let handle;
  try {
    handle = await open(filePath, "r");
    const info = await handle.stat();
    const bytes = Math.min(info.size, Math.max(maxChars * 4, 4096));
    const buffer = Buffer.alloc(bytes);
    await handle.read(buffer, 0, bytes, info.size - bytes);
    const text = buffer.toString("utf8");
    return text.length > maxChars ? text.slice(-maxChars) : text;
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  } finally {
    await handle?.close();
  }
}

export async function assertWorkingDirectory(cwd) {
  if (!cwd) throw new Error("cwd is required and must name the intended repository or worktree.");
  const resolved = await realpath(path.resolve(cwd));
  const info = await stat(resolved);
  if (!info.isDirectory()) throw new Error(`Not a directory: ${resolved}`);
  await access(resolved, fsConstants.R_OK);
  return resolved;
}

export function buildDelegatedPrompt({ prompt, rootCoordinator, role, verification, allowWeb }) {
  if (!prompt?.trim()) throw new Error("Prompt is required.");
  const text = [
    "DELEGATED_TASK",
    "Parent harness: Codex",
    `Root coordinator: ${rootCoordinator}`,
    `Role: ${role}`,
    "Write scope: read-only",
    "Git authority: none",
    "Delegation depth: one; do not invoke Codex or create subagents",
    `Network tools: ${allowWeb ? "explicitly allowed for this job" : "disabled"}`,
    `Verification: ${verification}`,
    "Return: conclusion, evidence, changed files, checks, uncertainty",
    "",
    "Objective:",
    prompt.trim()
  ].join("\n");
  if (text.length > 200_000) throw new Error("Delegated prompt exceeds 200,000 characters.");
  return text;
}

function isInside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

async function readPolicyPath(root, filePath, required) {
  let handle;
  let info;
  try {
    handle = await open(filePath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
    info = await handle.stat();
  } catch (error) {
    if (error?.code === "ENOENT" && !required) return null;
    if (error?.code === "ENOENT") throw new Error(`Required Claude policy file is missing: ${filePath}`);
    if (error?.code === "ELOOP") {
      throw new Error(`Claude policy must be a regular, non-symlink file: ${filePath}`);
    }
    throw error;
  }
  try {
    if (!info.isFile()) {
      throw new Error(`Claude policy must be a regular, non-symlink file: ${filePath}`);
    }
    if (info.size > 50_000) throw new Error(`Claude policy file exceeds 50,000 bytes: ${filePath}`);
    const resolved = await realpath(`/proc/self/fd/${handle.fd}`);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new Error(`Claude policy resolves outside the trusted policy root: ${filePath}`);
    }
    return { filePath: resolved, content: await handle.readFile("utf8") };
  } finally {
    await handle.close();
  }
}

async function readPolicyFile(root, relative, required) {
  return readPolicyPath(root, path.join(root, relative), required);
}

export async function loadPolicyPacket(cwd, policyRoot, {
  workspaceRoot = null,
  repoPolicyFile = null
} = {}) {
  const root = await assertWorkingDirectory(policyRoot);
  const workspace = await assertWorkingDirectory(workspaceRoot || root);
  if (!isInside(workspace, root)) {
    throw new Error(`policy_root must be inside the explicit workspace_root: ${workspace}`);
  }
  if (!isInside(workspace, cwd)) {
    throw new Error(`cwd must be inside the explicit workspace_root: ${workspace}`);
  }
  const required = new Set(REQUIRED_POLICY_FILES);
  const sections = [];
  const loaded = [];
  const requestedRepoPolicy = repoPolicyFile
    ? path.resolve(workspace, repoPolicyFile)
    : path.join(root, ".agent", "Repo.md");
  const repoPolicy = await readPolicyPath(workspace, requestedRepoPolicy, Boolean(repoPolicyFile));
  let total = 0;
  for (const relative of POLICY_FILES) {
    const policy = relative === ".agent/Repo.md"
      ? repoPolicy
      : await readPolicyFile(root, relative, required.has(relative));
    if (!policy) continue;
    total += policy.content.length;
    if (total > 120_000) throw new Error("Repository policy packet exceeds 120,000 characters.");
    loaded.push(policy.filePath);
    sections.push(`# Policy source: ${policy.filePath}\n\n${policy.content.trim()}`);
  }
  return {
    root,
    workspaceRoot: workspace,
    repoPolicyFile: repoPolicy?.filePath || null,
    files: loaded,
    text: sections.join("\n\n")
  };
}

export function safeClaudeEnvironment(source = process.env) {
  const env = {};
  for (const key of SAFE_ENV_KEYS) {
    if (source[key] === undefined) continue;
    if (PROXY_ENV_KEYS.has(key) && /@/.test(source[key])) continue;
    env[key] = source[key];
  }
  return env;
}

async function collectJobs() {
  const root = await ensureStateRoot();
  const entries = await readdir(root, { withFileTypes: true });
  const jobs = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !JOB_ID_RE.test(entry.name)) continue;
    try {
      jobs.push(await readJobState(entry.name));
    } catch {
      // Ignore incomplete or manually damaged job directories.
    }
  }
  return jobs.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

export async function listJobs(limit = 20) {
  return (await collectJobs())
    .slice(0, limit)
    .map(({ job_id, status, created_at, started_at, finished_at, model, effort, cwd, session_id, error, label, role, parent_job_id, resumed_from }) => ({
      job_id,
      label: label || null,
      role: role || null,
      status,
      created_at,
      started_at: started_at || null,
      finished_at: finished_at || null,
      model,
      effort,
      cwd,
      parent_job_id: parent_job_id || null,
      resumed_from: resumed_from || null,
      session_id: session_id || null,
      error: typeof error === "string" ? error.slice(0, 4000) : null
    }));
}

export async function pruneJobs(retentionDays = 7) {
  const cutoff = Date.now() - retentionDays * 86_400_000;
  const jobs = await collectJobs();
  let removed = 0;
  for (const job of jobs) {
    if (!["completed", "failed", "cancelled"].includes(job.status)) continue;
    const timestamp = Date.parse(job.finished_at || job.created_at);
    if (Number.isFinite(timestamp) && timestamp < cutoff) {
      await rm(await jobDirectory(job.job_id), { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}

export async function activeJobCount() {
  return (await collectJobs()).filter(job => ["queued", "running", "cancelling"].includes(job.status)).length;
}

async function withCreateLock(operation) {
  const root = await ensureStateRoot();
  const lockPath = path.join(root, CREATE_LOCK_NAME);
  const holder = spawn("/usr/bin/flock", [
    "--exclusive",
    "--wait",
    String(CREATE_LOCK_WAIT_SECONDS),
    "--conflict-exit-code",
    "75",
    lockPath,
    process.execPath,
    LOCK_HOLDER_PATH
  ], {
    stdio: ["pipe", "pipe", "pipe"],
    env: safeClaudeEnvironment()
  });
  let stderr = "";
  holder.stderr.on("data", chunk => {
    stderr = `${stderr}${chunk}`.slice(-4000);
  });
  const exitPromise = new Promise((resolve, reject) => {
    holder.once("error", reject);
    holder.once("close", (code, signal) => resolve({ code, signal }));
  });
  const acquired = new Promise((resolve, reject) => {
    let stdout = "";
    holder.stdout.on("data", chunk => {
      stdout += chunk;
      if (stdout.includes("LOCKED\n")) resolve();
    });
    holder.once("error", reject);
    holder.once("close", code => {
      if (code === 75) reject(new Error("Timed out waiting to reserve a Claude bridge job slot."));
      else if (!stdout.includes("LOCKED\n")) {
        reject(new Error(stderr.trim() || `Claude bridge lock holder exited with code ${code}.`));
      }
    });
  });
  try {
    await acquired;
  } catch (error) {
    holder.stdin.destroy();
    await exitPromise.catch(() => {});
    throw error;
  }

  let result;
  let operationError = null;
  try {
    result = await operation();
  } catch (error) {
    operationError = error;
  } finally {
    holder.stdin.end();
  }
  const exit = await exitPromise;
  if (operationError) throw operationError;
  if (exit.code !== 0) {
    throw new Error(stderr.trim() || `Claude bridge lock holder exited with code ${exit.code}.`);
  }
  return result;
}

async function createJobLocked(request) {
  await pruneJobs(effectiveRetentionDays());
  const maxActive = effectiveMaxActiveJobs();
  if (await activeJobCount() >= maxActive) {
    throw new Error(`Claude bridge already has ${maxActive} active jobs.`);
  }

  const root = await ensureStateRoot();
  const jobId = randomUUID();
  const dir = path.join(root, jobId);
  await mkdir(dir, { mode: 0o700 });
  const policyFile = path.join(dir, "policy.md");
  const bridgePolicy = [
    request.policy_text,
    "# Bridge worker contract",
    "You are a delegated read-only specialist. Follow the DELEGATED_TASK envelope. Do not edit, use a shell, delegate, invoke Codex, or assume coordinator authority."
  ].join("\n\n");
  await writeFile(policyFile, bridgePolicy, { mode: 0o600 });
  const stored = {
    ...request,
    policy_file: policyFile,
    policy_text: undefined,
    job_id: jobId
  };
  const now = new Date().toISOString();
  const launcherStartTime = await processStartTime(process.pid);
  await writeJsonAtomic(path.join(dir, "request.json"), stored);
  await writeJsonAtomic(path.join(dir, "state.json"), {
    job_id: jobId,
    label: request.label,
    role: request.role,
    status: "queued",
    created_at: now,
    launch_deadline: new Date(Date.now() + 15_000).toISOString(),
    launcher_pid: process.pid,
    launcher_start_time: launcherStartTime,
    model: request.model,
    effort: request.effort,
    cwd: request.cwd,
    parent_job_id: request.parent_job_id || null,
    resumed_from: request.resume_session_id || null,
    policy_files: request.policy_files
  });

  const runnerEnv = safeClaudeEnvironment();
  if (process.env.CLAUDE_BRIDGE_CLAUDE_BIN) {
    runnerEnv.CLAUDE_BRIDGE_CLAUDE_BIN = process.env.CLAUDE_BRIDGE_CLAUDE_BIN;
  }
  const child = spawn(process.execPath, [RUNNER_PATH, dir], {
    detached: true,
    stdio: "ignore",
    env: runnerEnv
  });
  try {
    await new Promise((resolve, reject) => {
      child.once("spawn", resolve);
      child.once("error", reject);
    });
  } catch (error) {
    const failed = {
      job_id: jobId,
      status: "failed",
      created_at: now,
      finished_at: new Date().toISOString(),
      model: request.model,
      effort: request.effort,
      cwd: request.cwd,
      error: (error instanceof Error ? error.message : String(error)).slice(0, 4000)
    };
    await writeJsonAtomic(path.join(dir, "state.json"), failed);
    return failed;
  }
  await writeJsonAtomic(path.join(dir, "runner.json"), {
    pid: child.pid,
    start_time: await processStartTime(child.pid)
  });
  child.unref();
  return { job_id: jobId, status: "queued" };
}

async function createJobInternal(request) {
  return withCreateLock(() => createJobLocked(request));
}

export function createJob(request) {
  const operation = createQueue.then(() => createJobInternal(request));
  createQueue = operation.catch(() => {});
  return operation;
}

export async function cancelJob(jobId) {
  const dir = await jobDirectory(jobId);
  let state = await readJobState(jobId);
  if (!["queued", "running", "cancelling"].includes(state.status)) return state;

  await writeFile(path.join(dir, "cancel.requested"), `${new Date().toISOString()}\n`, { mode: 0o600 });
  state = await readJobState(jobId);
  if (!["queued", "running", "cancelling"].includes(state.status)) return state;
  const cancelling = { ...state, status: "cancelling", cancel_requested_at: new Date().toISOString() };
  await writeJsonAtomic(path.join(dir, "state.json"), cancelling);

  if (state.claude_pid) {
    await terminateOwnedProcessGroup(state.claude_pid, state.claude_start_time, 1000);
  }

  const runnerDeadline = Date.now() + 5000;
  while (Date.now() < runnerDeadline) {
    state = await readJobState(jobId);
    if (["cancelled", "failed", "completed"].includes(state.status)) return state;
    await wait(100);
  }

  if (state.runner_pid) {
    await terminateOwnedProcessGroup(state.runner_pid, state.runner_start_time, 250);
  }
  const cancelled = {
    ...cancelling,
    status: "cancelled",
    finished_at: new Date().toISOString(),
    error: "Cancelled by Codex."
  };
  await writeJsonAtomic(path.join(dir, "state.json"), cancelled);
  return cancelled;
}

export async function forgetJob(jobId) {
  const state = await readJobState(jobId);
  if (!["completed", "failed", "cancelled"].includes(state.status)) {
    throw new Error("Only terminal jobs can be forgotten.");
  }
  await rm(await jobDirectory(jobId), { recursive: true, force: true });
  return { job_id: jobId, forgotten: true };
}

export function parseRecentEvents(text, limit = 8) {
  const events = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      events.push({
        at: event.at || null,
        type: event.type || null,
        subtype: event.subtype || null,
        session_id: event.session_id || null,
        is_error: event.is_error ?? null,
        tools: Array.isArray(event.tools) ? event.tools.slice(0, 12) : []
      });
    } catch {
      // Ignore a partial first line from a tailed JSONL file.
    }
  }
  return events.slice(-limit);
}
