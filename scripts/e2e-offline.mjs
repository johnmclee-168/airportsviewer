#!/usr/bin/env node
/**
 * End-to-end check of offline support against the production build.
 *
 * 1. Starts `next start` (mock data) and a headless Google Chrome (via CDP).
 * 2. Loads the app online so the service worker and data cache are populated.
 * 3. Goes offline (Chrome network emulation + stops the server) and asserts that:
 *    - reloading the list still works and shows the offline banner,
 *    - tapping into an airport not visited before still works,
 *    - hard-reloading a visited detail page works,
 *    - an unvisited page falls back to /offline.html.
 *
 * Usage: npm run build && npm run test:e2e-offline
 * Env:   CHROME_PATH to override the Chrome binary location.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = 3399;
const BASE = `http://localhost:${PORT}`;
const DEBUG_PORT = 9339;
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "google-chrome");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "✔" : "✘"} ${label}${ok ? "" : `\n    ${detail}`}`);
  if (!ok) failures.push(label);
};

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  env: { ...process.env, AIRPORTS_SOURCE: "mock" },
  stdio: "ignore",
  detached: true,
});
const stopServer = () => {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // already stopped
  }
};

const profile = mkdtempSync(path.join(tmpdir(), "airports-e2e-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--window-size=390,844",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function waitForHttp(url, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url);
    } catch {
      await sleep(250);
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let ws;
try {
  await waitForHttp(BASE);
  const targets = await (await waitForHttp(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
  ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));

  let nextId = 0;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    pending.get(message.id)?.(message);
    pending.delete(message.id);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) =>
    (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result
      .value;
  const waitFor = async (expression, ms = 8000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await evaluate(expression)) return true;
      await sleep(200);
    }
    return false;
  };
  const goto = async (url) => {
    await send("Page.navigate", { url });
    await sleep(1500);
  };
  const bodyText = () => evaluate("document.body.innerText");
  const LIST_READY = `!!document.querySelector('[aria-label="Airports"] a')`;
  const DETAIL_READY = `!!document.querySelector("#airport-name")`;

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  // ---- Online: populate the service worker and the data cache.
  await goto(BASE);
  if (!(await waitFor("!!navigator.serviceWorker.controller", 4000))) await goto(BASE);
  check("service worker controls the page", await waitFor("!!navigator.serviceWorker.controller"));
  check("list renders online", await waitFor(LIST_READY));
  await goto(`${BASE}/airports/SYD`);
  check("detail renders online", await waitFor(DETAIL_READY));
  await goto(BASE);
  await waitFor(LIST_READY);

  // ---- Offline: emulate no network in the page and stop the server (SW fetches fail too).
  await send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  stopServer();
  await sleep(1000);

  await goto(BASE);
  check("offline: list reloads from cache", await waitFor(LIST_READY));
  const banner = await evaluate(`document.querySelector('[role=status]')?.innerText ?? ""`);
  check("offline: banner explains cached data", /offline/i.test(banner), `banner: "${banner}"`);

  await evaluate(`document.querySelector('a[href="/airports/AAL"]')?.click()`);
  check("offline: tap into an unvisited airport", await waitFor(DETAIL_READY), await bodyText());

  await goto(`${BASE}/airports/SYD`);
  check("offline: hard reload of a visited airport", await waitFor(DETAIL_READY), await bodyText());

  await goto(`${BASE}/airports/LHR`);
  const fallback = await bodyText();
  check("offline: unvisited page shows offline fallback", /hasn't been saved/i.test(fallback), fallback);
} catch (error) {
  failures.push(String(error));
  console.error(error);
} finally {
  ws?.close();
  chrome.kill();
  stopServer();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n${failures.length} offline check(s) failed`);
  process.exit(1);
}
console.log("\nAll offline checks passed");
