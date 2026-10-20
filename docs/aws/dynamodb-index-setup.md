# CampusCare production DynamoDB index setup

`scripts/configure-production-dynamodb-indexes.js` reconciles only the required
production GSIs for the CampusCare tables in `ap-southeast-2`, account
`240704556993`. It uses the standard AWS credential chain and refuses a
`DYNAMODB_ENDPOINT` value, so it cannot target DynamoDB Local.

The script never deletes or recreates a table or index. It verifies that every
table is ACTIVE, belongs to the approved account, uses `PAY_PER_REQUEST`, and
has the expected String hash primary key. Existing required indexes must match
the expected key schema and `ALL` projection; otherwise it stops without
changing AWS. Existing unrelated indexes are preserved.

## Commands

Run the read-only preflight first:

```powershell
node scripts/configure-production-dynamodb-indexes.js
```

Only after reviewing the preflight plan, add missing indexes and wait for each
one to become ACTIVE:

```powershell
node scripts/configure-production-dynamodb-indexes.js --apply
```

The EC2 role or operator identity needs `dynamodb:DescribeTable` for all four
table ARNs and `dynamodb:UpdateTable` for the tables that need a GSI. It does
not need table create, delete, item read, or item write permissions for this
operation.

The defined GSIs mirror `backend/src/repositories/dynamodb.js`:

| Table | Required GSIs |
| --- | --- |
| `CampusCareUsers` | `InstitutionIdIndex(institutionId)`, `ParentIdIndex(parentId)` |
| `CampusCareAppointments` | `StudentDateIndex(student, appointmentDateTime)`, `DoctorDateIndex(doctor, appointmentDateTime)`, `ParentDateIndex(parent, appointmentDateTime)` |
| `CampusCareMedicines` | None |
| `CampusCareOrders` | `StudentCreatedAtIndex(studentId, createdAt)`, `DoctorCreatedAtIndex(doctorId, createdAt)` |

All indexes use `ProjectionType: ALL`, because the repository returns complete
user, appointment, and order records from query results.
