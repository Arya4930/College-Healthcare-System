/* Read-only validation: MongoDB source vs explicitly configured DynamoDB Local target. */
import "dotenv/config.js";
import { connectDB } from "../backend/src/lib/mongodb.js";
import User from "../backend/src/lib/models/Users.js";
import Appointment from "../backend/src/lib/models/appointment.js";
import Medicine from "../backend/src/lib/models/medicine.js";
import { createDynamoRepositories } from "../backend/src/repositories/dynamodb.js";

const endpoint = process.env.DYNAMODB_ENDPOINT?.trim();
const region = process.env.AWS_REGION;
const sampleSize = 5;
let failed = false;

if (!endpoint || !region) {
  throw new Error("Validation requires explicit DYNAMODB_ENDPOINT and AWS_REGION; it will not target AWS.");
}

const { DynamoDBClient } = await import("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = await import("@aws-sdk/lib-dynamodb");
const client = DynamoDBDocumentClient.from(new DynamoDBClient({
  endpoint,
  region,
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
}));

const table = {
  users: process.env.DYNAMODB_USERS_TABLE,
  appointments: process.env.DYNAMODB_APPOINTMENTS_TABLE,
  medicines: process.env.DYNAMODB_MEDICINES_TABLE,
  orders: process.env.DYNAMODB_ORDERS_TABLE,
};

function iso(value) {
  return value ? new Date(value).toISOString() : value ?? null;
}

function value(value) {
  return value ?? null;
}

async function scanAll(TableName) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const page = await client.send(new ScanCommand({ TableName, ExclusiveStartKey }));
    items.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

async function getById(TableName, keyName, id) {
  const result = await client.send(new GetCommand({ TableName, Key: { [keyName]: String(id) } }));
  return result.Item || null;
}

function compare(source, target, fields, sensitiveFields = []) {
  const mismatches = fields.filter(([sourceKey, targetKey = sourceKey, transform = value]) =>
    transform(source[sourceKey]) !== transform(target[targetKey])
  ).map(([sourceKey]) => sourceKey);
  for (const [sourceKey, targetKey = sourceKey] of sensitiveFields) {
    if (value(source[sourceKey]) !== value(target[targetKey])) mismatches.push(sourceKey);
  }
  return mismatches;
}

async function validateSamples(name, sourceRows, targetTable, keyName, fields, mapSource, sensitiveFields = []) {
  let passed = 0;
  let sampleFailed = 0;
  for (const source of sourceRows.slice(0, sampleSize)) {
    const { id, record } = mapSource(source);
    const target = await getById(targetTable, keyName, id);
    const mismatches = target ? compare(record, target, fields, sensitiveFields) : ["migrated record missing"];
    if (mismatches.length === 0) passed += 1;
    else {
      sampleFailed += 1;
      console.log(`  Sample ${id}: FAIL (${mismatches.join(", ")})`);
    }
  }
  if (sampleFailed) failed = true;
  console.log(`Sample records: Passed: ${passed}; Failed: ${sampleFailed}`);
}

function reportCount(name, mongoCount, dynamoCount) {
  const matches = mongoCount === dynamoCount;
  if (!matches) failed = true;
  console.log(`\n${name}`);
  console.log(`MongoDB: ${mongoCount}`);
  console.log(`DynamoDB Local: ${dynamoCount}`);
  console.log(`Count match: ${matches ? "YES" : "NO"}`);
}

async function runIndexCheck(label, work) {
  try {
    const result = await work();
    if (Array.isArray(result) && result.length === 0) throw new Error("query returned no records");
    if (!Array.isArray(result) && !result) throw new Error("lookup returned no record");
    console.log(`${label}: PASS`);
  } catch (error) {
    failed = true;
    console.log(`${label}: FAIL (${error instanceof Error ? error.message : "Unknown error"})`);
  }
}

async function main() {
  await connectDB();
  const repositories = await createDynamoRepositories();
  const [users, appointments, legacyOrders, dynamoUsers, dynamoAppointments, dynamoMedicines, dynamoOrders] = await Promise.all([
    User.find().sort({ _id: 1 }).lean(),
    Appointment.find().sort({ _id: 1 }).lean(),
    Medicine.find().sort({ _id: 1 }).lean(),
    scanAll(table.users), scanAll(table.appointments), scanAll(table.medicines), scanAll(table.orders),
  ]);

  console.log("MIGRATION VALIDATION\n====================");
  reportCount("Users", users.length, dynamoUsers.length);
  await validateSamples("Users", users, table.users, "userId", [
    ["name"], ["ID", "institutionId"], ["role"], ["type"], ["parent", "parentId"], ["phone"],
  ], (user) => ({ id: String(user._id), record: user }), [["password", "passwordHash"], ["refreshToken"]]);

  reportCount("Appointments", appointments.length, dynamoAppointments.length);
  await validateSamples("Appointments", appointments, table.appointments, "appointmentId", [
    ["student"], ["doctor"], ["parent"], ["date", "date", iso], ["time"], ["reason"], ["diagnosis"], ["prescription"], ["status"],
  ], (appointment) => ({ id: String(appointment._id), record: appointment }));

  // CampusCare has no MongoDB medicine-catalog model. Medicine documents are orders.
  reportCount("Medicines", 0, dynamoMedicines.length);
  console.log("Sample records: Passed: 0; Failed: 0 (no legacy medicine catalog exists)");

  reportCount("Orders", legacyOrders.length, dynamoOrders.length);
  await validateSamples("Orders", legacyOrders, table.orders, "orderId", [
    ["student_id", "studentId"], ["doctor_id", "doctorId"], ["request_type", "requestType"], ["name"], ["description"], ["price"], ["quantity"], ["order", "status"], ["createdAt", "createdAt", iso],
  ], (order) => ({ id: String(order._id), record: order }));

  console.log("\nIndexes");
  const studentAppointment = appointments[0];
  const doctorAppointment = appointments.find((item) => item.doctor);
  const parentAppointment = appointments.find((item) => item.parent);
  const studentOrder = legacyOrders.find((item) => item.student_id);
  const doctorOrder = legacyOrders.find((item) => item.doctor_id && item.request_type === "stock");
  const loginUser = users[0];
  const child = users.find((item) => item.type === "student" && item.parent);

  if (studentAppointment) await runIndexCheck("Student appointment query", async () => (await repositories.appointments.byStudent(studentAppointment.student)).find((item) => item._id === String(studentAppointment._id)));
  else console.log("Student appointment query: SKIP (no source record)");
  if (doctorAppointment) await runIndexCheck("Doctor appointment query", async () => (await repositories.appointments.byDoctor(doctorAppointment.doctor)).find((item) => item._id === String(doctorAppointment._id)));
  else console.log("Doctor appointment query: SKIP (no assigned source record)");
  if (parentAppointment) await runIndexCheck("Parent appointment query", async () => (await repositories.appointments.byParent(parentAppointment.parent)).find((item) => item._id === String(parentAppointment._id)));
  else console.log("Parent appointment query: SKIP (no source record)");
  if (studentOrder) await runIndexCheck("Student order query", async () => (await repositories.orders.byStudent(studentOrder.student_id)).find((item) => item._id === String(studentOrder._id)));
  else console.log("Student order query: SKIP (no source record)");
  if (doctorOrder) await runIndexCheck("Doctor order query", async () => (await repositories.orders.byDoctor(doctorOrder.doctor_id)).find((item) => item._id === String(doctorOrder._id)));
  else console.log("Doctor order query: SKIP (no source record)");
  if (loginUser) await runIndexCheck("User lookup by institution ID", () => repositories.users.findByInstitutionId(loginUser.ID, loginUser.type));
  else console.log("User lookup by institution ID: SKIP (no source record)");
  if (child) await runIndexCheck("Parent/child lookup", async () => (await repositories.users.byParent(child.parent)).find((item) => item._id === String(child._id)));
  else console.log("Parent/child lookup: SKIP (no linked source record)");
}

main().catch((error) => {
  console.error(`Migration validation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
}).finally(() => {
  if (failed) process.exitCode = 1;
});
