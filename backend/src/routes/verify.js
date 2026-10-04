import express from "express";
import { authenticatedUser, safeUser } from "../lib/request-auth.js";
export const router = express.Router();
router.get("/", async (req, res) => { try { const user = await authenticatedUser(req); if (!user) return res.status(401).json({ success: false, message: "Invalid access token" }); return res.status(200).json({ success: true, message: "Token valid", data: safeUser(user) }); } catch (error) { console.error("Token verification failed:", error instanceof Error ? error.message : "Unknown error"); return res.status(401).json({ success: false, message: "Token verification failed" }); } });
export default router;
