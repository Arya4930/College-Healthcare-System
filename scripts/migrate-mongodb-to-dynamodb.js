/* Explicit developer-run migration. It never runs as part of the API startup. */
import "dotenv/config.js";
import { connectDB } from "../backend/src/lib/mongodb.js";
import User from "../backend/src/lib/models/Users.js";
import Appointment from "../backend/src/lib/models/appointment.js";
import Medicine from "../backend/src/lib/models/medicine.js";
import { createDynamoRepositories } from "../backend/src/repositories/dynamodb.js";

const id = (value) => String(value);

async function migrate() {
  await connectDB();
  const repositories = await createDynamoRepositories();
  const users = await User.find().lean();
  for (const user of users) {
    await repositories.users.create({ userId: id(user._id), name: user.name, institutionId: user.ID, passwordHash: user.password, role: user.role, type: user.type, parentId: user.parent || undefined, phone: user.phone, refreshToken: user.refreshToken, createdAt: user.createdAt?.toISOString(), updatedAt: user.updatedAt?.toISOString() });
  }
  const appointments = await Appointment.find().lean();
  for (const appointment of appointments) await repositories.appointments.create({ appointmentId: id(appointment._id), student: appointment.student, doctor: appointment.doctor, parent: appointment.parent, date: appointment.date, time: appointment.time, reason: appointment.reason, prescription: appointment.prescription, diagnosis: appointment.diagnosis, status: appointment.status });
  const orders = await Medicine.find().lean();
  await repositories.orders.createMany(orders.map((order) => ({ orderId: id(order._id), studentId: order.student_id, doctorId: order.doctor_id, requestType: order.request_type, name: order.name, description: order.description, price: order.price, quantity: order.quantity, status: order.order, createdAt: order.createdAt?.toISOString(), updatedAt: order.updatedAt?.toISOString() })));
  console.log("Migration completed. Validate counts and sampled records before switching DATABASE_PROVIDER.");
}

migrate().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Migration failed: ${message}`);
  process.exitCode = 1;
});
