# CampusCare AWS IAM plan

## Scope and current repository findings

This is a deployment plan, not an AWS deployment or an application change. As of
this review, CampusCare has no AWS SDK dependency, AWS resource configuration,
or AWS API call. The backend is an Express application using Mongoose and a
MongoDB URI; the frontend is a Vite static application.

The existing backend process requires these environment values:

| Value | Purpose | Future secret location / consumer |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection URI, which normally includes database credentials | Legacy environment-only configuration until the DynamoDB migration removes it. It is intentionally excluded from the AWS application secret. |
| `ACCESS_TOKEN_SECRET` | Signs and verifies access JWTs | CampusCare application Secrets Manager JSON secret; backend runtime only when `USE_AWS_SECRETS=true`. |
| `REFRESH_TOKEN_SECRET` | Signs refresh JWTs | CampusCare application Secrets Manager JSON secret; backend runtime only when `USE_AWS_SECRETS=true`. |
| `FRONTEND_URL` | CORS allow-list origin | Non-secret application configuration (for example, parameter/configuration), readable by the backend runtime. |
| `CORS_ORIGIN` | Present in `.env`, but not read by the current server | Non-secret; do not grant access until the application actually consumes it. |

The checked-in `.env` is ignored by Git. Do not place its values, AWS access
keys, private keys, database passwords, or QuickSight credentials in source
control, frontend build variables, AMIs, Lambda environment variables, or
instance user data. AWS workloads should obtain temporary credentials from IAM
roles, not `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` variables.

The production frontend currently selects a Render API URL in `src/config.js`.
Changing that endpoint, hosting static content in S3, or migrating MongoDB to a
managed AWS database is intentionally out of scope for this document.

## Least-privilege rules

- Create separate roles per workload, environment (`dev`, `stage`, `prod`), and
  responsibility. A role may access only resources with its environment and
  application tags, such as `Application=CampusCare` and `Environment=prod`.
- Scope resource actions to exact ARNs: one S3 bucket and approved prefixes,
  named DynamoDB tables/indexes, and exact secret ARNs. Avoid `Resource: "*"`
  for data-plane permissions.
- Give runtime roles read/use access, not create, delete, policy, IAM, KMS-key
  administration, or account-management permissions. Keep deploy/provisioning
  rights in a separate human/CI role.
- Do not grant wildcard actions such as `s3:*`, `dynamodb:*`,
  `secretsmanager:*`, or AWS managed `AdministratorAccess` to application
  workloads. Add actions only after a feature makes a documented request.
- Require TLS for S3 and DynamoDB access; use S3 Block Public Access and
  bucket policies to deny non-TLS requests. Encrypt S3, DynamoDB, and secrets
  with AWS-managed keys initially or a dedicated CMK when compliance requires
  it. A CMK requires narrowly scoped `kms:Decrypt` (and `kms:Encrypt` for
  writers) on that key.
- Use CloudTrail, IAM Access Analyzer, and CloudWatch alarms to review actual
  access. Periodically remove unused actions; permission changes should be
  peer reviewed and tested outside production.

## Proposed roles

Names below are examples. No policy should be attached until the named resource
and feature exist.

