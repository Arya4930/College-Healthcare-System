import express from "express";
import jwt from "jsonwebtoken";
import User from "../../lib/models/Users.js";
import Medicine from "../../lib/models/medicine.js";

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
                message: "Only students can order medicines",
            });
        }

        const items = req.body?.cartItems || req.body?.items;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "cartItems is required and must be a non-empty array",
            });
        }

        const medicinesToCreate = items.map((item) => ({
            student_id: user.ID,
            name: item.name,
            description: item.description || "",
            price: Number(item.price),
            quantity: Number(item.quantity),
            order: "pending",
        }));

        const hasInvalidItem = medicinesToCreate.some(
            (item) =>
                !item.name ||
                Number.isNaN(item.price) ||
                item.price < 0 ||
                Number.isNaN(item.quantity) ||
                item.quantity < 1
        );

        if (hasInvalidItem) {
            return res.status(400).json({
                success: false,
                message: "Each cart item must include valid name, price and quantity",
            });
        }

        const createdOrders = await Medicine.insertMany(medicinesToCreate);

        return res.status(201).json({
            success: true,
            message: "Medicine order placed successfully",
            data: createdOrders,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Failed to place medicine order",
        });
    }
});

export default router;
