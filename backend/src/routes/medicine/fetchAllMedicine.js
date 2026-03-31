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
            .select("student_id doctor_id request_type name description price quantity order createdAt updatedAt");

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

router.get("/doctor", async (req, res) => {
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

        if (user.type !== "doctor") {
            return res.status(403).json({
                success: false,
                message: "Only doctors can view stock orders",
            });
        }

        const orders = await Medicine.find({ doctor_id: user.ID, request_type: "stock" })
            .sort({ createdAt: -1 })
            .select("student_id doctor_id request_type name description price quantity order createdAt updatedAt");

        return res.status(200).json({
            success: true,
            message: "Stock orders fetched successfully",
            data: orders,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch stock orders",
        });
    }
});

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

        const accessTokenSecret = globalThis.process?.env?.ACCESS_TOKEN_SECRET;
        const decoded = jwt.verify(token, accessTokenSecret);
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
                message: "Only parents can view ward medicine orders",
            });
        }

        const wards = await User.find({ type: "student", parent: user.ID }).select("ID name");
        const wardIds = wards.map((ward) => ward.ID);

        if (wardIds.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No wards linked to this parent",
                data: [],
            });
        }

        const wardNameMap = new Map(wards.map((ward) => [ward.ID, ward.name]));

        const orders = await Medicine.find({
            student_id: { $in: wardIds },
            request_type: "medicine",
        })

        const data = orders.map((order) => ({
            ...order.toObject(),
            wardName: wardNameMap.get(order.student_id) || "",
        }));

        return res.status(200).json({
            success: true,
            message: "Ward medicine orders fetched successfully",
            data,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch ward medicine orders",
        });
    }
});

export default router;
