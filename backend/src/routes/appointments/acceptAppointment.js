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
                message: "Only doctors can update appointments",
            });
        }
        const { time, date } = req.body;

        if (!time || !date) {
            return res.status(400).json({
                success: false,
                message: "Date and time are required"
            });
        }

        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid appointment date"
            });
        }

        const existingAppointment = await Appointment.findById(req.params.id);

        if (!existingAppointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            });
        }

        if (existingAppointment.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Completed appointments cannot be rescheduled"
            });
        }

        if (existingAppointment.doctor && existingAppointment.doctor !== user.ID) {
            return res.status(403).json({
                success: false,
                message: "You can only update appointments assigned to you"
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            {
                doctor: user.ID,
                date: parsedDate,
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
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to approve appointment"
        });
    }
});

export default router;