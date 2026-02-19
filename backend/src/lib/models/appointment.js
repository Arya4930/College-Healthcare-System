import mongoose from "mongoose";
import { Schema } from "mongoose";

const appointmentSchema = new Schema({
    student: { type: String, required: true },
    doctor: { type: String },
    parent: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String },
    reason: { type: String, required: true },
    prescription: { type: String },
    diagnosis: { type: String },
    status: {
        type: String,
        enum: ["pending", "approved", "completed"],
        default: "pending",
    },
})
const AppointmentModel = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
export default AppointmentModel;
