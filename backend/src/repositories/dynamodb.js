import { randomUUID } from "node:crypto";

const tables = () => ({
  users: process.env.DYNAMODB_USERS_TABLE,
  appointments: process.env.DYNAMODB_APPOINTMENTS_TABLE,
  medicines: process.env.DYNAMODB_MEDICINES_TABLE,
  orders: process.env.DYNAMODB_ORDERS_TABLE,
});

async function documentClient() {
  const region = process.env.AWS_REGION;
  const endpoint = process.env.DYNAMODB_ENDPOINT?.trim();
  if (!region) throw new Error("DynamoDB requires AWS_REGION");
  const [{ DynamoDBClient, ListTablesCommand }, commands] = await Promise.all([
    import("@aws-sdk/client-dynamodb"),
    import("@aws-sdk/lib-dynamodb"),
  ]);
  // Explicit local-only values take precedence over any ambient AWS_* variables.
  // DynamoDB Local requires signing but these values cannot access AWS.
  const clientOptions = endpoint
    ? {
      region,
      endpoint,
      credentials: { accessKeyId: "local", secretAccessKey: "local" },
    }
    : { region };
  const rawClient = new DynamoDBClient(clientOptions);
  return {
    client: commands.DynamoDBDocumentClient.from(rawClient),
    rawClient,
    ListTablesCommand,
    endpoint,
    ...commands,
  };
}

const publicUser = ({ passwordHash, refreshToken, ...user }) => ({ ...user, _id: user.userId, ID: user.institutionId, password: passwordHash, parent: user.parentId });
const appointmentView = (item) => ({ ...item, _id: item.appointmentId });
const orderView = (item) => ({ ...item, _id: item.orderId, student_id: item.studentId, doctor_id: item.doctorId, request_type: item.requestType, order: item.status });

