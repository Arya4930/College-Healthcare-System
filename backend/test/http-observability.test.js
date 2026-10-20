/* global process */

import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import express from "express";
import { createLogger } from "../src/lib/logger.js";
import { finalErrorHandler, requestTelemetry } from "../src/lib/http-observability.js";

async function request(app, path) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    return await fetch(`http://127.0.0.1:${port}${path}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function observedApp(setup) {
  const events = [];
  const log = {
    info: (event, fields) => events.push({ level: "info", event, ...fields }),
    error: (event, fields) => events.push({ level: "error", event, ...fields }),
  };
  const app = express();
  app.use(requestTelemetry({ log }));
  setup(app);
  app.use(finalErrorHandler({ log }));
  return { app, events };
}

test("request telemetry returns an opaque ID and logs only the route template", async () => {
  const { app, events } = observedApp((server) => {
    server.get("/items/:id", (req, res) => res.status(204).end());
  });
  const response = await request(app, "/items/appointment-secret?token=jwt-secret");
  const requestId = response.headers.get("x-request-id");

  assert.equal(response.status, 204);
  assert.match(requestId, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(events, [{
    level: "info",
    event: "http_request_completed",
    requestId,
    statusCode: 204,
    route: "/items/:id",
    durationMs: events[0].durationMs,
  }]);
  assert.equal(Number.isInteger(events[0].durationMs), true);
  assert.equal(JSON.stringify(events).includes("appointment-secret"), false);
  assert.equal(JSON.stringify(events).includes("jwt-secret"), false);
});

test("final error handler returns safe JSON and does not log sensitive error text", async () => {
  const { app, events } = observedApp((server) => {
    server.get("/failure/:id", () => {
      throw new Error("Authorization: Bearer jwt-secret password=not-for-logs");
    });
  });
  const response = await request(app, "/failure/patient-secret?token=jwt-secret");

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { success: false, message: "Server error" });
  assert.equal(events[0].event, "http_request_failed");
  assert.equal(events[0].route, "/failure/:id");
  assert.equal(events[0].statusCode, 500);
  assert.equal(JSON.stringify(events).includes("jwt-secret"), false);
  assert.equal(JSON.stringify(events).includes("patient-secret"), false);
  assert.equal(JSON.stringify(events).includes("password"), false);
});

test("final error handler preserves an explicit safe client-error status", async () => {
  const { app } = observedApp((server) => {
    server.get("/invalid", () => {
      const error = new Error("validation details are private");
      error.status = 422;
      throw error;
    });
  });
  const response = await request(app, "/invalid");

  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { success: false, message: "Request failed" });
});

test("structured logger discards unapproved fields", () => {
  const output = [];
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  createLogger({ write: (entry) => output.push(entry) }).error("request_failed", {
    requestId: "00000000-0000-4000-8000-000000000000",
    statusCode: 500,
    route: "/safe",
    durationMs: 1.2,
    authorization: "Bearer jwt-secret",
    password: "not-for-logs",
    error: { secret: "not-for-logs" },
  });
  if (previous === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previous;

  const entry = JSON.parse(output[0]);
  assert.deepEqual(entry, {
    level: "error",
    event: "request_failed",
    service: "campuscare-backend",
    timestamp: entry.timestamp,
    requestId: "00000000-0000-4000-8000-000000000000",
    statusCode: 500,
    route: "/safe",
    durationMs: 1,
  });
  assert.equal(output[0].includes("jwt-secret"), false);
  assert.equal(output[0].includes("not-for-logs"), false);
});
