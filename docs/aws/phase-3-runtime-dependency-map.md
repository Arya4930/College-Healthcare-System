# Phase 3 runtime dependency map

| Runtime file(s) | Current MongoDB dependency | DynamoDB repository replacement |
| --- | --- | --- |
| `server.js` | `lib/mongodb.js`, `mongoose.connect` | Provider bootstrap; initialize DynamoDB repositories only in `dynamodb` mode. |
| `routes/login.js`, `register.js`, `verify.js`, `fetchAllUsers.js` | `models/Users.js`: `findById`, `findOne`, `find`, `create`, `save` | `userRepository`: get by ID/institution ID, create, refresh-token update, admin list/search. |
| `routes/appointments/*.js` | `models/appointment.js`: `create`, `find`, `findById`, `findByIdAndUpdate` | `appointmentRepository`: create, student/doctor/parent query, pending queue, conditional update. |
| `routes/medicine/*.js` | `models/medicine.js`: `insertMany`, `find`, sort/select | `orderRepository`: batch create and student/doctor/parent order queries. |
| Appointment and medicine routes | `models/Users.js` for doctor/parent/ward enrichment | `userRepository`: batch user lookup and parent-child query. |

There are no aggregation or populate calls. Current code assumes MongoDB ObjectId
values in JWT `_id` payloads and route parameters; the migration maps each value
to the same string in DynamoDB `userId`, `appointmentId`, and `orderId`.

`scripts/migrate-mongodb-to-dynamodb.js` and Mongoose models remain migration
tooling. They must not be imported by the DynamoDB runtime path.
