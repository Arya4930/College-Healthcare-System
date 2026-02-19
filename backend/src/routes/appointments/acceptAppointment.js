import jwt from "jsonwebtoken";
import Appointment from "../../lib/models/appointment.js";
import User from "../../lib/models/Users.js"
import express from "express";

const router = express.Router();

router.put("/accept/:id", async (req, res) => {
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
        const { time } = req.body;

        if (!time) {
            return res.status(400).json({
                success: false,
                message: "Time required"
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                doctor: user.ID,
                time,
                status: "approved"
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
            message: "Failed to approve appointment"
        });
    }
});

export default router;