// Full mobile flow screenshots (customer + provider + chat).
// Run from karighar/: node --env-file=.env.local scripts/shot-mobile-full.mjs
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const DIST = path.resolve("../karighar-mobile/dist");
const PORT = 8093;
const OUT = "../karighar-mobile";
const TYPES = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".ttf": "font/ttf", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const PASS = "Karighar#2026";

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

async function providerJobId() {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const pro = list.users.find((u) => u.email === "demo.provider@karighar.pk");
  if (!pro) return null;
  const { data } = await admin.from("jobs").select("id").eq("provider_id", pro.id).limit(1);
  return data?.[0]?.id ?? null;
}

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(DIST, url);
  if (!(existsSync(file) && statSync(file).isFile())) file = path.join(DIST, "index.html");
  try { res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" }); res.end(await readFile(file)); }
  catch { res.writeHead(404); res.end("nf"); }
});

async function run() {
  const jobId = await providerJobId();
  const browser = await chromium.launch();

  async function session(fn) {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    await fn(page);
    await page.context().close();
  }
  const signIn = async (page, email) => {
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(3500);
    await page.fill('input[placeholder="you@email.com"]', email);
    await page.fill('input[placeholder="Your password"]', PASS);
    await page.getByText("Sign in", { exact: true }).click();
    await page.waitForTimeout(4000);
  };
  const shot = (page, n) => page.screenshot({ path: `${OUT}/preview-${n}.png` });

  // Customer
  await session(async (page) => {
    await signIn(page, "demo.customer@karighar.pk");
    await page.getByText("Book a service").waitFor({ timeout: 15000 });
    await shot(page, "cust-book");
    await page.getByText("Post a custom job").click();
    await page.getByText("Get quotes", { exact: false }).waitFor({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, "cust-custom");
    console.log("customer OK");
  });

  // Provider
  await session(async (page) => {
    await signIn(page, "demo.provider@karighar.pk");
    await page.waitForTimeout(3000);
    await shot(page, "pro-jobs");
    if (jobId) {
      await page.goto(`http://localhost:${PORT}/pro/job/${jobId}`);
      await page.waitForTimeout(3500);
      await shot(page, "pro-job");
      await page.goto(`http://localhost:${PORT}/chat/${jobId}`);
      await page.waitForTimeout(2500);
      await page.fill('input[placeholder="Type a message…"]', "Hi, I'll be there in 15 minutes.");
      await page.getByText("➤").click().catch(() => {});
      await page.waitForTimeout(2000);
      await shot(page, "pro-chat");
    }
    console.log("provider OK (jobId:", jobId, ")");
  });

  await browser.close();
  server.close();
}

server.listen(PORT, () => run().catch((e) => { console.error("error:", e.message); server.close(); process.exit(1); }));
