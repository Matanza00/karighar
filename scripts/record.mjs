// Records customer / provider / admin walkthroughs to MP4 — slow & narrated,
// with a visible cursor, click ripples, and on-screen captions.
// Prereqs: dev server on http://localhost:3000, demo accounts seeded.
// Run: node scripts/record.mjs [customer|provider|admin]
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { ACCOUNTS } from "./seed.mjs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("videos");
mkdirSync(OUT, { recursive: true });

const pause = (page, ms = 1200) => page.waitForTimeout(ms);

// Injects a fake cursor, click ripple, and a caption bar into every page.
async function installOverlay(page) {
  await page.addInitScript(() => {
    if (window.__kg) return;
    window.__kg = true;
    const add = () => {
      if (!document.body || document.getElementById("kg-cursor")) return;
      const style = document.createElement("style");
      style.textContent = `
        #kg-cursor{position:fixed;z-index:2147483647;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;
          background:rgba(15,118,110,.30);border:2px solid #0f766e;pointer-events:none;left:0;top:0;transition:left .04s linear,top .04s linear}
        #kg-caption{position:fixed;z-index:2147483647;left:50%;bottom:28px;transform:translateX(-50%);
          background:rgba(15,23,42,.94);color:#fff;padding:11px 22px;border-radius:9999px;
          font:600 16px/1.2 system-ui,sans-serif;pointer-events:none;max-width:90vw;opacity:0;
          transition:opacity .25s;box-shadow:0 8px 30px rgba(0,0,0,.25)}
        .kg-ripple{position:fixed;z-index:2147483646;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;
          background:rgba(245,158,11,.55);pointer-events:none;animation:kgpop .55s ease-out forwards}
        @keyframes kgpop{from{transform:scale(1);opacity:.85}to{transform:scale(6);opacity:0}}`;
      document.head.appendChild(style);
      const cur = document.createElement("div"); cur.id = "kg-cursor"; document.body.appendChild(cur);
      const cap = document.createElement("div"); cap.id = "kg-caption"; document.body.appendChild(cap);
      addEventListener("mousemove", (e) => { cur.style.left = e.clientX + "px"; cur.style.top = e.clientY + "px"; }, true);
      addEventListener("mousedown", (e) => {
        const r = document.createElement("div"); r.className = "kg-ripple";
        r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
        document.body.appendChild(r); setTimeout(() => r.remove(), 550);
      }, true);
      window.__kgCap = (t) => { cap.textContent = t || ""; cap.style.opacity = t ? "1" : "0"; };
    };
    if (document.body) add(); else addEventListener("DOMContentLoaded", add);
  });
}

async function caption(page, text) {
  await page.evaluate((t) => window.__kgCap && window.__kgCap(t), text).catch(() => {});
}

async function glide(page, x, y) {
  await page.mouse.move(x, y, { steps: 24 });
}

async function go(page, url, cap) {
  await page.goto(BASE + url);
  await page.waitForLoadState("networkidle").catch(() => {});
  await pause(page, 600);
  if (cap) await caption(page, cap);
  await pause(page, 1600);
}

async function click(page, selector, cap) {
  const el = page.locator(selector).first();
  await el.waitFor({ timeout: 8000 }).catch(() => {});
  if (!(await el.count())) return false;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  if (cap) await caption(page, cap);
  const box = await el.boundingBox().catch(() => null);
  if (box) { await glide(page, box.x + box.width / 2, box.y + box.height / 2); await pause(page, 550); }
  await el.click().catch(() => {});
  await pause(page, 1100);
  return true;
}

async function typeInto(page, selector, text, cap) {
  const el = page.locator(selector).first();
  await el.waitFor({ timeout: 8000 }).catch(() => {});
  if (!(await el.count())) return;
  await el.scrollIntoViewIfNeeded().catch(() => {});
  if (cap) await caption(page, cap);
  const box = await el.boundingBox().catch(() => null);
  if (box) { await glide(page, box.x + 24, box.y + box.height / 2); await pause(page, 400); }
  await el.click().catch(() => {});
  await el.fill("");
  await el.type(text, { delay: 70 });
  await pause(page, 800);
}

async function signIn(page, email, password) {
  await go(page, "/signin", "Signing in");
  await typeInto(page, 'input[type="email"]', email, "Enter your email");
  await typeInto(page, 'input[type="password"]', password, "Enter your password");
  await click(page, 'button:has-text("Sign in")', "Tap Sign in");
  await page.waitForTimeout(3000);
}

async function record(name, flow) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  await installOverlay(page);
  const video = page.video();
  try {
    await flow(page);
    await caption(page, "✓ Walkthrough complete");
    await pause(page, 2500);
  } catch (e) {
    console.error(`[${name}] flow error:`, e.message);
  }
  await context.close();
  await browser.close();
  const webm = await video.path();
  const mp4 = path.join(OUT, `karighar-${name}.mp4`);
  if (existsSync(mp4)) { try { rmSync(mp4); } catch {} }
  const args = ["-y", "-i", webm, "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4];
  let ok = false;
  for (let a = 1; a <= 3 && !ok; a++) {
    try { execFileSync(ffmpegPath, args, { stdio: "ignore" }); ok = true; }
    catch (e) { console.warn(`  ffmpeg attempt ${a} failed (${e.status}); retrying…`); await new Promise((r) => setTimeout(r, 1500)); }
  }
  console.log(ok ? `✔ saved ${mp4}` : `✖ ffmpeg failed for ${name}; webm kept at ${webm}`);
}

