const service = "campuscare-backend";

function write(level, message, fields = {}) {
  const entry = { level, message, service, timestamp: new Date().toISOString(), ...fields };
  if (process.env.NODE_ENV === "production") {
    console.log(JSON.stringify(entry));
  } else {
    const detail = typeof fields.error === "string" ? `: ${fields.error}` : "";
    console.log(`[${entry.level}] ${entry.message}${detail}`);
  }
}

export const logger = {
  info: (message, fields) => write("info", message, fields),
  error: (message, fields) => write("error", message, fields),
};
