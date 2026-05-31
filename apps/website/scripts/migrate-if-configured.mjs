#!/usr/bin/env node
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL;
if (!url || url === "postgres://placeholder") {
  console.log("[migrate] DATABASE_URL not set — skipping drizzle-kit migrate.");
  process.exit(0);
}

console.log("[migrate] Running drizzle-kit migrate…");
try {
  execSync("npx --yes drizzle-kit migrate", { stdio: "inherit" });
} catch (err) {
  console.error("[migrate] drizzle-kit migrate failed.");
  process.exit(1);
}
