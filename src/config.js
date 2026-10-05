const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

if (!import.meta.env.DEV && !configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL must be set for a production frontend build.");
}

export const APIBASE = configuredApiBaseUrl || "http://localhost:4000";
