import mongoose from "mongoose";
import { Schema } from "mongoose";

const appointmentSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parent: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    prescription: { type: String },
    diagnosis: { type: String },
})
const AppointmentModel = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
export default AppointmentModel;
