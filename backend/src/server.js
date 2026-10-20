/* global process */

import express from "express";
import cors from "cors";

import statusRoutes from "./routes/status.js";
import registerRoutes from "./routes/register.js";
import loginRoutes from "./routes/login.js";
import verifyRoutes from "./routes/verify.js";
import fetchAllUsersRoutes from "./routes/fetchAllUsers.js";
import bookRoute from "./routes/appointments/book.js";
import fetchAllAppointmentsRoutes from "./routes/appointments/fetchAllAppointments.js";
import fetchDoctorAppointments from "./routes/appointments/fetchDoctorAppointments.js";
import acceptAppointment from "./routes/appointments/acceptAppointment.js";
import complete from "./routes/appointments/complete.js"
import fetchParentAppointments from "./routes/appointments/fetchParentAppointments.js"
import medicineCheckoutRoute from "./routes/medicine/checkout.js";
import fetchAllMedicineRoute from "./routes/medicine/fetchAllMedicine.js";
import { loadApplicationSecrets } from "./lib/secrets.js";
import { initializeAuthProvider } from "./auth/provider.js";
import { closeRepositories, initializeRepositories } from "./repositories/index.js";
import { logger } from "./lib/logger.js";
import { finalErrorHandler, requestTelemetry } from "./lib/http-observability.js";

const app = express();
let server;
let shuttingDown = false;
const isProduction = process.env.NODE_ENV === "production";
const frontendOrigin = process.env.FRONTEND_URL;

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(requestTelemetry());

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/status", statusRoutes);
app.use("/api/auth/register", registerRoutes);
app.use("/api/auth/login", loginRoutes);
app.use("/api/auth/verify", verifyRoutes);
app.use("/api/users", fetchAllUsersRoutes);
app.use("/api/appointments/book", bookRoute);
app.use("/api/appointments", fetchAllAppointmentsRoutes);
app.use("/api/appointments/doctor", fetchDoctorAppointments);
app.use("/api/appointments", acceptAppointment);
app.use("/api/appointments", complete);
app.use("/api/appointments", fetchParentAppointments);
app.use("/api/medicine/checkout", medicineCheckoutRoute);
app.use("/api/medicine", fetchAllMedicineRoute);
app.use(finalErrorHandler());

async function startServer() {
  try {
    if (isProduction && !frontendOrigin) {
      throw new Error("FRONTEND_URL is required in production for credentialed CORS.");
    }
    await loadApplicationSecrets();
    await initializeAuthProvider();
    logger.info("authentication_provider_initialized");
    const { provider } = await initializeRepositories();
    logger.info("database_provider_initialized");
    if (provider === "dynamodb") logger.info("dynamodb_client_initialized");

    const port = Number(process.env.PORT) || 4000;
    server = app.listen(port, "0.0.0.0", () => {
      logger.info("backend_started");
    });
  } catch (error) {
    logger.error("backend_start_failed");
    console.error("Backend startup failure:", error?.stack || error);
    process.exitCode = 1;
  }
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("graceful_shutdown_started");
  if (!server) return process.exit(0);
  const forcedExit = setTimeout(() => {
    logger.error("graceful_shutdown_timed_out");
    process.exit(1);
  }, 30000);
  forcedExit.unref();
  server.close(async (closeFailure) => {
    clearTimeout(forcedExit);
    if (closeFailure) {
      logger.error("graceful_shutdown_failed");
      process.exit(1);
    }
    try {
      await closeRepositories();
      logger.info("graceful_shutdown_completed");
      process.exit(0);
    } catch {
      logger.error("repository_shutdown_failed");
      process.exit(1);
    }
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
startServer();
