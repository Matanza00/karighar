// Serves the exported mobile web build and screenshots it at phone size.
// Run from the karighar/ (web) dir which has playwright installed:
//   node scripts/shot-mobile.mjs [route] [outfile]
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const DIST = path.resolve("../karighar-mobile/dist");
const PORT = 8091;
const out = process.argv[2] || "../karighar-mobile/preview.png";
const route = process.argv[3] || "/";
const TYPES = { ".js": "text/javascript", ".html": "text/html", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".ttf": "font/ttf", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

const server = http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(DIST, url);
  const isFile = existsSync(file) && statSync(file).isFile();
  if (!isFile) file = path.join(DIST, "index.html"); // SPA fallback
  try {
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(PORT, async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(`http://localhost:${PORT}${route}`);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: out });
  await browser.close();
  server.close();
  console.log("screenshot saved:", out);
});
