#!/usr/bin/env node
// Renders tools/social/og.html to assets/social/og-1200x630.png (the link-preview card).
// Run from the repo root: node tools/social/og.mjs   (needs Playwright: npm i -D playwright, or PLAYWRIGHT=/path/to/playwright)
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || "playwright");
const TYPES = { ".html": "text/html", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

// served over http, because the card fetches the site's own wordmark file
const server = createServer(async (req, res) => {
  try { const body = await readFile(join(ROOT, decodeURIComponent(req.url.split("?")[0])));
    res.writeHead(200, { "content-type": TYPES[extname(req.url)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const { port } = server.address();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`http://localhost:${port}/tools/social/og.html`);
await page.waitForFunction(() => document.body.dataset.ready && document.fonts.status === "loaded");
await page.screenshot({ path: join(ROOT, "assets", "social", "og-1200x630.png") });
await browser.close(); server.close();
console.log("wrote assets/social/og-1200x630.png");