// ---------------- CUSTOMER ----------------
async function customerFlow(page) {
  await go(page, "/", "KARIGHAR — book verified home-service pros in Karachi");
  await go(page, "/signup", "New customer? Create an account");
  await typeInto(page, 'input[placeholder="Ahmed Khan"]', "Ayesha Khan", "Enter your name");
  await typeInto(page, 'input[placeholder="03XX-XXXXXXX"]', "0300 1234567", "Enter your phone number");
  await typeInto(page, 'input[type="email"]', `new.customer.${Date.now()}@thekarighar.com`, "Enter your email");
  await typeInto(page, 'input[type="password"]', "Karighar#2026", "Choose a password");
  await click(page, 'button:has-text("Create account")', "Tap Create account");
  await pause(page, 2500);

  await signIn(page, ACCOUNTS.customer.email, ACCOUNTS.customer.password);

  await go(page, "/book", "Browse services — prices are upfront");
  await typeInto(page, 'input[placeholder*="Search"]', "AC", "Search for a service");
  await click(page, 'a:has-text("AC General Service")', "Pick AC General Service");
  await typeInto(page, 'input[placeholder*="House 12"]', "House 12, Street 4, near Expo Centre", "Enter your address");
  await caption(page, "Pick a date & time");
  await page.fill('input[type="date"]', "2026-08-20").catch(() => {});
  await page.fill('input[type="time"]', "14:30").catch(() => {});
  await pause(page, 1200);
  await typeInto(page, "textarea", "AC not cooling, needs a full service.", "Describe the problem");
  await click(page, 'button:has-text("Confirm booking")', "Confirm the booking (Cash on completion)");
  await pause(page, 3500);
  await caption(page, "Your booking is placed — track it live here");
  await pause(page, 2500);

  await go(page, "/bookings", "All your bookings in one place");
  await go(page, "/profile", "Your profile & account");
}

// ---------------- PROVIDER ----------------
async function providerFlow(page) {
  await go(page, "/pro", "Become a Pro — grow your business");
  await go(page, "/signup?role=provider&next=/pro/onboarding", "Apply to become a Pro");
  await typeInto(page, 'input[placeholder="Ahmed Khan"]', "Bilal Ahmed", "Enter your name");
  await typeInto(page, 'input[placeholder="03XX-XXXXXXX"]', "0300 9876543", "Enter your phone");
  await typeInto(page, 'input[type="email"]', `new.pro.${Date.now()}@thekarighar.com`, "Enter your email");
  await typeInto(page, 'input[type="password"]', "Karighar#2026", "Choose a password");
  await click(page, 'button:has-text("Create account")', "Tap Create account");
  await pause(page, 2500);

  await signIn(page, ACCOUNTS.provider.email, ACCOUNTS.provider.password);

  await go(page, "/pro/onboarding", "Your Pro profile — skills, areas & CNIC verification");
  await go(page, "/pro/dashboard", "Provider dashboard — jobs available near you");
  await click(page, 'button:has-text("Accept")', "Accept a job");
  await pause(page, 2200);

  const jobLink = page.locator('a[href^="/pro/jobs/"]').first();
  await jobLink.waitFor({ timeout: 8000 }).catch(() => {});
  if (await jobLink.count()) {
    await click(page, 'a[href^="/pro/jobs/"]', "Open the job");
    await page.waitForURL(/\/pro\/jobs\//, { timeout: 8000 }).catch(() => {});
    await pause(page, 2000);
    // The page shows exactly one full-width primary action button (the next step).
    // Click it repeatedly, reading its label for the caption, until none remains.
    const captions = {
      "I'm on the way": "Head to the customer (live location shared)",
      "I've arrived": "Mark arrived",
      "Start work": "Start the work",
      "Mark completed": "Work completed",
      "Cash received": "Collect cash — payment & commission recorded",
    };
    for (let step = 0; step < 6; step++) {
      const btn = page.locator("button.w-full").first();
      await btn.waitFor({ timeout: 6000 }).catch(() => {});
      if (!(await btn.count()) || !(await btn.isVisible().catch(() => false))) break;
      const label = ((await btn.textContent().catch(() => "")) || "").trim();
      console.log("  provider action:", label);
      await caption(page, captions[label] || label);
      const box = await btn.boundingBox().catch(() => null);
      if (box) { await glide(page, box.x + box.width / 2, box.y + box.height / 2); await pause(page, 500); }
      await btn.click().catch(() => {});
      await page.waitForTimeout(2600);
      if (label === "Cash received") break;
    }
  }
  await go(page, "/pro/history", "Earnings & history — net pay and commission owed");
  await go(page, "/pro/services", "Manage the services & areas you cover");
}

// ---------------- ADMIN ----------------
async function adminFlow(page) {
  await signIn(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  await go(page, "/admin", "Admin overview — live marketplace KPIs");
  await go(page, "/admin/providers", "Verify providers (CNIC + selfie)");
  await click(page, 'button:has-text("Approve")', "Approve a pending provider");
  await pause(page, 2000);
  await go(page, "/admin/jobs", "Monitor every job on the platform");
  await go(page, "/admin/settlements", "Commission settlements owed by pros");
  await go(page, "/admin/disputes", "Handle disputes & support issues");
}

const only = process.argv[2];
async function main() {
  if (!only || only === "customer") await record("customer", customerFlow);
  if (!only || only === "provider") await record("provider", providerFlow);
  if (!only || only === "admin") await record("admin", adminFlow);
  console.log("\nAll videos in:", OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
