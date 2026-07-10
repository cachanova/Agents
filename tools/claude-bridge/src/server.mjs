#!/usr/bin/env node

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  assertWorkingDirectory,
  buildDelegatedPrompt,
  cancelJob,
  createJob,
  effectiveMaxActiveJobs,
  effectiveRetentionDays,
  forgetJob,
  jobDirectory,
  listJobs,
  loadPolicyPacket,
  parseRecentEvents,
  pruneJobs,
  readJobRequest,
  readJobState,
  readJson,
  readTail,
  safeClaudeEnvironment,
  stateRoot
} from "./lib.mjs";

const execFileAsync = promisify(execFile);
const modelSchema = z.enum(["fable", "claude-fable-5", "opus", "sonnet"]);
const effortSchema = z.enum(["low", "medium", "high", "xhigh", "max"]);
const metadataSchema = z.string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[^\r\n]+$/, "must be a single line");
const labelSchema = z.string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[^\r\n]+$/, "must be a single line");
const terminalStatuses = new Set(["completed", "failed", "cancelled"]);
if (process.platform !== "linux") {
  throw new Error("claude-bridge-mcp currently requires Linux process-group ownership semantics.");
}

function response(value) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    structuredContent: value
  };
}

function failure(error) {
  const message = (error instanceof Error ? error.message : String(error)).slice(0, 4000);
  return { isError: true, content: [{ type: "text", text: message }] };
}

function publicState(state) {
  return {
    job_id: state.job_id,
    label: state.label || null,
    status: state.status,
    created_at: state.created_at || null,
    started_at: state.started_at || null,
    finished_at: state.finished_at || null,
    model: state.model,
    effort: state.effort,
    cwd: state.cwd,
    parent_job_id: state.parent_job_id || null,
    resumed_from: state.resumed_from || null,
    session_id: state.session_id || null,
    timed_out: state.timed_out === true,
    error: typeof state.error === "string" ? state.error.slice(0, 4000) : null
  };
}

async function claudeAuthStatus() {
  const claudeBin = process.env.CLAUDE_BRIDGE_CLAUDE_BIN || "claude";
  const { stdout } = await execFileAsync(claudeBin, ["auth", "status", "--json"], {
    timeout: 10_000,
    env: safeClaudeEnvironment()
  });
  return JSON.parse(stdout);
}

async function startRequest(input, resumeSessionId = null, parentJobId = null) {
  const auth = await claudeAuthStatus();
  if (
    auth.loggedIn !== true
    || auth.authMethod !== "claude.ai"
    || auth.apiProvider !== "firstParty"
    || !auth.subscriptionType
  ) {
    throw new Error("Claude subscription login is required; API and third-party billing are disabled.");
  }
  const cwd = await assertWorkingDirectory(input.cwd);
  const policy = await loadPolicyPacket(cwd, input.policy_root);
  const firstLine = input.prompt.trim().split(/\r?\n/, 1)[0].trim();
  return createJob({
    cwd,
    label: input.label || firstLine.slice(0, 120) || "Claude specialist job",
    model: input.model,
    effort: input.effort,
    timeout_seconds: input.timeout_seconds,
    allow_web: input.allow_web,
    root_coordinator: input.root_coordinator,
    role: input.role,
    verification: input.verification,
    parent_job_id: parentJobId,
    resume_session_id: resumeSessionId,
    policy_root: policy.root,
    policy_files: policy.files,
    policy_text: policy.text,
    delegated_prompt: buildDelegatedPrompt({
      prompt: input.prompt,
      rootCoordinator: input.root_coordinator,
      role: input.role,
      verification: input.verification,
      allowWeb: input.allow_web
    })
  });
}

