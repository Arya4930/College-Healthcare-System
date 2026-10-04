/* Creates only DynamoDB Local tables. Refuses to run without an explicit endpoint. */
import "dotenv/config.js";

const endpoint = process.env.DYNAMODB_ENDPOINT?.trim();
const region = process.env.AWS_REGION;
if (!endpoint || !region) throw new Error("DYNAMODB_ENDPOINT and AWS_REGION are required for DynamoDB Local setup");

const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  waitUntilTableExists,
} = await import("@aws-sdk/client-dynamodb");
const client = new DynamoDBClient({
  endpoint,
  region,
  // Explicit local-only values take precedence over any ambient AWS_* variables.
  // DynamoDB Local does not validate them and they cannot access AWS.
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});
const provisioned = { BillingMode: "PAY_PER_REQUEST" };
const tableDefinitions = [
  { name: process.env.DYNAMODB_USERS_TABLE, key: "userId", attributes: ["userId", "institutionId", "parentId"], indexes: [["InstitutionIdIndex", "institutionId"], ["ParentIdIndex", "parentId"]] },
  { name: process.env.DYNAMODB_APPOINTMENTS_TABLE, key: "appointmentId", attributes: ["appointmentId", "student", "doctor", "parent", "appointmentDateTime"], indexes: [["StudentDateIndex", "student", "appointmentDateTime"], ["DoctorDateIndex", "doctor", "appointmentDateTime"], ["ParentDateIndex", "parent", "appointmentDateTime"]] },
  { name: process.env.DYNAMODB_MEDICINES_TABLE, key: "medicineId", attributes: ["medicineId"], indexes: [] },
  { name: process.env.DYNAMODB_ORDERS_TABLE, key: "orderId", attributes: ["orderId", "studentId", "doctorId", "createdAt"], indexes: [["StudentCreatedAtIndex", "studentId", "createdAt"], ["DoctorCreatedAtIndex", "doctorId", "createdAt"]] },
];

function reportDiagnostic(context, error) {
  const metadata = error?.$metadata;
  console.error(`${context}`);
  console.error(`Endpoint: ${endpoint}`);
  console.error(`Error name: ${error?.name || "UnknownError"}`);
  console.error(`Error message: ${error?.message || "No error message"}`);
  if (error?.code) console.error(`Error code: ${error.code}`);
  if (metadata?.httpStatusCode) console.error(`HTTP status: ${metadata.httpStatusCode}`);
}

function isConnectionFailure(error) {
  const codes = [error?.code, error?.cause?.code];
  return codes.includes("ECONNREFUSED") || codes.includes("ENOTFOUND") || codes.includes("ETIMEDOUT");
}

async function waitForActiveTable(tableName) {
  try {
    await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: tableName });
  } catch (error) {
    reportDiagnostic(`DynamoDB Local table did not become active: ${tableName}`, error);
    throw new Error(`DynamoDB Local table did not become active: ${tableName}`);
  }
}

async function main() {
  try {
    await client.send(new ListTablesCommand({ Limit: 1 }));
  } catch (error) {
    if (isConnectionFailure(error)) {
      reportDiagnostic("DynamoDB Local could not be reached", error);
      throw new Error("DynamoDB Local is unavailable at DYNAMODB_ENDPOINT");
    }
    reportDiagnostic("DynamoDB Local responded with an SDK configuration error", error);
    throw error;
  }

  for (const definition of tableDefinitions) {
    if (!definition.name) throw new Error("All DYNAMODB_*_TABLE variables are required");
    let exists = false;
    try {
      await client.send(new DescribeTableCommand({ TableName: definition.name }));
      exists = true;
    } catch (error) {
      if (error?.name !== "ResourceNotFoundException") {
        reportDiagnostic(`Unable to inspect DynamoDB Local table: ${definition.name}`, error);
        throw error;
      }
    }

    if (exists) {
      await waitForActiveTable(definition.name);
      console.log(`DynamoDB Local table already exists: ${definition.name}`);
      continue;
    }

    const attributes = definition.attributes.map((AttributeName) => ({ AttributeName, AttributeType: "S" }));
    const globalIndexes = definition.indexes.map(([IndexName, hash, range]) => ({ IndexName, KeySchema: [{ AttributeName: hash, KeyType: "HASH" }, ...(range ? [{ AttributeName: range, KeyType: "RANGE" }] : [])], Projection: { ProjectionType: "ALL" } }));
    try {
      await client.send(new CreateTableCommand({ TableName: definition.name, AttributeDefinitions: attributes, KeySchema: [{ AttributeName: definition.key, KeyType: "HASH" }], GlobalSecondaryIndexes: globalIndexes.length ? globalIndexes : undefined, ...provisioned }));
      await waitForActiveTable(definition.name);
      console.log(`Created DynamoDB Local table: ${definition.name}`);
    } catch (error) {
      reportDiagnostic(`Unable to create DynamoDB Local table: ${definition.name}`, error);
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(`DynamoDB Local table setup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
