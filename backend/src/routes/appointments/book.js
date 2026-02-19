import express from "express";
import jwt from "jsonwebtoken";
import Appointment from "../../lib/models/appointment.js";
import User from "../../lib/models/Users.js";

const router = express.Router();

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

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
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
                message: "Only students can book appointments",
            });
        }

        const { date, reason } = req.body;

        if (!date || !reason) {
            return res.status(400).json({
                success: false,
                message: "Date and reason required",
            });
        }

        const appointment = await Appointment.create({
            student: user.ID,
            parent: user.parent || null,
            date,
            reason,
            status: "pending",
        });

        return res.status(201).json({
            success: true,
            message: "Appointment request sent",
            data: appointment,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to book appointment",
        });
    }
});

export default router;
