import express from "express";
import jwt from "jsonwebtoken";
import User from "../../lib/models/Users.js";
import Medicine from "../../lib/models/medicine.js";

const router = express.Router();

router.get("/student", async (req, res) => {
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

        const accessTokenSecret = globalThis.process?.env?.ACCESS_TOKEN_SECRET;
        const decoded = jwt.verify(token, accessTokenSecret);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid user",
            });
        }

        if (user.type !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can view medicine orders",
            });
        }

        const orders = await Medicine.find({ student_id: user.ID })
            .sort({ createdAt: -1 })
            .select("student_id name description price quantity order createdAt updatedAt");

        return res.status(200).json({
            success: true,
            message: "Medicine orders fetched successfully",
            data: orders,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch medicine orders",
        });
    }
});

export default router;
