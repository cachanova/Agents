#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.includes("--version")) {
  console.log("2.1.206 (Fake API Claude Code)");
  process.exit(0);
}

if (args[0] === "auth" && args[1] === "status") {
  console.log(JSON.stringify({
    loggedIn: true,
    authMethod: "api_key",
    apiProvider: "firstParty",
    subscriptionType: null
  }));
  process.exit(0);
}

console.error("Inference must not start with API authentication.");
process.exit(9);
