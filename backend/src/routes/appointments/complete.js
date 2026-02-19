import jwt from "jsonwebtoken";
import express from "express";
import User from "../../lib/models/Users.js"
import Appointment from "../../lib/models/appointment.js";

const router = express.Router();

router.put("/complete/:id", async (req, res) => {
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

        if (user.type !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "Only students can book appointments",
            });
        }
        const { prescription, diagnosis } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                prescription,
                diagnosis,
                status: "completed"
            },
            { new: true }
        );

        return res.json({
            success: true,
            data: appointment
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to add prescription"
        });
    }
});

export default router;