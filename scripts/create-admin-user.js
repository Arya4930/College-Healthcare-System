/* One-time local development seed. Never logs credentials, hashes, or secrets. */
import "dotenv/config.js";
import bcrypt from "bcrypt";
import { initializeRepositories } from "../backend/src/repositories/index.js";

const institutionId = "admin1";

async function main() {
  const provider = (process.env.DATABASE_PROVIDER || "dynamodb").toLowerCase();
  if (provider === "dynamodb" && !process.env.DYNAMODB_ENDPOINT?.trim()) {
    throw new Error("Local admin seeding requires DYNAMODB_ENDPOINT; refusing to contact AWS.");
  }

  const { repositories } = await initializeRepositories();
  const existing = await repositories.users.findByInstitutionId(institutionId);

  if (existing) {
    console.log("Admin user already exists; no changes were made.");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@12345", 10);
  await repositories.users.create({
    name: "Administrator",
    institutionId,
    passwordHash,
    role: "admin",
    type: "admin",
  });
  console.log("Local admin user created.");
}

main().catch((error) => {
  console.error(`Admin seed failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
});
