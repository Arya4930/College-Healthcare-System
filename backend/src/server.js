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
import { closeRepositories, initializeRepositories } from "./repositories/index.js";
import { logger } from "./lib/logger.js";

const app = express();
let server;
let shuttingDown = false;
const isProduction = process.env.NODE_ENV === "production";
const frontendOrigin = process.env.FRONTEND_URL;

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

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

async function startServer() {
  try {
    if (isProduction && !frontendOrigin) {
      throw new Error("FRONTEND_URL is required in production for credentialed CORS.");
    }
    await loadApplicationSecrets();
    const { provider } = await initializeRepositories();
    logger.info("Database provider initialized", { provider });
    if (provider === "dynamodb") logger.info("DynamoDB client initialized", { target: process.env.DYNAMODB_ENDPOINT ? "local" : "aws" });

    const port = Number(process.env.PORT) || 4000;
    server = app.listen(port, "0.0.0.0", () => {
      logger.info("CampusCare backend started", { host: "0.0.0.0", port, provider });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("CampusCare backend failed to start", { error: message });
    process.exitCode = 1;
  }
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Graceful shutdown started", { signal });
  if (!server) return process.exit(0);
  const forcedExit = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    process.exit(1);
  }, 30000);
  forcedExit.unref();
  server.close(async (error) => {
    clearTimeout(forcedExit);
    if (error) {
      logger.error("Graceful shutdown failed", { error: error.message });
      process.exit(1);
    }
    try {
      await closeRepositories();
      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (closeError) {
      logger.error("Repository shutdown failed", { error: closeError instanceof Error ? closeError.message : "Unknown error" });
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
startServer();
