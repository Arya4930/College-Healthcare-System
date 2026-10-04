# CampusCare AWS Secrets Manager (Phase 1)

## Purpose

AWS Secrets Manager supplies CampusCare's JWT application secrets in AWS mode.
It keeps secret values out of source code, AMIs, user data, and permanent AWS
access-key configuration. This phase does not provision AWS infrastructure or
change authentication behavior.

## Secret structure

Create one environment-specific CampusCare application secret whose
`SecretString` is a JSON object with exactly the JWT values needed by the
existing backend:

```json
{
  "ACCESS_TOKEN_SECRET": "<access-token-signing-secret>",
  "REFRESH_TOKEN_SECRET": "<refresh-token-signing-secret>"
}
```

The placeholders are illustrative only. Never commit or log real values.

## Local development

Set `USE_AWS_SECRETS=false` (or leave it unset) outside production. The backend loads `.env` via
`dotenv` and continues to read `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET` from environment variables. This retains the existing
JWT implementation and API behavior.

`MONGODB_URI` remains a temporary local/runtime environment variable because
the current Mongoose backend still needs it. It is intentionally not read from
the AWS application secret.

## AWS mode

Set all of the following deployment configuration values. `NODE_ENV=production`
enables AWS Secrets Manager automatically; `USE_AWS_SECRETS=true` can also be
used to test the same behavior outside production.

| Variable | Purpose |
| --- | --- |
| `USE_AWS_SECRETS=true` | Enables AWS Secrets Manager retrieval. |
| `AWS_REGION` | Region containing the CampusCare secret. |
| `AWS_SECRET_NAME` | Secret name or ARN; this is an identifier, not a secret. |
| `FRONTEND_URL` | Existing CORS origin configuration. |
| `PORT` | Optional Express listener port; defaults to `4000`. |

At startup, Express retrieves and validates the secret once, caches the
result, and supplies its two values to the existing JWT code through the
existing environment-variable interface. It never calls Secrets Manager per
request. Startup fails with a safe, useful error if required configuration is
missing, the secret cannot be retrieved, is not JSON, or lacks a required key.

## IAM credentials and role relationship

The AWS SDK for JavaScript v3 uses the standard AWS credential provider chain.
The application does not set or read AWS access keys. When CampusCare is later
run on EC2, the instance profile for `CampusCare-EC2-Role` will provide
temporary credentials. That role should allow `secretsmanager:GetSecretValue`
on the exact CampusCare application-secret ARN, plus `kms:Decrypt` only if a
customer-managed KMS key encrypts the secret. It needs no secret write, list,
delete, IAM, or permanent-key permissions.

## Security and migration boundary

- Do not log `SecretString`, JWTs, authorization headers, MongoDB URIs,
  passwords, or either JWT signing secret.
- Treat a JWT key rotation as an authentication event: the current JWT design
  does not support overlapping signing keys, so coordinate rotation before
  replacing a value.
- `MONGODB_URI` is deliberately excluded from the long-term AWS secrets
  architecture. DynamoDB is the operational database; MongoDB remains only for
  migration/rollback tooling.
