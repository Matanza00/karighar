// Deploys KARIGHAR to Vercel (production).
// Prereq: put a Vercel token in .env.local as VERCEL_TOKEN=...
// Run: node --env-file=.env.local scripts/deploy.mjs
import { spawnSync } from "node:child_process";

const TOKEN = process.env.VERCEL_TOKEN;
if (!TOKEN) {
  console.error("Missing VERCEL_TOKEN in .env.local (create one at https://vercel.com/account/tokens)");
  process.exit(1);
}

// Only the vars the running app actually needs (all public / non-secret).
const SITE_URL = "https://thekarighar.com";
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_SITE_URL: SITE_URL,
};

const PROJECT = "karighar";
const vercel = (args, input) =>
  spawnSync("npx", ["vercel", ...args, "--token", TOKEN], {
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
    input,
    shell: process.platform === "win32",
    encoding: "utf8",
  });

console.log("→ Linking/creating Vercel project…");
vercel(["link", "--yes", "--project", PROJECT]);

console.log("→ Setting environment variables (production)…");
for (const [name, value] of Object.entries(ENV)) {
  if (!value) { console.warn(`  skip ${name} (empty)`); continue; }
  vercel(["env", "rm", name, "production", "--yes"]); // ignore if absent
  const r = vercel(["env", "add", name, "production"], value + "\n");
  console.log(`  ${name}: ${r.status === 0 ? "set" : "FAILED"}`);
}

console.log("→ Deploying to production…");
const dep = vercel(["deploy", "--prod", "--yes"]);
process.exit(dep.status ?? 0);
