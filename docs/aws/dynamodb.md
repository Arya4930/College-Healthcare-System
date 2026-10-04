# CampusCare DynamoDB design (Phase 2)

## Access-pattern-driven tables

| Table | Primary key | GSIs and actual access patterns |
| --- | --- | --- |
| `CampusCareUsers` | `userId` | `InstitutionIdIndex` (`institutionId`, `userId`) for login; `ParentIdIndex` (`parentId`, `type#institutionId`) for a parent's students. Admin currently lists all users, so no speculative role index is added. |
| `CampusCareAppointments` | `appointmentId` | `StudentDateIndex`, `DoctorDateIndex`, and `ParentDateIndex`, each with identity as partition key and `appointmentDateTime` as sort key. `StatusDateIndex` is required only to fetch the doctor's current pending queue. |
| `CampusCareMedicines` | `medicineId` | Reserved for the future medicine catalog. The current frontend catalog is static and performs no backend catalog lookup, so no GSI is justified yet. |
| `CampusCareOrders` | `orderId` | `StudentCreatedAtIndex` and `DoctorCreatedAtIndex` for student medicine orders and doctor stock orders. Parent orders are obtained by querying each ward returned from `ParentIdIndex`; no direct parent attribute exists today. |

Users store `name`, `institutionId`, `passwordHash`, `role`, `type`, `parentId`, `phone`, `refreshToken`, timestamps. Appointments store the existing student, doctor, parent, date/time, reason, diagnosis, prescription, and status fields. Orders store the existing medicine-model order fields with normalized names (`studentId`, `doctorId`, `requestType`, `status`).

Repository code lives in `backend/src/repositories/dynamodb.js`; it uses `DynamoDBDocumentClient`, table names from the environment, and the standard AWS credential chain. Runtime IAM requires only table/index `GetItem`, `PutItem`, `UpdateItem`, and `Query` actions for the exact four tables. Avoid `Scan`; the current administrator list operation is the one exception requiring a paginated admin listing design before DynamoDB mode is enabled.

MongoDB ObjectIds become their string representation in `userId`, `appointmentId`, and `orderId`. Password hashes are copied without rehashing. `__v` is not migrated.

## DynamoDB Local development

Development and migration testing use DynamoDB Local, not AWS DynamoDB. Set
`DYNAMODB_ENDPOINT=http://localhost:8000` and `AWS_REGION=local`. The region is
still required by the AWS SDK, but no AWS resource or AWS credential is used.
When an endpoint is configured, the repository uses that exact endpoint and
performs an early connectivity check; it never falls back to AWS.

Start DynamoDB Local with Docker:

```powershell
docker run --rm -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb
```

In a separate terminal, create the four local tables and their documented
GSIs, then run the explicit migration with `.env` configured for the legacy
MongoDB database and the local endpoint:

```powershell
node scripts/create-dynamodb-local-tables.js
node scripts/migrate-mongodb-to-dynamodb.js
```

For a later AWS deployment, leave `DYNAMODB_ENDPOINT` unset and set
`AWS_REGION` to the deployment region. Only then does the SDK use its standard
credential provider chain, eventually supplied by `CampusCare-EC2-Role`. Never
commit real AWS credentials, JWT secrets, or MongoDB connection strings.

## AWS DynamoDB configuration

AWS mode is explicit: set `DATABASE_PROVIDER=dynamodb`, an AWS region such as
`AWS_REGION=ap-southeast-2`, and leave `DYNAMODB_ENDPOINT` empty or unset. The
repository creates its SDK client with only the region in this mode, so the SDK
uses the standard credential provider chain (the EC2 instance profile in the
target architecture). No access-key variables are read or required by
CampusCare.

The deployed schema must match repository attributes exactly:

| Table | Primary key | Required GSIs |
| --- | --- | --- |
| `CampusCareUsers` | `userId` | `InstitutionIdIndex(institutionId)`, `ParentIdIndex(parentId)` |
| `CampusCareAppointments` | `appointmentId` | `StudentDateIndex(student, appointmentDateTime)`, `DoctorDateIndex(doctor, appointmentDateTime)`, `ParentDateIndex(parent, appointmentDateTime)` |
| `CampusCareMedicines` | `medicineId` | None for the current static catalog |
| `CampusCareOrders` | `orderId` | `StudentCreatedAtIndex(studentId, createdAt)`, `DoctorCreatedAtIndex(doctorId, createdAt)` |

The current doctor pending queue and administrator listing use compatibility
`Scan` paths because the established schema lacks a status index and a
list-oriented key. Scope `dynamodb:Scan` to those exact table ARNs until the
data model is revised; do not grant broad DynamoDB permissions.
