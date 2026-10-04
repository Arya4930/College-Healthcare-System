# CampusCare Express backend on EC2

This is a manual deployment runbook. It does not create an EC2 instance,
security group, IAM role, DynamoDB table, or secret.

## Instance and security prerequisites

Use Ubuntu LTS with Node.js 20+ and Git. Attach the existing
`CampusCare-EC2-Role` as the instance profile. Do not configure static AWS
access keys on the instance.

Restrict the security group as follows:

| Traffic | Source |
| --- | --- |
| SSH TCP 22 | Your current public IP only |
| HTTP TCP 80 | `0.0.0.0/0` |
| HTTPS TCP 443 | `0.0.0.0/0` |

Express listens internally on TCP 4000. Do not expose TCP 4000 publicly; put a
reverse proxy such as Nginx in front of it before exposing HTTP/HTTPS.

## Instance setup

```bash
sudo apt update
sudo apt install -y git nginx
# Install Node.js 20+ using your approved NodeSource, nvm, or distribution process.
git clone <your-repository-url> campuscare
cd campuscare
corepack enable
pnpm install --frozen-lockfile
sudo npm install --global pm2
```

Set deployment configuration through your approved environment-file or service
manager mechanism; do not commit it to the repository:

```env
NODE_ENV=production
DATABASE_PROVIDER=dynamodb
AWS_REGION=ap-southeast-2
DYNAMODB_ENDPOINT=
DYNAMODB_USERS_TABLE=CampusCareUsers
DYNAMODB_APPOINTMENTS_TABLE=CampusCareAppointments
DYNAMODB_MEDICINES_TABLE=CampusCareMedicines
DYNAMODB_ORDERS_TABLE=CampusCareOrders
AWS_SECRET_NAME=campuscare/backend
FRONTEND_URL=https://<approved-frontend-origin>
PORT=4000
```

In production, `NODE_ENV=production` makes the backend load JWT secrets from
Secrets Manager before it initializes DynamoDB. The secret is a JSON object
with `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`; it is not an EC2
environment variable.

## Process management and health check

```bash
pm2 start npm --name campuscare-api -- run api-start
pm2 save
pm2 startup
pm2 logs campuscare-api
pm2 restart campuscare-api
curl http://127.0.0.1:4000/api/status
```

The health check returns a non-sensitive response such as:

```json
{"status":"ok","database":"dynamodb"}
```

Configure Nginx to proxy `/api/` to `http://127.0.0.1:4000`, then check the
published HTTPS `/api/status` endpoint. Configure certificates before exposing
authenticated traffic.

## IAM permissions and troubleshooting

`CampusCare-EC2-Role` needs `secretsmanager:GetSecretValue` on the exact
CampusCare secret and `kms:Decrypt` only when a customer-managed KMS key is
used. It needs DynamoDB `GetItem`, `PutItem`, `UpdateItem`, and `Query` on the
four exact table ARNs and their index ARNs. The current compatibility paths
also use `Scan` for administrator listing and pending appointments; either
grant it narrowly or complete the indexed query redesign before production.

If startup fails, inspect `pm2 logs campuscare-api` for the safe error message.
Check `AWS_REGION`, table names, `AWS_SECRET_NAME`, the role attachment, and
network access. Do not paste secrets, JWTs, cookies, credentials, or MongoDB
URIs into logs or tickets.
