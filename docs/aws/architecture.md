# CampusCare AWS migration architecture

## Current

```text
React
  |
  v
Express
  |
  v
MongoDB
```

MongoDB/Mongoose remains in the current application only as legacy
infrastructure while the next migration phase is prepared.

## Near-term target

```text
React
  |
  v
Express
  |
  v
DynamoDB
```

DynamoDB will become the primary operational database in Phase 2. This Phase 1
change deliberately does not add DynamoDB code, tables, permissions, or data
migration logic.

## JWT application secrets in AWS mode

```text
Express
  |
  v
AWS Secrets Manager
  |
  v
JWT application secrets
```

At startup, Express reads the access- and refresh-token signing secrets once
when `USE_AWS_SECRETS=true`. Future EC2 execution will receive temporary AWS
credentials through the `CampusCare-EC2-Role` instance profile. The secret does
not contain `MONGODB_URI`, because the MongoDB dependency is not part of the
long-term architecture.
