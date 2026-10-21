/* Explicit production admin seed. Never logs passwords or hashes. */
import "dotenv/config.js";
import bcrypt from "bcrypt";
import { initializeRepositories } from "../backend/src/repositories/index.js";

const institutionId = "admin1";

async function main() {
  const provider = (process.env.DATABASE_PROVIDER || "dynamodb").toLowerCase();

  if (provider !== "dynamodb") {
    throw new Error("Refusing to seed: DATABASE_PROVIDER must be dynamodb.");
  }

  if (process.env.DYNAMODB_ENDPOINT?.trim()) {
    throw new Error("Refusing to seed: a local DynamoDB endpoint is configured.");
  }

  if (process.env.ALLOW_PRODUCTION_ADMIN_SEED !== "true") {
    throw new Error("Set ALLOW_PRODUCTION_ADMIN_SEED=true to confirm production seeding.");
  }

  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Provide ADMIN_SEED_PASSWORD with at least 12 characters.");
  }

  if (process.env.AWS_REGION !== "ap-southeast-2") {
    throw new Error("Unexpected AWS region; refusing to seed.");
  }

  const { repositories } = await initializeRepositories();

  const existing = await repositories.users.findByInstitutionId(institutionId);
  if (existing) {
    throw new Error("Institution ID admin1 already exists; no changes were made.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await repositories.users.create({
    name: "Administrator",
    institutionId,
    passwordHash,
    role: "admin",
    type: "admin",
  });

  console.log("Admin user created successfully.");
}

main().catch((error) => {
  console.error(
    `Admin seed failed: ${error instanceof Error ? error.message : "Unknown error"}`
  );
  process.exitCode = 1;
});