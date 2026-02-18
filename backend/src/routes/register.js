import express from "express";
import User from "../lib/models/Users.js";
import jwt from "jsonwebtoken";

export const router = express.Router();

export const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (err) {
        console.error("Token generation error:", err instanceof Error ? err.message : "Unknown error");
        throw new Error("Something went wrong generating tokens");
    }
};

router.post("/", async (req, res) => {
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

        const { name, ID, password, type, role, parent = ""} = req.body;

        if (!name || !ID || !password || !type || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const existingUser = await User.findOne({ ID, type });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists with this type" });
        }

        const user = await User.create({
            name,
            ID,
            password,
            type,
            role,
            parent: type === "student" ? parent : undefined,
        });

        const { accessToken } = await generateAccessAndRefreshToken(user._id);

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: { user: createdUser, accessToken }
        });

    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;