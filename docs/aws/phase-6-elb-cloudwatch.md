# Phase 6: Application Load Balancer and CloudWatch

This document describes manual AWS configuration only. It does not create an
ALB, target group, CloudWatch log group, metric, alarm, or any other AWS
resource.

## Request path

```text
Internet -> Application Load Balancer -> target group -> EC2:4000 -> Express -> DynamoDB
```

The target group uses HTTP on port `4000`, targeting the CampusCare EC2
instance. Configure its health check as `GET /api/status`; the backend returns
HTTP 200 with only `status` and `database`, and does not perform a database
scan.

## Security groups

- ALB: permit inbound TCP 80/443 from the internet.
- EC2: permit inbound TCP 4000 only from the ALB security group, not from the
  internet. Permit TCP 22 only from the administrator's IP.
- Configure a TLS certificate and HTTPS listener before exposing authenticated
  production traffic. Redirect HTTP to HTTPS at the ALB if required.

Set `TRUST_PROXY=true` in the EC2 deployment configuration only when traffic
arrives through the trusted ALB. This lets Express interpret proxy forwarding
headers correctly without changing local behavior. Keep `FRONTEND_URL` set to
the approved frontend origin; authenticated CORS is never wildcarded.

## Graceful shutdown and deployment

PM2 sends `SIGTERM` during a controlled stop/restart. CampusCare stops accepting
new connections, waits up to 30 seconds for active requests, destroys the
DynamoDB client (or closes MongoDB only in explicit rollback mode), and exits.
Use target-group deregistration delay long enough to accommodate normal
requests before terminating or replacing an instance.

## CloudWatch

PM2/application stdout and stderr should be collected by the CloudWatch Agent
into a log group following the organization retention policy. Production
lifecycle logs are JSON records with level, message, service, timestamp, and
safe metadata. They never intentionally include request bodies, authorization
headers, passwords, tokens, hashes, AWS credentials, or Secrets Manager values.

Recommended alarms to configure manually:

- ALB unhealthy host count above zero.
- ALB 5XX count/error rate above the agreed threshold.
- EC2 CPU, status-check failure, and disk utilization thresholds.
- Application process restart count and log-derived startup failures.

Investigate health check failures first with `/api/status`, target-group health,
PM2 logs, then role/table/secret configuration. Do not place secret values in
logs or support tickets.