async function readStoredResult(dir) {
  try {
    return await readJson(path.join(dir, "result.json"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

const server = new McpServer({
  name: "claude-bridge",
  version: "0.1.0"
});

server.registerTool("claude_health", {
  description: "Check the Claude CLI and its sanitized Claude subscription login. This bridge never forwards API billing credentials.",
  inputSchema: {}
}, async () => {
  try {
    const claudeBin = process.env.CLAUDE_BRIDGE_CLAUDE_BIN || "claude";
    const [{ stdout: version }, auth] = await Promise.all([
      execFileAsync(claudeBin, ["--version"], { timeout: 10_000, env: safeClaudeEnvironment() }),
      claudeAuthStatus()
    ]);
    const subscriptionLogin = auth.loggedIn === true
      && auth.authMethod === "claude.ai"
      && auth.apiProvider === "firstParty"
      && Boolean(auth.subscriptionType);
    return response({
      ok: subscriptionLogin,
      version: version.trim(),
      auth: {
        logged_in: auth.loggedIn === true,
        method: auth.authMethod || null,
        provider: auth.apiProvider || null,
        subscription: auth.subscriptionType || null
      },
      execution_mode: subscriptionLogin
        ? "Claude subscription only"
        : "disabled until Claude subscription login is active",
      state_dir: stateRoot(),
      retention_days: effectiveRetentionDays(),
      max_active_jobs: effectiveMaxActiveJobs(),
      default_network_tools: "disabled"
    });
  } catch (error) {
    return failure(error);
  }
});

server.registerTool("claude_start", {
  description: "Start a detached, subscription-only, read-only Claude specialist job. policy_root explicitly trusts the portable CLAUDE.md/.agent packet. Network tools are disabled unless allow_web is true.",
  inputSchema: {
    prompt: z.string().min(1).max(190_000),
    cwd: z.string().min(1),
    policy_root: z.string().min(1).describe("Trusted directory containing CLAUDE.md and .agent/; cwd must be inside it"),
    label: labelSchema.optional(),
    model: modelSchema.default("fable"),
    effort: effortSchema.default("high"),
    timeout_seconds: z.number().int().min(30).max(3600).default(1800),
    allow_web: z.boolean().default(false),
    root_coordinator: metadataSchema.default("Codex root coordinator; model unspecified"),
    role: metadataSchema.default("principal read-only specialist"),
    verification: metadataSchema.default("Return evidence and identify uncertainty")
  }
}, async input => {
  try {
    return response(await startRequest(input));
  } catch (error) {
    return failure(error);
  }
});

server.registerTool("claude_reply", {
  description: "Fork a completed or failed Claude session for a post-completion follow-up. This does not steer a running job.",
  inputSchema: {
    job_id: z.string().uuid(),
    prompt: z.string().min(1).max(190_000),
    effort: effortSchema.optional(),
    timeout_seconds: z.number().int().min(30).max(3600).optional(),
    allow_web: z.boolean().default(false),
    label: labelSchema.optional(),
    role: metadataSchema.optional(),
    verification: metadataSchema.optional()
  }
}, async input => {
  try {
    const state = await readJobState(input.job_id);
    if (!["completed", "failed"].includes(state.status) || !state.session_id) {
      throw new Error("The source job must be completed or failed and have a Claude session ID.");
    }
    const previous = await readJobRequest(input.job_id);
    return response(await startRequest({
      prompt: input.prompt,
      cwd: previous.cwd,
      policy_root: previous.policy_root,
      label: input.label || `Follow-up: ${previous.label}`.slice(0, 120),
      model: previous.model,
      effort: input.effort || previous.effort,
      timeout_seconds: input.timeout_seconds || previous.timeout_seconds,
      allow_web: input.allow_web,
      root_coordinator: previous.root_coordinator,
      role: input.role || previous.role,
      verification: input.verification || previous.verification
    }, state.session_id, input.job_id));
  } catch (error) {
    return failure(error);
  }
});

server.registerTool("claude_status", {
  description: "Check a Claude bridge job and sanitized recent event metadata without returning the answer.",
  inputSchema: { job_id: z.string().uuid() }
}, async ({ job_id }) => {
  try {
    const dir = await jobDirectory(job_id);
    const state = await readJobState(job_id);
    const eventTail = await readTail(path.join(dir, "events.jsonl"), 24_000);
    return response({
      ...publicState(state),
      recent_events: parseRecentEvents(eventTail),
      recent_stderr: await readTail(path.join(dir, "stderr.log"), 4000)
    });
  } catch (error) {
    return failure(error);
  }
});

server.registerTool("claude_result", {
  description: "Return bounded answer text and bounded terminal metadata, including failure details when available.",
  inputSchema: {
    job_id: z.string().uuid(),
    max_chars: z.number().int().min(1000).max(100_000).default(30_000)
  }
}, async ({ job_id, max_chars }) => {
  try {
    const dir = await jobDirectory(job_id);
    const state = await readJobState(job_id);
    if (!terminalStatuses.has(state.status)) {
      return response({
        ...publicState(state),
        ready: false,
        recent_stderr: await readTail(path.join(dir, "stderr.log"), 4000)
      });
    }
    const stored = await readStoredResult(dir);
    const text = stored?.result || "";
    const responseTruncated = text.length > max_chars;
    return response({
      ...publicState(state),
      ready: true,
      result: responseTruncated ? `${text.slice(0, max_chars)}\n[truncated]` : text || null,
      truncated: responseTruncated || stored?.result_truncated_at_storage === true,
      is_error: stored?.is_error ?? state.status !== "completed",
      duration_ms: stored?.duration_ms ?? null,
      duration_api_ms: stored?.duration_api_ms ?? null,
      num_turns: stored?.num_turns ?? null,
      total_cost_usd: stored?.total_cost_usd ?? null,
      usage: stored?.usage ?? null
    });
  } catch (error) {
    return failure(error);
  }
});

server.registerTool("claude_cancel", {
  description: "Cancel a queued or running Claude bridge job and terminate its owned process group.",
  inputSchema: { job_id: z.string().uuid() }
}, async ({ job_id }) => {
  try {
    return response(publicState(await cancelJob(job_id)));
  } catch (error) {
    return failure(error);
  }
});

server.registerTool("claude_jobs", {
  description: "List recent Claude bridge jobs so detached work can be recovered in a later Codex session.",
  inputSchema: { limit: z.number().int().min(1).max(100).default(20) }
}, async ({ limit }) => {
  try {
    await pruneJobs(effectiveRetentionDays());
    return response({ jobs: await listJobs(limit) });
  } catch (error) {
    return failure(error);
  }
});

server.registerTool("claude_forget", {
  description: "Delete a terminal bridge job's local prompt, policy packet, logs, and result. Claude may retain its own resumable session separately.",
  inputSchema: { job_id: z.string().uuid() }
}, async ({ job_id }) => {
  try {
    return response(await forgetJob(job_id));
  } catch (error) {
    return failure(error);
  }
});

await pruneJobs(effectiveRetentionDays());
const pruneTimer = setInterval(() => {
  void pruneJobs(effectiveRetentionDays()).catch(() => {});
}, 60 * 60 * 1000);
pruneTimer.unref();

const transport = new StdioServerTransport();
await server.connect(transport);
