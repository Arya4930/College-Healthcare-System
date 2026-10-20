/* Adds only the required production DynamoDB GSIs after an explicit --apply. */
import {
  DescribeTableCommand,
  DynamoDBClient,
  UpdateTableCommand,
} from "@aws-sdk/client-dynamodb";

const REGION = "ap-southeast-2";
const ACCOUNT_ID = "240704556993";
const APPLY = process.argv.slice(2).includes("--apply");
const unknownArguments = process.argv.slice(2).filter((argument) => argument !== "--apply");
const ACTIVE_WAIT_MS = 5_000;
const ACTIVE_TIMEOUT_MS = 15 * 60_000;

const tables = [
  {
    name: "CampusCareUsers",
    key: "userId",
    indexes: [
      { name: "InstitutionIdIndex", keys: [["institutionId", "HASH"]] },
      { name: "ParentIdIndex", keys: [["parentId", "HASH"]] },
    ],
  },
  {
    name: "CampusCareAppointments",
    key: "appointmentId",
    indexes: [
      { name: "StudentDateIndex", keys: [["student", "HASH"], ["appointmentDateTime", "RANGE"]] },
      { name: "DoctorDateIndex", keys: [["doctor", "HASH"], ["appointmentDateTime", "RANGE"]] },
      { name: "ParentDateIndex", keys: [["parent", "HASH"], ["appointmentDateTime", "RANGE"]] },
    ],
  },
  { name: "CampusCareMedicines", key: "medicineId", indexes: [] },
  {
    name: "CampusCareOrders",
    key: "orderId",
    indexes: [
      { name: "StudentCreatedAtIndex", keys: [["studentId", "HASH"], ["createdAt", "RANGE"]] },
      { name: "DoctorCreatedAtIndex", keys: [["doctorId", "HASH"], ["createdAt", "RANGE"]] },
    ],
  },
];

function fail(message) {
  throw new Error(message);
}

function schemaMatches(actual = [], expected) {
  return actual.length === expected.length && expected.every(([AttributeName, KeyType], index) =>
    actual[index]?.AttributeName === AttributeName && actual[index]?.KeyType === KeyType
  );
}

function accountFromArn(arn) {
  return typeof arn === "string" ? arn.split(":")[4] : undefined;
}

function attributeTypes(table) {
  return new Map((table.AttributeDefinitions || []).map(({ AttributeName, AttributeType }) => [AttributeName, AttributeType]));
}

function verifyTable(definition, table) {
  if (!table || table.TableStatus !== "ACTIVE") fail(`${definition.name} must be ACTIVE before index changes.`);
  if (accountFromArn(table.TableArn) !== ACCOUNT_ID) fail(`${definition.name} is not in the approved AWS account.`);
  if (table.BillingModeSummary?.BillingMode !== "PAY_PER_REQUEST") fail(`${definition.name} must use PAY_PER_REQUEST billing.`);
  if (!schemaMatches(table.KeySchema, [[definition.key, "HASH"]])) fail(`${definition.name} has an incompatible primary key.`);

  const types = attributeTypes(table);
  if (types.get(definition.key) !== "S") fail(`${definition.name} primary key must be a String attribute.`);

  const existing = new Map((table.GlobalSecondaryIndexes || []).map((index) => [index.IndexName, index]));
  const missing = [];

  for (const indexDefinition of definition.indexes) {
    const index = existing.get(indexDefinition.name);
    if (!index) {
      for (const [attribute] of indexDefinition.keys) {
        if (types.has(attribute) && types.get(attribute) !== "S") {
          fail(`${definition.name}.${indexDefinition.name} has an incompatible attribute type.`);
        }
      }
      missing.push(indexDefinition);
      continue;
    }

    if (!schemaMatches(index.KeySchema, indexDefinition.keys) || index.Projection?.ProjectionType !== "ALL") {
      fail(`${definition.name}.${indexDefinition.name} exists with an incompatible schema or projection.`);
    }
    if (index.IndexStatus !== "ACTIVE") fail(`${definition.name}.${indexDefinition.name} is not ACTIVE.`);
  }

  return { existing: [...existing.keys()], attributes: [...types.entries()], missing };
}

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function describe(client, tableName) {
  const response = await client.send(new DescribeTableCommand({ TableName: tableName }));
  return response.Table;
}

async function waitForIndex(client, tableName, indexName) {
  const deadline = Date.now() + ACTIVE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const table = await describe(client, tableName);
    const index = table.GlobalSecondaryIndexes?.find((candidate) => candidate.IndexName === indexName);
    if (table.TableStatus === "ACTIVE" && index?.IndexStatus === "ACTIVE") return;
    await pause(ACTIVE_WAIT_MS);
  }
  fail(`${tableName}.${indexName} did not become ACTIVE before the timeout.`);
}

function reportAwsError(context, error) {
  const status = error?.$metadata?.httpStatusCode;
  console.error(`${context}: ${error?.name || "UnknownAwsError"}${status ? ` (HTTP ${status})` : ""}`);
}

async function main() {
  if (unknownArguments.length) fail("Only the optional --apply flag is supported.");
  if (process.env.DYNAMODB_ENDPOINT?.trim()) fail("This script refuses DYNAMODB_ENDPOINT and will not target DynamoDB Local.");

  const client = new DynamoDBClient({ region: REGION });
  const plans = [];

  for (const definition of tables) {
    try {
      const table = await describe(client, definition.name);
      const result = verifyTable(definition, table);
      plans.push({ definition, ...result });
      console.log(`${definition.name}: primary key, PAY_PER_REQUEST, and existing indexes verified.`);
      console.log(`  Attributes: ${result.attributes.map(([name, type]) => `${name}:${type}`).join(", ")}`);
      console.log(`  Existing indexes: ${result.existing.join(", ") || "none"}`);
      console.log(result.missing.length ? `  Add: ${result.missing.map((index) => index.name).join(", ")}` : "  Add: none");
    } catch (error) {
      reportAwsError(`Preflight failed for ${definition.name}`, error);
      throw error;
    }
  }

  if (!APPLY) {
    console.log("Preflight complete. No AWS changes were made. Re-run with --apply to add only the listed missing indexes.");
    return;
  }

  for (const { definition, missing } of plans) {
    for (const index of missing) {
      console.log(`Creating ${definition.name}.${index.name}...`);
      try {
        await client.send(new UpdateTableCommand({
          TableName: definition.name,
          AttributeDefinitions: index.keys.map(([AttributeName]) => ({ AttributeName, AttributeType: "S" })),
          GlobalSecondaryIndexUpdates: [{ Create: {
            IndexName: index.name,
            KeySchema: index.keys.map(([AttributeName, KeyType]) => ({ AttributeName, KeyType })),
            Projection: { ProjectionType: "ALL" },
          } }],
        }));
        await waitForIndex(client, definition.name, index.name);
        console.log(`${definition.name}.${index.name} is ACTIVE.`);
      } catch (error) {
        reportAwsError(`Index creation failed for ${definition.name}.${index.name}`, error);
        throw error;
      }
    }
  }

  console.log("All required indexes are ACTIVE.");
}

main().catch(() => {
  process.exitCode = 1;
});
