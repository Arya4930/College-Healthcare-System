let repositories;

export async function initializeRepositories() {
  const provider = (process.env.DATABASE_PROVIDER || "dynamodb").toLowerCase();
  if (provider === "dynamodb") {
    const { createDynamoRepositories } = await import("./dynamodb.js");
    repositories = await createDynamoRepositories();
  } else if (provider === "mongodb") {
    const { createMongoRepositories } = await import("./mongodb.js");
    repositories = await createMongoRepositories();
  } else {
    throw new Error("DATABASE_PROVIDER must be either dynamodb or mongodb");
  }
  return { provider, repositories };
}

export function getRepositories() {
  if (!repositories) throw new Error("Database repositories have not been initialized");
  return repositories;
}
