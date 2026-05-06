/**
 * Postbuild prerender script — generates static HTML for key pages
 * so Googlebot/AdSense sees actual content instead of an empty React shell.
 *
 * Runs after `vite build`. Uses Puppeteer + chrome-aws-lambda for
 * serverless compatibility (Vercel). Saves each route as
 * subdirectory index.html (e.g. /blog/what-is-bmi → dist/blog/what-is-bmi/index.html).
 *
 * Vercel + other static hosts serve these as-is with SPA fallback.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createServer } from "node:http";

// Use chrome-aws-lambda on Vercel (serverless), local puppeteer otherwise
let launchOptions;
if (process.env.VERCEL) {
  // On Vercel, puppeteer downloads Chrome into /vercel/.cache/puppeteer
  // during npm install. Use it directly.
  const puppeteer = await import("puppeteer");
  launchOptions = {
    puppeteer,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  };
} else {
  const puppeteer = await import("puppeteer");
  launchOptions = {
    puppeteer,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
    headless: true,
  };
}

const DIST = path.resolve("dist");
const PORT = 4173;

const ROUTES = [
  "/",
  "/welcome",
  "/tools",
  "/tools/bmi-calculator",
  "/tools/calorie-calculator",
  "/blog",
  "/blog/how-many-calories-should-i-eat",
  "/blog/what-is-bmi",
  "/blog/how-much-water-should-i-drink",
  "/blog/how-to-improve-sleep",
  "/blog/find-health-provider-near-me",
  "/blog/calories-in-boerewors",
  "/legal/privacy",
  "/legal/terms",
  "/for-providers",
  "/for-corporate",
];

async function prerender() {
  const shell = readFileSync(path.join(DIST, "index.html"), "utf8");

  // Minimal HTTP server — serves SPA shell for every route
  const server = createServer((req, res) => {
    const filePath = path.join(DIST, req.url === "/" ? "index.html" : req.url);
    if (existsSync(filePath) && !filePath.endsWith("/")) {
      const ext = path.extname(filePath);
      const mime = {
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".json": "application/json",
      }[ext];
      if (mime) {
        res.writeHead(200, { "Content-Type": mime });
        res.end(readFileSync(filePath));
        return;
      }
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(shell);
  });

  await new Promise((r) => server.listen(PORT, r));
  console.log(`[prerender] server on http://localhost:${PORT}`);

  const browser = await launchOptions.puppeteer.launch({
    args: launchOptions.args,
    ...(launchOptions.executablePath ? { executablePath: launchOptions.executablePath } : {}),
    headless: launchOptions.headless,
  });

  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`;
    console.log(`[prerender] ${route}...`);
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Wait for React to render content
      try {
        await page.waitForFunction(
          () => document.getElementById("root")?.textContent?.length > 100,
          { timeout: 10000 },
        );
      } catch { /* content may be minimal — that's fine */ }

      await new Promise((r) => setTimeout(r, 1500));
      const html = await page.content();

      const filePath = route === "/"
        ? path.join(DIST, "index.html")
        : path.join(DIST, route.slice(1), "index.html");

      const dir = path.dirname(filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, html, "utf8");

      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyLen = bodyMatch ? bodyMatch[1].length : 0;
      console.log(`[prerender]   ✓ ${(bodyLen / 1024).toFixed(0)} KB`);
      await page.close();
    } catch (err) {
      console.warn(`[prerender]   ✗ ${err.message.slice(0, 120)}`);
    }
  }

  await browser.close();
  server.close();
  console.log("[prerender] done — 16 routes");
}

prerender().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