| Role | Trusted principal | Intended use | Permissions to grant eventually |
| --- | --- | --- | --- |
| `CampusCare-EC2-Role` | `ec2.amazonaws.com` through an instance profile | Express backend running on EC2 | `secretsmanager:GetSecretValue` and `DescribeSecret` on the exact CampusCare JWT application-secret ARN; `kms:Decrypt` only if it uses a customer-managed key; and narrowly scoped DynamoDB `GetItem`, `PutItem`, `UpdateItem`, `Query` on the four CampusCare tables/indexes. `Scan` is temporarily needed only for administrator listing and pending appointments. |
| `CampusCareLambdaAppRole-<env>` | `lambda.amazonaws.com` | A future, separately packaged CampusCare Lambda | CloudWatch log write actions for its own log group; exact-secret read and optional CMK decrypt. Add only the S3 object-prefix and/or DynamoDB-table actions required by that Lambda. Never reuse the EC2 role. |
| `CampusCareStaticSiteDeployRole-<env>` | Approved CI OIDC provider or a tightly controlled release role | Upload versioned frontend assets to a private deployment prefix, then publish them | `s3:PutObject`, `s3:AbortMultipartUpload`, and limited `s3:ListBucket` for the specific static-site bucket/prefix. If CloudFront is adopted, allow invalidation only for its distribution. No secret, DynamoDB, or runtime application access. |
| `CampusCareAssetRuntimeRole-<env>` | EC2 or Lambda only if server-side asset access is introduced | Read/write private application uploads or generated files | On one assets bucket and fixed prefixes: `s3:GetObject` for reads; add `PutObject` only to the upload/output prefix; `ListBucket` restricted with `s3:prefix`; `DeleteObject` only if a retention-approved deletion feature needs it. Add `kms:Decrypt`/`Encrypt` for the bucket CMK only as needed. Static public content should not use this role. |
| `CampusCareDynamoDataRole-<env>` | One specific EC2 app role or Lambda role, preferably embedded as an inline policy on that workload role | A future DynamoDB-backed feature | For exact table and index ARNs: `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `Query`, and `ConditionCheckItem` only if each is used. Add `BatchGetItem`, `BatchWriteItem`, `DeleteItem`, `Scan`, or stream permissions only upon demonstrated need. Do not create/alter tables from a runtime role. |
| `CampusCareSecretsReadRole-<env>` | Prefer no standalone assumption: attach this narrow policy to each approved runtime role | Reusable policy boundary for runtime secret retrieval | `secretsmanager:GetSecretValue` and `DescribeSecret` on only the CampusCare JWT application-secret ARN; `kms:Decrypt` only for its CMK. The secret contains only the two JWT signing values; see `docs/aws/secrets-manager.md` for its structure. |
| `CampusCareCloudWatchLogsRole-<env>` | Prefer no standalone assumption: attach to each producing runtime role | Deliver application logs | `logs:CreateLogStream` and `logs:PutLogEvents` on only the workload's log-group ARN. `logs:CreateLogGroup` may be used temporarily during bootstrap, then removed. Do not grant log read/delete permissions to workloads. |
| `CampusCareQuickSightReaderRole-<env>` | `quicksight.amazonaws.com` | Future dashboards over a curated, non-production/approved reporting dataset | Read only the specific reporting source: `dynamodb:DescribeTable`, `GetItem`, `Query`, and `Scan` on a purpose-built, least-sensitive reporting table (or `s3:GetObject`/`ListBucket` on an approved reporting export prefix). If QuickSight uses a CMK, allow only `kms:Decrypt` on that key. Do not point QuickSight at operational user/password/token data by default. |

QuickSight user, group, dashboard, and dataset administration is an operator or
IaC responsibility and belongs in a separate `CampusCareAnalyticsAdminRole`.
It must not be trusted by EC2 or Lambda and must not contain application
secrets.

## Service-specific boundaries

### EC2

Attach only `CampusCareEc2AppRole-<env>` to the application instance profile.
It needs no IAM user access keys. Security groups and network routing, not IAM,
must permit outbound TLS to the MongoDB service. The role does not need RDS,
DocumentDB, DynamoDB, S3, or QuickSight access merely because those services
are under consideration.

### Lambda

Use `CampusCareLambdaAppRole-<env>` per function or function class. Lambda
needs a separate execution role, its own log group, and only the secrets/data
resources required by its handler. VPC attachment, when needed for private
resources, also requires narrowly scoped ENI permissions normally supplied by
the AWS Lambda VPC execution policy; grant it only to VPC-connected functions.

### S3

Static frontend hosting requires bucket and CDN configuration, but browser
reads should be granted through the bucket/CDN policy rather than an IAM role
held by the browser. Keep deploy write permission separate from application
asset access. Determine bucket name, region, public/CDN access model, prefixes,
retention, and encryption before writing a policy.

### DynamoDB

There is no DynamoDB model or code path today; MongoDB is the current database.
If DynamoDB is introduced, give the relevant workload role table-level actions
only. For multi-tenant records, enforce leading-key conditions where the data
model supports them. Do not assume DynamoDB replaces MongoDB without an
application/data migration plan.

### Secrets Manager and database credentials

Create one environment-specific JWT application secret containing the two
required signing values as a cohesive JSON object. Its resource policy must be
limited to approved runtime roles, and it should be rotated only after the
application supports safe rotation. `MONGODB_URI` remains legacy
environment-only configuration until the DynamoDB migration removes it.

### CloudWatch

Runtime roles may write structured application logs, metrics only if a metric
feature is added, and traces only if instrumentation is added. Start with logs
only. Never log request authorization headers, cookies, JWTs, MongoDB URIs,
passwords, secret values, or health records. The current code has several raw
error logging sites; sanitize errors as part of a future operational-hardening
change before broad log retention or external access is enabled.

### QuickSight

QuickSight should receive aggregated/de-identified reporting data through a
dedicated reporting table or export, not the operational MongoDB URI and not
Secrets Manager access. Define row-level security, dataset refresh ownership,
approved fields, retention, and who can share dashboards before enabling it.

## Before implementation

1. Choose the backend compute target (EC2 or a Lambda adaptation), AWS account,
   region, and environment naming/tagging convention.
2. Inventory exact resource ARNs, S3 prefixes, DynamoDB access patterns, KMS
   key choice, log retention, and the approved QuickSight reporting dataset.
3. Store the existing sensitive values in Secrets Manager through a controlled
   setup process, update the deployment configuration to reference them, and
   test secret rotation/failure handling in non-production.
4. Write infrastructure as code with separate deployment and runtime roles,
   validate policies with IAM Access Analyzer, and test denied access as well
   as permitted access.

None of these steps changes CampusCare's existing authentication logic or its
MongoDB implementation.