export async function createDynamoRepositories() {
  const db = await documentClient();
  const required = Object.values(tables()).filter(Boolean);
  if (required.length !== 4) throw new Error("All DYNAMODB_*_TABLE variables are required");
  if (db.endpoint) {
    try {
      await db.rawClient.send(new db.ListTablesCommand({ Limit: 1 }));
    } catch (error) {
      const codes = [error?.code, error?.cause?.code];
      if (!codes.includes("ECONNREFUSED") && !codes.includes("ENOTFOUND") && !codes.includes("ETIMEDOUT")) {
        throw error;
      }
      throw new Error(
        "DynamoDB Local is configured but unavailable. Start DynamoDB Local at the configured DYNAMODB_ENDPOINT before running the migration."
      );
    }
  }
  const query = (params) => db.client.send(new db.QueryCommand(params));
  const scan = (params) => db.client.send(new db.ScanCommand(params));
  const put = (params) => db.client.send(new db.PutCommand(params));
  const get = (params) => db.client.send(new db.GetCommand(params));
  const update = (params) => db.client.send(new db.UpdateCommand(params));

  return {
    users: {
      async findById(userId) { const r = await get({ TableName: tables().users, Key: { userId } }); return r.Item && publicUser(r.Item); },
      async findByInstitutionId(institutionId, type) {
        const r = await query({ TableName: tables().users, IndexName: "InstitutionIdIndex", KeyConditionExpression: "institutionId = :id", ExpressionAttributeValues: { ":id": String(institutionId).toLowerCase() } });
        return r.Items?.map(publicUser).find((user) => !type || user.type === type) || null;
      },
      async create(input) { const userId = input.userId || randomUUID(); await put({ TableName: tables().users, Item: { ...input, userId, institutionId: input.institutionId.toLowerCase() }, ConditionExpression: "attribute_not_exists(userId)" }); return this.findById(userId); },
      async updateRefreshToken(userId, refreshToken) { await update({ TableName: tables().users, Key: { userId }, UpdateExpression: "SET refreshToken = :token", ExpressionAttributeValues: { ":token": refreshToken } }); },
      async byParent(parentId) { const r = await query({ TableName: tables().users, IndexName: "ParentIdIndex", KeyConditionExpression: "parentId = :parent", ExpressionAttributeValues: { ":parent": parentId } }); return (r.Items || []).filter((x) => x.type === "student").map(publicUser); },
      async byIds(ids) { return Promise.all(ids.map((id) => this.findByInstitutionId(id))); },
      // Admin list has no application-supported partition key in the current schema.
      async list() { const r = await scan({ TableName: tables().users }); return (r.Items || []).map(publicUser); },
    },
    appointments: {
      async create(input) { const appointmentId = input.appointmentId || randomUUID(); const item = { ...input, appointmentId, date: new Date(input.date).toISOString(), appointmentDateTime: `${new Date(input.date).toISOString()}#${appointmentId}` }; await put({ TableName: tables().appointments, Item: item, ConditionExpression: "attribute_not_exists(appointmentId)" }); return appointmentView(item); },
      async findById(appointmentId) { const r = await get({ TableName: tables().appointments, Key: { appointmentId } }); return r.Item && appointmentView(r.Item); },
      async byStudent(student) { const r = await query({ TableName: tables().appointments, IndexName: "StudentDateIndex", KeyConditionExpression: "student = :id", ExpressionAttributeValues: { ":id": student } }); return (r.Items || []).map(appointmentView); },
      async byDoctor(doctor) { const r = await query({ TableName: tables().appointments, IndexName: "DoctorDateIndex", KeyConditionExpression: "doctor = :id", ExpressionAttributeValues: { ":id": doctor } }); return (r.Items || []).map(appointmentView); },
      async byParent(parent) { const r = await query({ TableName: tables().appointments, IndexName: "ParentDateIndex", KeyConditionExpression: "parent = :id", ExpressionAttributeValues: { ":id": parent } }); return (r.Items || []).map(appointmentView); },
      // Compatibility fallback: existing Local tables lack the documented StatusDateIndex.
      async pending() { const r = await scan({ TableName: tables().appointments, FilterExpression: "#status = :pending", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":pending": "pending" } }); return (r.Items || []).map(appointmentView); },
      async update(appointmentId, values) { const names = {}, valuesMap = {}; const parts = Object.entries(values).map(([key, value], i) => { names[`#f${i}`] = key; valuesMap[`:v${i}`] = value; return `#f${i} = :v${i}`; }); const r = await update({ TableName: tables().appointments, Key: { appointmentId }, UpdateExpression: `SET ${parts.join(", ")}`, ExpressionAttributeNames: names, ExpressionAttributeValues: valuesMap, ReturnValues: "ALL_NEW" }); return appointmentView(r.Attributes); },
    },
    orders: {
      async createMany(items) { return Promise.all(items.map(async (input) => { const orderId = input.orderId || randomUUID(); const item = { ...input, orderId, createdAt: input.createdAt || new Date().toISOString() }; await put({ TableName: tables().orders, Item: item, ConditionExpression: "attribute_not_exists(orderId)" }); return orderView(item); })); },
      async byStudent(studentId) { const r = await query({ TableName: tables().orders, IndexName: "StudentCreatedAtIndex", KeyConditionExpression: "studentId = :id", ExpressionAttributeValues: { ":id": studentId }, ScanIndexForward: false }); return (r.Items || []).map(orderView); },
      async byDoctor(doctorId) { const r = await query({ TableName: tables().orders, IndexName: "DoctorCreatedAtIndex", KeyConditionExpression: "doctorId = :id", ExpressionAttributeValues: { ":id": doctorId }, ScanIndexForward: false }); return (r.Items || []).filter((x) => x.requestType === "stock").map(orderView); },
      async byStudents(studentIds) { return (await Promise.all(studentIds.map((id) => this.byStudent(id)))).flat().filter((item) => item.request_type === "medicine"); },
    },
  };
}
