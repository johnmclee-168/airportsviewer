#!/usr/bin/env node
/**
 * Local mock of the Qantas airports API, built with Express.
 *
 * Serves mock airports at the same path as the real endpoint
 * (GET /flight/refData/airport), so the app can be pointed at it with
 * AIRPORTS_UPSTREAM_URL and exercise its real network code path.
 *
 * Datasets:
 *   full  mocks/airports.json      Snapshot of the real API (7,189 airports)
 *   alt   mocks/airports-alt.json  AU + NZ only, names suffixed " (alt)" (578 airports;
 *                                  build with `npm run mock:build-alt`)
 *
 * Environment variables:
 *   MOCK_API_PORT       Port to listen on (default 4000)
 *   MOCK_API_DELAY_MS   Response time in milliseconds for every request (default 0)
 *   MOCK_API_DATASET    Dataset to serve: full | alt (default full)
 *
 * Per request, query parameters override them:
 *   GET /flight/refData/airport?delay=8000&dataset=alt
 *
 * While running, change the defaults without a restart:
 *   curl -X POST "http://localhost:4000/__mock/settings?dataset=alt&delay=5000"
 *   curl http://localhost:4000/__mock/settings
 *
 * Usage: npm run mock:server
 *        MOCK_API_DELAY_MS=5000 MOCK_API_DATASET=alt npm run mock:server
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

const MOCKS = resolve(dirname(fileURLToPath(import.meta.url)), "../mocks");
const AIRPORTS_PATH = "/flight/refData/airport";
const DATASET_FILES = {
  full: "airports.json",
  alt: "airports-alt.json",
};
const DATASET_NAMES = Object.keys(DATASET_FILES);

/** Parses a non-negative integer; returns undefined when absent and null when invalid. */
function parseDelay(value) {
  if (value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function isDataset(name) {
  return Object.hasOwn(DATASET_FILES, name);
}

/** Reads a start-up setting, exiting with a clear message when it is invalid. */
function startupSetting(name, parse, fallback) {
  const raw = process.env[name];
  const value = parse(raw);
  if (value === null) {
    console.error(`${name} has an invalid value: "${raw}"`);
    process.exit(1);
  }
  return value ?? fallback;
}

const port = startupSetting("MOCK_API_PORT", parseDelay, 4000);
const settings = {
  delayMs: startupSetting("MOCK_API_DELAY_MS", parseDelay, 0),
  dataset: startupSetting(
    "MOCK_API_DATASET",
    (raw) => (raw === undefined || raw === "" ? undefined : isDataset(raw) ? raw : null),
    "full",
  ),
};

// Load every available dataset once at start-up; they never change while running.
const datasets = {};
for (const [name, file] of Object.entries(DATASET_FILES)) {
  try {
    const body = await readFile(resolve(MOCKS, file), "utf8");
    datasets[name] = { file, body, count: JSON.parse(body).length };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    console.warn(`Dataset "${name}" unavailable: mocks/${file} not found`);
  }
}
if (!datasets[settings.dataset]) {
  console.error(
    `MOCK_API_DATASET=${settings.dataset} but mocks/${DATASET_FILES[settings.dataset]}`,
  );
  console.error(`is missing. Build it with: npm run mock:build-alt`);
  process.exit(1);
}

/** Validates dataset/delay query parameters; returns { error } or the resolved values. */
function resolveOptions(query, fallback) {
  const delayMs = parseDelay(query.delay);
  if (delayMs === null) return { error: "delay must be a non-negative integer (milliseconds)" };
  const dataset = query.dataset ?? fallback.dataset;
  if (!isDataset(dataset)) return { error: `dataset must be one of: ${DATASET_NAMES.join(", ")}` };
  if (!datasets[dataset]) {
    return { error: `dataset "${dataset}" is not built. Run: npm run mock:build-alt` };
  }
  return { delayMs: delayMs ?? fallback.delayMs, dataset };
}

function describeSettings() {
  return {
    ...settings,
    datasets: Object.fromEntries(
      DATASET_NAMES.map((name) => [name, datasets[name]?.count ?? "not built"]),
    ),
  };
}

const app = express();
app.disable("x-powered-by");

// Log each request with its status and total response time.
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const dataset = res.get("X-Mock-Dataset");
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} in ${Date.now() - started}ms` +
        (dataset ? ` (dataset: ${dataset})` : ""),
    );
  });
  next();
});

app.get(AIRPORTS_PATH, (req, res) => {
  const options = resolveOptions(req.query, settings);
  if (options.error) {
    res.status(400).json({ error: options.error });
    return;
  }

  const timer = setTimeout(() => {
    res.set("X-Mock-Dataset", options.dataset);
    res.type("application/json").send(datasets[options.dataset].body);
  }, options.delayMs);
  // Don't keep working for a client that gave up (e.g. the app's upstream timeout).
  res.on("close", () => clearTimeout(timer));
});

// Inspect or change the default dataset and delay without restarting the server.
app.get("/__mock/settings", (_req, res) => {
  res.json(describeSettings());
});

app.post("/__mock/settings", (req, res) => {
  const options = resolveOptions(req.query, settings);
  if (options.error) {
    res.status(400).json({ error: options.error });
    return;
  }
  Object.assign(settings, options);
  console.log(`Settings changed: dataset=${settings.dataset}, delay=${settings.delayMs}ms`);
  res.json(describeSettings());
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, ...describeSettings() });
});

app.use((_req, res) => {
  res.status(404).json({ error: `Not found. Try GET ${AIRPORTS_PATH}` });
});

app.listen(port, () => {
  console.log(`Mock Qantas API: http://localhost:${port}${AIRPORTS_PATH}`);
  console.log(
    `Serving dataset "${settings.dataset}" (${datasets[settings.dataset].count} airports) ` +
      `with a ${settings.delayMs}ms response time`,
  );
  console.log(
    `Change settings: curl -X POST "http://localhost:${port}/__mock/settings?dataset=alt&delay=5000"`,
  );
});
