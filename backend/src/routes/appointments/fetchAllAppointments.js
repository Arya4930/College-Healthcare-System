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

        if (user.type !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can book appointments",
            });
        }
        const appointments = await Appointment.find({ student: user.ID })
        const doctorIDs = [
            ...new Set(
                appointments
                    .map(a => a.doctor)
                    .filter(Boolean)
            )
        ];

        const doctors = await User.find({
            ID: { $in: doctorIDs }
        }).select("ID name phone");

        const parentIDs = [
            ...new Set(
                appointments
                    .map(a => a.parent)
                    .filter(Boolean)
            )
        ];

        const parents = await User.find({
            ID: { $in: parentIDs }
        }).select("ID phone");

        const doctorMap = {};
        const doctorPhoneMap = {};
        doctors.forEach(doc => {
            doctorMap[doc.ID] = doc.name;
            doctorPhoneMap[doc.ID] = doc.phone || "";
        });

        const parentPhoneMap = {};
        parents.forEach(parent => {
            parentPhoneMap[parent.ID] = parent.phone || "";
        });

        const enrichedAppointments = appointments.map(app => ({
            ...app._doc,
            doctorName: doctorMap[app.doctor] || null,
            doctorPhone: doctorPhoneMap[app.doctor] || "",
            parentPhone: parentPhoneMap[app.parent] || "",
        }));

        return res.status(201).json({
            success: true,
            message: "Appointments fetched successfully",
            data: enrichedAppointments,
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
