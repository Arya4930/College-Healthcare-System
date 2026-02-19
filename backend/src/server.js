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
import { connectDB } from "./lib/mongodb.js";
import "dotenv/config";

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

app.listen(4000, async () => {
    console.log(`🚀 Express JS server running on port 4000`);
    await connectDB();
});
