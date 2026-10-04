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
import { initializeRepositories } from "./repositories/index.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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
    await loadApplicationSecrets();
    const { provider } = await initializeRepositories();
    console.log(`Database provider: ${provider}`);
    if (provider === "dynamodb") console.log(`DynamoDB endpoint: ${process.env.DYNAMODB_ENDPOINT ? "local" : "AWS"}`);

    const port = Number(process.env.PORT) || 4000;
    app.listen(port, "0.0.0.0", () => {
      console.log(`CampusCare Express server listening on 0.0.0.0:${port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`CampusCare backend failed to start: ${message}`);
    process.exitCode = 1;
  }
}

startServer();
