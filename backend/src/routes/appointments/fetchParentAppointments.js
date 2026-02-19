import express from "express";
import jwt from "jsonwebtoken";
import Appointment from "../../lib/models/appointment.js";
import User from "../../lib/models/Users.js";

const router = express.Router();

router.get("/parent", async (req, res) => {
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

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid user",
            });
        }

        if (user.type !== "parent") {
            return res.status(403).json({
                success: false,
                message: "Only parents can view this",
            });
        }

        const appointments = await Appointment.find({
            parent: user.ID
        });

        return res.status(200).json({
            success: true,
            message: "Appointments fetched successfully",
            data: appointments,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch appointments",
        });
    }
});

export default router;
