import mongoose from "mongoose";
import { Schema } from "mongoose";

const medicineSchema = new Schema(
    {
        student_id: { type: String, required: true, index: true },
        name: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        order: {
            type: String,
            enum: ["pending", "approved", "delivered"],
            default: "pending",
        },
    },
    { timestamps: true }
);
const MedicineModel = mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema);
export default MedicineModel;
