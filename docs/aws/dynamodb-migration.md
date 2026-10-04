# MongoDB to DynamoDB migration sequence

```text
MongoDB -> explicit migration script -> DynamoDB -> validation -> DATABASE_PROVIDER=dynamodb -> MongoDB removal
```

Run `node scripts/migrate-mongodb-to-dynamodb.js` only with both legacy MongoDB connectivity and AWS DynamoDB credentials configured. It preserves source ObjectId values as strings and uses conditional `PutItem` writes, so reruns do not create duplicate IDs. A rerun will stop on existing items; validate counts, IDs, password login, appointment views, and order views before any provider switch.

Rollback is operational: keep `DATABASE_PROVIDER=mongodb`, correct the migration/data model, remove or repair only the affected DynamoDB test items through an approved process, then rerun. Do not automatically delete MongoDB records. MongoDB/Mongoose remain migration-only dependencies after the normal API is converted.
