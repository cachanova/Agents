#!/usr/bin/env node

import { once } from "node:events";

process.stdout.write("LOCKED\n");
process.stdin.resume();
await once(process.stdin, "end");
