#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const policyRoot = path.resolve(root, "../..");
const stateDir = await mkdtemp(path.join(os.tmpdir(), "claude-bridge-live-"));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(root, "src", "server.mjs")],
  cwd: root,
  stderr: "pipe",
  env: { ...process.env, CLAUDE_BRIDGE_STATE_DIR: stateDir }
});
const client = new Client({ name: "claude-bridge-live-smoke", version: "1.0.0" });

async function call(name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  const text = result.content.find(item => item.type === "text")?.text;
  if (result.isError) throw new Error(text || `${name} failed`);
  return JSON.parse(text);
}

async function finish(jobId) {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    const status = await call("claude_status", { job_id: jobId });
    if (status.status === "completed") return call("claude_result", { job_id: jobId, max_chars: 5000 });
    if (["failed", "cancelled"].includes(status.status)) {
      throw new Error(`${status.status}: ${status.error}\n${status.recent_stderr || ""}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  await call("claude_cancel", { job_id: jobId });
  throw new Error("Live smoke timed out.");
}

try {
  await client.connect(transport);
  const health = await call("claude_health");
  assert.equal(health.ok, true);

  const started = await call("claude_start", {
    prompt: "Reply with exactly BRIDGE_OK and nothing else.",
    cwd: root,
    policy_root: policyRoot,
    model: process.env.CLAUDE_BRIDGE_LIVE_MODEL || "fable",
    effort: process.env.CLAUDE_BRIDGE_LIVE_EFFORT || "low",
    timeout_seconds: 240
  });
  const first = await finish(started.job_id);
  assert.match(first.result, /BRIDGE_OK/);
  assert.ok(first.session_id);

  const continued = await call("claude_reply", {
    job_id: started.job_id,
    prompt: "Reply with exactly FOLLOWUP_OK and nothing else.",
    effort: "low",
    timeout_seconds: 240
  });
  const second = await finish(continued.job_id);
  assert.match(second.result, /FOLLOWUP_OK/);
  assert.notEqual(second.session_id, first.session_id);

  console.log(JSON.stringify({
    ok: true,
    model: process.env.CLAUDE_BRIDGE_LIVE_MODEL || "fable",
    auth: health.auth,
    start: { job_id: started.job_id, session_id: first.session_id },
    reply: { job_id: continued.job_id, session_id: second.session_id }
  }, null, 2));
} finally {
  await transport.close();
  await rm(stateDir, { recursive: true, force: true });
}
