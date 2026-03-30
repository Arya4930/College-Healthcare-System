import express from "express";
import jwt from "jsonwebtoken";
import Appointment from "../../lib/models/appointment.js";
import User from "../../lib/models/Users.js";

const router = express.Router();

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
        const pending = await Appointment.find({ status: "pending" });
        const myAppointments = await Appointment.find({
            doctor: user.ID
        });

        const combinedAppointments = [...pending, ...myAppointments];

        const parentIds = [...new Set(
            combinedAppointments
                .map((appointment) => appointment.parent)
                .filter(Boolean)
        )];

        const parentUsers = await User.find({ ID: { $in: parentIds } }).select("ID phone");
        const parentPhoneMap = new Map(parentUsers.map((parentUser) => [parentUser.ID, parentUser.phone]));

        const data = combinedAppointments.map((appointment) => ({
            ...appointment.toObject(),
            parentPhone: parentPhoneMap.get(appointment.parent) || "",
        }));

        return res.json({
            success: true,
            data
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch appointments"
        });
    }
});

export default router;
