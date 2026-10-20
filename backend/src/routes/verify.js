import express from "express";
import { authenticatedUser, safeUser } from "../lib/request-auth.js";
import { logRouteFailure } from "../lib/http-observability.js";
export const router = express.Router();
router.get("/", async (req, res) => { try { const user = await authenticatedUser(req); if (!user) return res.status(401).json({ success: false, message: "Invalid access token" }); return res.status(200).json({ success: true, message: "Token valid", data: safeUser(user) }); } catch { logRouteFailure(req, "auth_token_verification_failed", 401); return res.status(401).json({ success: false, message: "Token verification failed" }); } });
export default router;
