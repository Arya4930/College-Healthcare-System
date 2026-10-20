import express from "express";
import { authenticatedUser, safeUser } from "../lib/request-auth.js";
import { getRepositories } from "../repositories/index.js";
import { logRouteFailure } from "../lib/http-observability.js";
export const router = express.Router();
router.get("/", async (req, res) => { try { const admin = await authenticatedUser(req); if (!admin) return res.status(401).json({ success: false, message: "Unauthorized: No token" }); if (admin.role !== "admin") return res.status(403).json({ success: false, message: "Only admins can register users" }); const data = (await getRepositories().users.list()).map(safeUser); return res.status(200).json({ success: true, message: "Users fetched successfully", data }); } catch { logRouteFailure(req, "user_list_failed", 500); return res.status(500).json({ success: false, message: "Failed to fetch users" }); } });
export default router;
