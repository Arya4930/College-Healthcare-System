import express from "express";
import cors from "cors";

import statusRoutes from "./routes/status.js";
import registerRoutes from "./routes/register.js";
import loginRoutes from "./routes/login.js";
import verifyRoutes from "./routes/verify.js";
import { connectDB } from "./lib/mongodb.js";
import "dotenv/config";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/status", statusRoutes);
app.use("/api/auth/register", registerRoutes);
app.use("/api/auth/login", loginRoutes);
app.use("/api/auth/verify", verifyRoutes);

app.listen(4000, async () => {
    console.log(`🚀 Express TS server running on port 4000`);
    await connectDB();
});
