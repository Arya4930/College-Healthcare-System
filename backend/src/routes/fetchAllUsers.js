import User from "../lib/models/Users.js";
import express from "express";
import jwt from "jsonwebtoken";

export const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        );

        const adminUser = await User.findById(decoded._id);

        if (!adminUser || adminUser.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can register users",
            });
        }

        const users = await User.find().select("-password -refreshToken");
        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            data: users,
        });
    } catch (err) {
        console.error("Error fetching users:", err instanceof Error ? err.message : "Unknown error");
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
});

export default router;