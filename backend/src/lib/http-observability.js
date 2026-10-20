/* global process */

import { randomUUID } from "node:crypto";
import { logger } from "./logger.js";

function routeTemplate(req) {
  if (typeof req.route?.path !== "string") return "unmatched";
  return `${req.baseUrl || ""}${req.route.path}` || "/";
}

export function requestTelemetry({ log = logger } = {}) {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    req.requestId = randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    res.on("finish", () => {
      const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
      log.info("http_request_completed", {
        requestId: req.requestId,
        statusCode: res.statusCode,
        route: routeTemplate(req),
        durationMs,
      });
    });
    next();
  };
}

export function logRouteFailure(req, event, statusCode) {
  logger.error(event, { requestId: req.requestId, statusCode });
}

export function finalErrorHandler({ log = logger } = {}) {
  return (error, req, res, next) => {
    if (res.headersSent) return next(error);
    const requestedStatus = Number(error?.status ?? error?.statusCode);
    const statusCode = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
      ? requestedStatus
      : 500;
    log.error("http_request_failed", {
      requestId: req.requestId,
      statusCode,
      route: routeTemplate(req),
    });
    return res.status(statusCode).json({
      success: false,
      message: statusCode >= 500 ? "Server error" : "Request failed",
    });
  };
}
