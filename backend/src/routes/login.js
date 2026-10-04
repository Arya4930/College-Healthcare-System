import express from "express";
import bcrypt from "bcrypt";
import { getRepositories } from "../repositories/index.js";
import { createTokens } from "../lib/auth-tokens.js";
import { safeUser } from "../lib/request-auth.js";

export const router = express.Router();
router.post("/", async (req, res) => {
  try {
    const { ID, password, type } = req.body;
    if (!ID || !password || !type) return res.status(400).json({ success: false, message: "ID, password, and type are required" });
    const users = getRepositories().users;
    const user = await users.findByInstitutionId(ID, type);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ success: false, message: "Invalid password" });
    const { accessToken, refreshToken } = createTokens(user);
    await users.updateRefreshToken(user._id, refreshToken);
    return res.status(200).cookie("accessToken", accessToken, { httpOnly: true, secure: true }).cookie("refreshToken", refreshToken, { httpOnly: true, secure: true }).json({ success: true, message: "User logged in successfully", data: { user: safeUser(user), accessToken, refreshToken } });
  } catch (error) { console.error("Login failed:", error instanceof Error ? error.message : "Unknown error"); return res.status(500).json({ success: false, message: "Server error" }); }
});
export default router;
