// Signs into the exported mobile web build as the demo customer and screenshots
// the authenticated flow (Book tab + service detail) to verify live data.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const DIST = path.resolve("../karighar-mobile/dist");
const PORT = 8092;
const TYPES = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".ttf": "font/ttf", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(DIST, url);
  if (!(existsSync(file) && statSync(file).isFile())) file = path.join(DIST, "index.html");
  try {
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404); res.end("nf");
  }
});

server.listen(PORT, async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const shot = (n) => page.screenshot({ path: `../karighar-mobile/preview-${n}.png` });
  try {
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(3500);
    await page.fill('input[placeholder="you@email.com"]', "demo.customer@karighar.pk");
    await page.fill('input[placeholder="Your password"]', "Karighar#2026");
    await page.getByText("Sign in", { exact: true }).click();
    await page.getByText("Book a service").waitFor({ timeout: 15000 });
    await page.waitForTimeout(2500);
    await shot("book");
    console.log("book screen OK");
    // Open a service
    await page.getByText("AC General Service").first().click();
    await page.waitForTimeout(2500);
    await shot("service");
    console.log("service screen OK");
  } catch (e) {
    console.error("flow error:", e.message);
    await shot("error");
  }
  await browser.close();
  server.close();
});
