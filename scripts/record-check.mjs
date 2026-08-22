// Pipeline validation: records a short public tour (no login) → MP4.
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.resolve("videos");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
const video = page.video();
for (const p of ["/", "/book", "/pro", "/support", "/terms"]) {
  await page.goto(BASE + p);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1800);
}
await context.close();
const webm = await video.path();
const mp4 = path.join(OUT, "karighar-public-tour.mp4");
execFileSync(ffmpegPath, ["-y", "-i", webm, "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4], { stdio: "ignore" });
await browser.close();
console.log("saved", mp4, statSync(mp4).size, "bytes");
