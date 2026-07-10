#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);

if (args.includes("--version")) {
  console.log("2.1.206 (Fake Claude Code)");
  process.exit(0);
}

if (args[0] === "auth" && args[1] === "status") {
  console.log(JSON.stringify({
    loggedIn: true,
    authMethod: "claude.ai",
    apiProvider: "firstParty",
    subscriptionType: "max",
    email: "must-not-leak@example.com"
  }));
  process.exit(0);
}

let prompt = "";
for await (const chunk of process.stdin) prompt += chunk;

if (prompt.includes("SLEEP")) {
  await new Promise(resolve => setTimeout(resolve, 10_000));
}

const resumeIndex = args.indexOf("--resume");
const policyIndex = args.indexOf("--append-system-prompt-file");
const toolsIndex = args.indexOf("--tools");
const modelIndex = args.indexOf("--model");
const effortIndex = args.indexOf("--effort");
const forked = args.includes("--fork-session");
const failed = prompt.includes("FAIL");
const sessionId = resumeIndex >= 0 && forked
  ? "22222222-2222-4222-8222-222222222222"
  : failed
    ? "33333333-3333-4333-8333-333333333333"
    : "11111111-1111-4111-8111-111111111111";
const policy = policyIndex >= 0
  ? await readFile(args[policyIndex + 1], "utf8")
  : "";
const tools = toolsIndex >= 0 ? args[toolsIndex + 1].split(",") : [];

console.log(JSON.stringify({
  type: "system",
  subtype: "init",
  session_id: sessionId
}));
console.log(JSON.stringify({
  type: "assistant",
  session_id: sessionId,
  message: { content: [{ type: "tool_use", name: "Read" }] }
}));
console.log(JSON.stringify({
  type: "result",
  subtype: failed ? "error_during_execution" : "success",
  is_error: failed,
  session_id: sessionId,
  result: failed
    ? "Intentional fake Claude failure."
    : prompt.includes("LONG_RESULT")
      ? "x".repeat(50_000)
      : JSON.stringify({
          delegated: prompt.startsWith("DELEGATED_TASK\n"),
          recursion_blocked: prompt.includes("do not invoke Codex or create subagents"),
          resumed: resumeIndex >= 0,
          forked,
          api_key_present: Boolean(process.env.ANTHROPIC_API_KEY),
          unrelated_secret_present: Boolean(
            process.env.OPENAI_API_KEY
            || process.env.GH_TOKEN
            || process.env.CLAUDE_CODE_OAUTH_TOKEN
          ),
          proxy_credentials_present: Object.entries(process.env).some(([key, value]) => (
            /^(?:HTTP|HTTPS|ALL)_PROXY$/i.test(key) && /@/.test(value)
          )),
          prompt_in_argv: args.includes(prompt),
          safe_mode: args.includes("--safe-mode"),
          plan_mode: args[args.indexOf("--permission-mode") + 1] === "plan",
          write_tools_present: tools.some(tool => ["Bash", "Edit", "Write", "Agent"].includes(tool)),
          network_tools_present: tools.some(tool => ["WebSearch", "WebFetch"].includes(tool)),
          model: modelIndex >= 0 ? args[modelIndex + 1] : null,
          effort: effortIndex >= 0 ? args[effortIndex + 1] : null,
          policy_attached: policy.includes("# Claude Code Entry Point") && policy.includes("# Claude Harness Mode"),
          prompt
        }),
  duration_ms: 12,
  duration_api_ms: 8,
  num_turns: 1,
  total_cost_usd: 0,
  usage: { input_tokens: 10, output_tokens: 5 }
}));

if (failed) process.exitCode = 1;
