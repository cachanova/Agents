#!/usr/bin/env node

import { createWriteStream } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { finished } from "node:stream/promises";
import { promisify } from "node:util";
import {
  processStartTime,
  readJson,
  safeClaudeEnvironment,
  terminateOwnedProcessGroup,
  writeJsonAtomic
} from "./lib.mjs";

const execFileAsync = promisify(execFile);

const jobDir = process.argv[2];
if (!jobDir) throw new Error("Job directory argument is required.");

const requestPath = path.join(jobDir, "request.json");
const statePath = path.join(jobDir, "state.json");
const eventsPath = path.join(jobDir, "events.jsonl");
const stderrPath = path.join(jobDir, "stderr.log");
const stdoutTailPath = path.join(jobDir, "stdout-tail.log");
const cancelPath = path.join(jobDir, "cancel.requested");
const MAX_EVENT_CHARS = 5_000_000;
const MAX_RESULT_CHARS = 1_000_000;
const MAX_STDOUT_TAIL_CHARS = 64_000;

function claudeArgs(request) {
  const tools = request.allow_web
    ? "Read,Glob,Grep,WebSearch,WebFetch"
    : "Read,Glob,Grep";
  const args = [
    "--print",
    "--output-format",
    "stream-json",
    "--verbose",
    "--safe-mode",
    "--no-chrome",
    "--prompt-suggestions",
    "false",
    "--model",
    request.model,
    "--effort",
    request.effort,
    "--permission-mode",
    "plan",
    "--tools",
    tools,
    "--name",
    `codex-bridge-${request.job_id.slice(0, 8)}`,
    "--append-system-prompt-file",
    request.policy_file
  ];
  if (request.resume_session_id) {
    args.push("--resume", request.resume_session_id, "--fork-session");
  }
  return args;
}

