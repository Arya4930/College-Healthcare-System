/* global process */

const service = "campuscare-backend";
const approvedFields = ["requestId", "statusCode", "route", "durationMs"];

function safeFields(fields = {}) {
  return Object.fromEntries(approvedFields.flatMap((field) => {
    const value = fields[field];
    if (field === "statusCode" && Number.isInteger(value) && value >= 100 && value <= 599) return [[field, value]];
    if (field === "durationMs" && Number.isFinite(value) && value >= 0) return [[field, Math.round(value)]];
    if ((field === "requestId" || field === "route") && typeof value === "string" && value.length <= 200) return [[field, value]];
    return [];
  }));
}

export function createLogger({ write = console.log } = {}) {
  function log(level, event, fields) {
    const entry = { level, event, service, timestamp: new Date().toISOString(), ...safeFields(fields) };
    write(process.env.NODE_ENV === "production" ? JSON.stringify(entry) : `[${entry.level}] ${entry.event}`);
  }

  return {
    info: (event, fields) => log("info", event, fields),
    error: (event, fields) => log("error", event, fields),
  };
}

export const logger = createLogger();
