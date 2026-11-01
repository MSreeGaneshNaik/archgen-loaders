#!/usr/bin/env node
// Renders each figure's poster: the live 3D scene's very first frame, at the card's two shapes (wide, and narrow for
// phones), so a card shows the real design from the first paint and the live scene can fade in over it without a jump.
// Writes assets/figures/<slug>-wide.webp and -narrow.webp, and tools/figures/posters.json (sizes and the first readout).
// Needs Playwright with Chromium, and Pillow (python3) for the WebP encode. Run from the repo root after build.mjs and
// build_posts.py:  node tools/figures/posters.mjs   then build.mjs and build_posts.py once more to pick up the sizes.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const OUT = join(ROOT, "assets", "figures");
mkdirSync(OUT, { recursive: true });
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || "playwright");

const SHAPES = { wide: { width: 1280, height: 900 }, narrow: { width: 390, height: 844 } };
const figures = JSON.parse(readFileSync(join(HERE, "figures.json"), "utf8"));
const out = {};
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const f of figures) {
  out[f.slug] = {};
  for (const [shape, viewport] of Object.entries(SHAPES)) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(join(ROOT, "blog", "posts", f.slug + ".html")).href + "?ag3d=poster");
    await page.waitForFunction(() => window.__agPoster, null, { timeout: 120000 });
    const shot = await page.evaluate((id) => {
      const c = document.querySelector("#" + id + " .ag3d-canvas");
      return { url: c.toDataURL("image/png"), w: c.width, h: c.height, readout: window.__agPoster.readout };
    }, "fig-" + f.slug);
    const png = join(OUT, `${f.slug}-${shape}.png`), webp = join(OUT, `${f.slug}-${shape}.webp`);
    writeFileSync(png, Buffer.from(shot.url.split(",")[1], "base64"));
    execFileSync("python3", ["-c", "import sys,os;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],'WEBP',quality=84,method=6);os.remove(sys.argv[1])", png, webp]);
    out[f.slug][shape] = [shot.w, shot.h];
    out[f.slug].readout = shot.readout;
    console.log("poster", f.slug, shape, shot.w + "x" + shot.h);
    await page.close();
  }
}
await browser.close();
writeFileSync(join(HERE, "posters.json"), JSON.stringify(out, null, 2) + "\n");