async function cancellationRequested() {
  try {
    await access(cancelPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function summarizeEvent(event) {
  const content = Array.isArray(event?.message?.content) ? event.message.content : [];
  return {
    at: new Date().toISOString(),
    type: typeof event?.type === "string" ? event.type : null,
    subtype: typeof event?.subtype === "string" ? event.subtype : null,
    session_id: typeof event?.session_id === "string" ? event.session_id : null,
    is_error: typeof event?.is_error === "boolean" ? event.is_error : null,
    tools: content
      .filter(item => item?.type === "tool_use" && typeof item?.name === "string")
      .map(item => item.name)
      .slice(0, 12)
  };
}

function boundedText(value, maxChars) {
  if (typeof value !== "string") return null;
  return value.length > maxChars ? value.slice(0, maxChars) : value;
}

function boundedJson(value, maxChars = 12_000) {
  if (!value || typeof value !== "object") return null;
  const encoded = JSON.stringify(value);
  return encoded.length <= maxChars ? value : { truncated: true };
}

async function verifySubscription(claudeBin) {
  const { stdout } = await execFileAsync(claudeBin, ["auth", "status", "--json"], {
    timeout: 10_000,
    env: safeClaudeEnvironment()
  });
  const auth = JSON.parse(stdout);
  if (
    auth.loggedIn !== true
    || auth.authMethod !== "claude.ai"
    || auth.apiProvider !== "firstParty"
    || !auth.subscriptionType
  ) {
    throw new Error("Claude subscription login is required; API and third-party billing are disabled.");
  }
}

async function main() {
  const request = await readJson(requestPath);
  const runnerStartTime = await processStartTime(process.pid);
  if (!runnerStartTime) throw new Error("Could not establish Linux process ownership for the bridge runner.");
  await writeJsonAtomic(path.join(jobDir, "runner.json"), {
    pid: process.pid,
    start_time: runnerStartTime
  });
  const initial = await readJson(statePath);
  if (!["queued", "cancelling"].includes(initial.status)) return;
  if (await cancellationRequested()) {
    await writeJsonAtomic(statePath, {
      ...initial,
      status: "cancelled",
      runner_pid: process.pid,
      runner_start_time: runnerStartTime,
      finished_at: new Date().toISOString(),
      error: "Cancelled by Codex."
    });
    return;
  }

  const claudeBin = process.env.CLAUDE_BRIDGE_CLAUDE_BIN || "claude";
  await verifySubscription(claudeBin);
  if (await cancellationRequested()) {
    await writeJsonAtomic(statePath, {
      ...initial,
      status: "cancelled",
      runner_pid: process.pid,
      runner_start_time: runnerStartTime,
      finished_at: new Date().toISOString(),
      error: "Cancelled by Codex."
    });
    return;
  }
  const child = spawn(claudeBin, claudeArgs(request), {
    cwd: request.cwd,
    env: safeClaudeEnvironment(),
    detached: true,
    stdio: ["pipe", "pipe", "pipe"]
  });
  let launchError = null;
  const exitPromise = new Promise(resolve => {
    child.once("error", error => {
      launchError = error;
    });
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  await new Promise((resolve, reject) => {
    child.once("spawn", resolve);
    child.once("error", reject);
  });

  const claudeStartTime = await processStartTime(child.pid);
  if (!claudeStartTime) throw new Error("Could not establish Linux process ownership for Claude.");
  const running = {
    ...initial,
    status: "running",
    runner_pid: process.pid,
    runner_start_time: runnerStartTime,
    claude_pid: child.pid,
    claude_start_time: claudeStartTime,
    started_at: new Date().toISOString()
  };
  await writeJsonAtomic(statePath, running);

  const stderrFile = createWriteStream(stderrPath, { flags: "w", mode: 0o600 });
  const eventsFile = createWriteStream(eventsPath, { flags: "w", mode: 0o600 });
  child.stderr.pipe(stderrFile);
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });

  let payload = null;
  let seenSessionId = null;
  let stdoutTail = "";
  let outputError = null;
  const parsePromise = (async () => {
    for await (const line of lines) {
      stdoutTail = `${stdoutTail}${line}\n`.slice(-MAX_STDOUT_TAIL_CHARS);
      if (line.length > MAX_EVENT_CHARS) {
        outputError = `Claude emitted an event larger than ${MAX_EVENT_CHARS} characters.`;
        await terminateOwnedProcessGroup(child.pid, claudeStartTime, 1000);
        break;
      }
      try {
        const event = JSON.parse(line);
        if (typeof event.session_id === "string") seenSessionId = event.session_id;
        if (event.type === "result") payload = event;
        eventsFile.write(`${JSON.stringify(summarizeEvent(event))}\n`);
      } catch {
        // Preserve only a bounded tail for diagnostics; never expose it by default.
      }
    }
  })();

  if (await cancellationRequested()) {
    await terminateOwnedProcessGroup(child.pid, claudeStartTime, 1000);
  } else {
    child.stdin.end(request.delegated_prompt);
  }

  let timedOut = false;
  let timeoutTermination = null;
  const timer = setTimeout(() => {
    timedOut = true;
    timeoutTermination = terminateOwnedProcessGroup(child.pid, claudeStartTime, 1000);
  }, request.timeout_seconds * 1000);
  timer.unref();

  const [exit] = await Promise.all([exitPromise, parsePromise]);
  clearTimeout(timer);
  if (timeoutTermination) await timeoutTermination;
  eventsFile.end();
  await Promise.allSettled([finished(stderrFile), finished(eventsFile)]);

  const wasCancelled = await cancellationRequested();
  const resultText = boundedText(payload?.result, MAX_RESULT_CHARS);
  const resultTruncated = typeof payload?.result === "string" && payload.result.length > MAX_RESULT_CHARS;
  const sessionId = typeof payload?.session_id === "string" ? payload.session_id : seenSessionId;
  const succeeded = !wasCancelled
    && !timedOut
    && !outputError
    && !launchError
    && exit.code === 0
    && payload
    && payload.is_error !== true;
  const status = wasCancelled ? "cancelled" : succeeded ? "completed" : "failed";
  const error = status === "cancelled"
    ? "Cancelled by Codex."
    : succeeded
      ? null
      : timedOut
        ? `Claude exceeded the ${request.timeout_seconds}s timeout.`
        : outputError
          || boundedText(payload?.result, 4000)
          || launchError?.message
          || `Claude exited with code ${exit.code ?? "unknown"}.`;
  const finalState = {
    ...running,
    status,
    finished_at: new Date().toISOString(),
    exit_code: exit.code,
    signal: exit.signal,
    timed_out: timedOut,
    session_id: sessionId || null,
    error
  };
  await writeJsonAtomic(path.join(jobDir, "result.json"), {
    job_id: request.job_id,
    status,
    session_id: sessionId || null,
    result: resultText,
    result_truncated_at_storage: resultTruncated,
    is_error: payload?.is_error ?? !succeeded,
    duration_ms: Number.isFinite(payload?.duration_ms) ? payload.duration_ms : null,
    duration_api_ms: Number.isFinite(payload?.duration_api_ms) ? payload.duration_api_ms : null,
    num_turns: Number.isFinite(payload?.num_turns) ? payload.num_turns : null,
    total_cost_usd: Number.isFinite(payload?.total_cost_usd) ? payload.total_cost_usd : null,
    usage: boundedJson(payload?.usage),
    error
  });
  if (!payload && stdoutTail) {
    await writeFile(stdoutTailPath, stdoutTail, { mode: 0o600 });
  }
  await writeJsonAtomic(statePath, finalState);
}

main().catch(async error => {
  try {
    const previous = await readJson(statePath);
    if (previous.claude_pid) {
      await terminateOwnedProcessGroup(previous.claude_pid, previous.claude_start_time, 500).catch(() => {});
    }
    const cancelled = await cancellationRequested().catch(() => false);
    await writeJsonAtomic(statePath, {
      ...previous,
      status: cancelled ? "cancelled" : "failed",
      runner_pid: process.pid,
      runner_start_time: await processStartTime(process.pid),
      finished_at: new Date().toISOString(),
      error: cancelled
        ? "Cancelled by Codex."
        : (error instanceof Error ? error.message : String(error)).slice(0, 4000)
    });
  } finally {
    process.exitCode = 1;
  }
});
