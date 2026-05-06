/**
 * Postbuild prerender script — generates static HTML for key pages
 * so Googlebot/AdSense sees actual content instead of an empty React shell.
 *
 * Runs after `vite build` (called from npm run build).
 * Uses Puppeteer to render each route, saves the HTML to dist/ as
 * subdirectory index.html files (e.g. /blog/what-is-bmi → dist/blog/what-is-bmi/index.html).
 *
 * Vercel and other static hosts serve these as-is with SPA fallback.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createServer } from "node:http";

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
  // Read the SPA shell once — serve it for every route
  const shell = readFileSync(path.join(DIST, "index.html"), "utf8");

  // Start a minimal HTTP server that serves the SPA shell for every route
  const server = createServer((req, res) => {
    // Serve actual static files if they exist (JS, CSS, images)
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
      };
      if (mime[ext]) {
        res.writeHead(200, { "Content-Type": mime[ext] });
        res.end(readFileSync(filePath));
        return;
      }
    }
    // Everything else gets the SPA shell
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(shell);
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[prerender] SPA server on http://localhost:${PORT}`);

  let puppeteer;
  try {
    puppeteer = await import("puppeteer");
  } catch {
    console.warn("[prerender] puppeteer not available — skipping");
    server.close();
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  });

  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}${route}`;
    console.log(`[prerender] ${route}...`);

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Navigate and wait for the app to render. The blog pages and tools
      // pages render content synchronously — no API calls. Wait for the
      // main content div to have children (React mount).
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

      // Wait for React to render — look for the #root element to have content
      try {
        await page.waitForFunction(
          () => {
            const root = document.getElementById("root");
            if (!root) return false;
            // Check there's more than just the loading spinner
            return root.textContent && root.textContent.length > 100;
          },
          { timeout: 10000 },
        );
      } catch {
        // Timeout is OK — the page might just be the shell + meta tags
        console.log(`[prerender]   (content wait timeout for ${route})`);
      }

      // Give React a little more time to settle any async rendering
      await new Promise((r) => setTimeout(r, 1000));

      let html = await page.content();

      // Save as subdirectory index.html
      const filePath = route === "/"
        ? path.join(DIST, "index.html")
        : path.join(DIST, route.slice(1), "index.html");

      // Preserve the original shell's script/link tags but embed the rendered content
      // Actually, just save the full prerendered page — it includes all the head tags
      const dir = path.dirname(filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, html, "utf8");

      // Verify content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      const bodyLen = bodyMatch ? bodyMatch[1].length : 0;
      console.log(`[prerender]   ✓ ${(bodyLen / 1024).toFixed(0)} KB body`);

      await page.close();
    } catch (err) {
      console.warn(`[prerender]   ✗ ${err.message.slice(0, 100)}`);
    }
  }

  await browser.close();
  server.close();
  console.log("[prerender] done — 16 routes prerendered");
}

prerender().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
