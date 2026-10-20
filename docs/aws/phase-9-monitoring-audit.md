# Phase 9.1: Monitoring and operational-readiness audit

This is a repository audit dated 2026-10-20. It creates no AWS resources and
does not establish that any proposed AWS resource already exists.

## Current state and evidence

### Runtime and request path

The documented production path is GitHub Pages -> `https://api-cad.arya22.dev`
-> Application Load Balancer (HTTPS/443) -> EC2 (Express/4000) -> DynamoDB.
`backend/src/server.js` applies credentialed CORS, JSON and URL-encoded parsers,
then mounts the status, authentication, users, appointments, and medicine
routes.

Startup performs these steps in order:

1. In production, require `FRONTEND_URL` for credentialed CORS.
2. Load application secrets.
3. Initialize the selected authentication provider (currently `jwt`).
4. Initialize the repository provider (DynamoDB in the deployed architecture).
5. Bind Express to `0.0.0.0:${PORT}`.

The process handles `SIGTERM` and `SIGINT`: it stops the HTTP server, waits up
to 30 seconds, and closes repositories. It does **not** register
`uncaughtException` or `unhandledRejection` handlers. Route handlers generally
catch errors themselves, but Express has no final error-handling middleware or
request/access-log middleware.

### Health endpoint

`GET /api/status` returns HTTP 200 with `status: "ok"` and the configured
database-provider name. It does not issue a DynamoDB request, check Secrets
Manager, or verify that a normal authenticated request can succeed.

This makes it suitable as a shallow ALB liveness health check: a failed startup
never begins listening, while a running process receives a 200 response. It is
not a readiness/dependency health check. In particular, AWS DynamoDB client
initialization does not make an AWS request, so a later DynamoDB permissions or
connectivity failure can coexist with a healthy `/api/status` response. Do not
treat this endpoint as proof that the application can serve all traffic.

### Logging

`backend/src/lib/logger.js` writes JSON lifecycle entries in production with
`level`, `message`, `service`, `timestamp`, and selected metadata. Startup,
shutdown, provider selection, and DynamoDB target selection use it. The
existing lifecycle messages do not intentionally include secrets or tokens.

Many route handlers still call `console.error` with an error message directly.
The legacy MongoDB helper also logs a raw error object. These paths are not
centrally redacted or correlated with request IDs. Do not add request bodies,
authorization headers, cookies, JWTs, passwords, hashes, DynamoDB item data,
medical data, or full AWS SDK errors to logs. Before retaining or exporting
logs broadly, replace raw route logging with the structured logger and an
allow-list of safe error fields.

### PM2

`package.json` supplies `api-start` (`node backend/src/server.js`).
`docs/aws/ec2.md` documents manual PM2 commands, including `pm2 logs`, `pm2
restart`, `pm2 save`, and `pm2 startup`. There is no `ecosystem.config.*`, PM2
dependency, PM2 log rotation configuration, systemd unit, or deployment script
in the repository. Consequently, the repository cannot verify the actual PM2
process name, environment, restart policy, stdout/stderr locations, restart
count, or crash history on EC2.

PM2 should capture application stdout/stderr and can restart a crashed process,
but neither collection nor restart behavior is configured here. The earlier
example uses `pm2 start npm`; future operations should invoke the existing pnpm
script instead (for example, `pm2 start pnpm --name campuscare-api -- run
api-start`) after it is validated on the instance.

### CloudWatch and IAM evidence

No CloudWatch Agent configuration, log-group definition, metric filter, alarm,
dashboard, agent installation command, or infrastructure-as-code file is in
the repository. `docs/aws/phase-6-elb-cloudwatch.md` is explicitly a manual
recommendation and says it did not create AWS resources. It recommends sending
PM2 stdout/stderr through the CloudWatch Agent, but this audit cannot verify
that this was done.

`docs/aws/iam.md` describes a proposed least-privilege CloudWatch policy for
the existing `CampusCare-EC2-Role`; it is not evidence that the policy is
attached. Verify the role and every CloudWatch resource in the AWS console or
with an approved read-only AWS identity before treating them as present.

## Metrics available without an agent

These AWS-published metrics need no application package or CloudWatch Agent:

| Source | Useful metrics | Initial use |
| --- | --- | --- |
| ALB (`AWS/ApplicationELB`) | `RequestCount`, `HealthyHostCount`, `UnHealthyHostCount`, `HTTPCode_ELB_4XX_Count`, `HTTPCode_ELB_5XX_Count`, `HTTPCode_Target_4XX_Count`, `HTTPCode_Target_5XX_Count`, `TargetResponseTime` | Availability, load, target errors, and latency. Use the ALB plus target-group dimensions appropriate to the alarm. |
| EC2 (`AWS/EC2`) | `CPUUtilization`, `StatusCheckFailed`, network and EBS I/O metrics | Basic host health and saturation. Basic monitoring may publish at five-minute resolution; enable detailed monitoring only if its benefit justifies the cost. |
| DynamoDB (`AWS/DynamoDB`) | Service/table metrics are available independently of the host | Confirm table-level throttling, errors, capacity, and latency in the relevant table views before adding any alarm. Exact table mode and traffic baseline require console verification. |

EC2 memory, swap, filesystem usage, and per-process/PM2 metrics are **not**
provided by the basic EC2 metric set. They require the CloudWatch Agent or a
different observability collector. The CloudWatch Agent can publish memory and
disk metrics and ship logs; it has no need for application AWS access keys when
it uses the EC2 instance role.

AWS references: [ALB metrics](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html),
[EC2 metrics](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/viewing_metrics_with_cloudwatch.html),
and [CloudWatch Agent metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/metrics-collected-by-CloudWatch-agent.html).

## Gaps and risks

1. No repository evidence proves that logs reach CloudWatch, that alarms exist,
   or that PM2 restarts after failure.
2. The ALB health check can remain healthy while DynamoDB is inaccessible after
   startup. This is intentional liveness behavior, but it leaves a dependency
   outage undetected by target health alone.
3. Raw route error logging can retain unsafe provider/error details and lacks
   request correlation. The frontend also has browser-console data logs; they
   are outside EC2 CloudWatch collection but still deserve review separately.
4. There is no central error handler, request latency/status telemetry,
   process-restart metric, synthetic check, or runbook in executable form.
5. The legacy `docs/aws/architecture.md` still describes MongoDB as current;
   it is stale relative to the deployed DynamoDB architecture and could mislead
   operations staff.
6. CloudWatch Logs, custom metrics, alarms, detailed monitoring, dashboards,
   and ALB access logs can incur charges. Logging medical or personally
   identifiable data also introduces a retention/access-control risk.

## Recommended minimal monitoring design

Start small: one application log group, AWS service metrics, four availability
alarms, and a written runbook. Do not add tracing, RUM, Container Insights,
custom per-request metrics, or ALB access logging during the first monitoring
iteration.

### Logs and retention

Pre-create `/campuscare/prod/api` in CloudWatch Logs with a 14-day retention
period for this student project. Configure the unified CloudWatch Agent to
collect the PM2 application's stdout and stderr files into separate streams
under that group. Use instance ID plus stream type as stream identity; do not
place an institution ID, user ID, or token in a stream name.

Keep production logs structured and limited to safe operational fields: level,
event name, timestamp, service, HTTP status class, route template, duration,
and an opaque correlation ID. Route templates must never contain patient,
student, appointment, order, or authentication identifiers. Review the raw
`console.error` sites before enabling log collection, then set a longer
retention period only if there is a documented operational need.

### Initial alarms

Use existing ALB and EC2 metrics first. Tune after collecting at least a week
of normal traffic; these are conservative starting points, not proof of an
incident policy.

| Alarm | Starting threshold | Why |
| --- | --- | --- |
| Target availability | `UnHealthyHostCount >= 1` for two one-minute periods | The single backend target is unavailable to the ALB. |
| ALB failures | `HTTPCode_ELB_5XX_Count >= 1` in five minutes | Detects load-balancer-side 5XX responses. |
| Target failures | `HTTPCode_Target_5XX_Count >= 5` in five minutes | Detects a sustained backend failure without alerting on one transient request. |
| EC2 health | `StatusCheckFailed >= 1` for two one-minute periods | Detects instance/system reachability problems. |
| EC2 CPU | average `CPUUtilization >= 80%` for 15 minutes | Detects sustained saturation. |

After the CloudWatch Agent is verified, add memory used and root filesystem
used alarms at 85% for ten minutes. Add a log-derived startup-failure alarm
only for exact safe lifecycle messages such as `CampusCare backend failed to
start`; do not create broad filters that copy arbitrary exception text into a
metric label.

`TargetResponseTime` is useful in a console graph initially. Add a latency
alarm only after a normal baseline exists; a starting candidate is p95 above two
seconds for three consecutive five-minute periods. A meaningful target 5XX rate
needs metric math and a minimum request count, so defer it until traffic is
known.

### Dashboard

Do not create a dashboard in the first implementation if the CloudWatch metric
pages and the alarms above meet the project's needs. If an instructor/demo
requires one, use one fixed low-cardinality dashboard with six widgets:
request count, healthy/unhealthy targets, ALB/target 5XX counts, p95 target
response time, EC2 CPU, and agent-provided memory/disk. Never put application
logs, request identifiers, or medical/user records in dashboard variables.

### IAM for the existing EC2 role

Continue using `CampusCare-EC2-Role`; do not use access keys. The role already
needs its existing DynamoDB and Secrets Manager permissions. For a pre-created
`/campuscare/prod/api` group, add only the agent permissions needed for that
group and its streams:

- `logs:CreateLogStream` and `logs:PutLogEvents` scoped to the named group and
  its streams.
- `logs:DescribeLogStreams` only if the selected agent configuration requires
  it; AWS documents this as commonly required for log delivery.
- `cloudwatch:PutMetricData` only if agent host metrics are enabled, constrained
  with the `cloudwatch:namespace` condition to `CampusCare/EC2` where practical.
- `ec2:DescribeTags` only if the chosen agent configuration uses EC2 tag
  dimensions.

Do not grant `logs:CreateLogGroup`, log read/delete, alarm creation,
dashboard creation, IAM administration, or `CloudWatchFullAccess` to the EC2
runtime. A provisioning/admin identity should create the log group, retention,
alarms, notification destination, and optional dashboard. The AWS managed
`CloudWatchAgentServerPolicy` is a convenient reference but is broader than a
tailored runtime policy. See the [AWS managed policy reference](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/CloudWatchAgentServerPolicy.html).

## Cost and security considerations

- AWS service metrics are generally available without installing an agent, but
  pricing and free-tier eligibility are account/region dependent. Confirm the
  current `ap-southeast-2` pricing before enabling paid features.
- CloudWatch Logs ingestion and retained storage are chargeable. Short
  retention, low-volume structured logs, and no request-body logging limit
  costs and exposure.
- Agent-published custom metrics, detailed EC2 monitoring, alarms beyond free
  allowances, dashboards, Logs Insights queries, and ALB access logs may add
  charges. Avoid high-cardinality dimensions such as user IDs and request IDs.
- Store alert destinations and operator permissions separately from the EC2
  role. Limit log readers because operational logs may still contain sensitive
  error context.

See [CloudWatch cost controls](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_billing.html)
and [log retention](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html).

## Troubleshooting and recovery runbook

1. Confirm the public `GET https://api-cad.arya22.dev/api/status` response and
   the target-group health reason. A 200 status only confirms liveness.
2. For an unhealthy target, inspect ALB target health, the EC2 instance status
   checks, security-group reachability, and the configured port 4000 listener.
3. On the instance, inspect `pm2 status`, `pm2 describe campuscare-api`, and
   `pm2 logs campuscare-api --lines 100`. After log shipping is implemented,
   inspect the equivalent narrow CloudWatch time window.
4. For startup failures, check safe configuration facts only: instance role
   attachment, `AWS_REGION`, secret name, DynamoDB table names, and CORS origin.
   Never copy secret values, headers, cookies, JWTs, or health data into a
   ticket.
5. Correct the root cause, then use the approved PM2 reload/restart procedure.
   Verify target health and one authenticated test flow afterward. Record the
   incident and tune a noisy or missing alarm only after review.

## Phase 9.2 implementation order

1. Use an approved read-only AWS identity to inventory the existing ALB,
   target group, EC2 instance role, CloudWatch log groups, agent status,
   alarms, and dashboards. Record verified names/ARNs outside source control.
2. Decide the approved log fields and replace/sanitize raw route error logging;
   add a final Express error handler and request correlation in a separate,
   tested application-hardening change.
3. Define and review a least-privilege CloudWatch Agent policy on
   `CampusCare-EC2-Role`; pre-create the log group and its 14-day retention
   with a provisioning identity.
4. Install/configure the unified CloudWatch Agent on EC2 to ship PM2
   stdout/stderr and, if justified, memory and disk metrics. Verify one safe
   test entry reaches the intended group.
5. Create the initial availability/EC2 alarms and an approved notification
   path. Test an alarm notification without altering production data.
6. Baseline one week of traffic, tune thresholds, then decide whether the small
   dashboard and latency/log-derived alarms are justified.
7. Update this audit with console-verified evidence and the actual runbook
   commands; do not claim completion merely because configuration files exist.

## Phase 9.2 completed: safe structured logging and Express error handling

The Phase 9.1 code-level hardening step is complete. It did not create AWS
resources, configure the CloudWatch Agent, alter IAM, or send logs to
CloudWatch.

### Code changes

- `backend/src/lib/logger.js` now emits structured events and accepts only an
  explicit allow-list of `requestId`, `statusCode`, `route`, and `durationMs`.
  Arbitrary fields, error objects, authorization values, request bodies, and
  identifiers are discarded.
- `backend/src/lib/http-observability.js` adds a server-generated UUID request
  ID, returns it in `X-Request-Id`, and logs a completion event after the
  response finishes. It records only the Express route template, final HTTP
  status, rounded duration, and request ID; it never logs a URL, query string,
  route parameter, headers, cookies, or body.
- The request middleware runs before CORS and parsers, so it does not prevent
  CORS/preflight, health, streaming, or ordinary routes from completing. A
  request that does not match an Express route is recorded as `unmatched`.
- A final Express error handler is registered after all routes. Express 5
  forwards unhandled synchronous and rejected async route errors to it. It
  emits one safe `http_request_failed` event and returns
  `{ "success": false, "message": "Server error" }` for 5XX errors, or
  `{ "success": false, "message": "Request failed" }` for an explicit safe
  4XX status. It does not expose error messages, stack traces, SDK data, or
  filesystem details. If headers were already sent, it delegates to Express's
  default closing behavior rather than double-sending a response.
- Every production backend route catch and the legacy MongoDB connector now
  uses a fixed structured event name. Existing route status codes, response
  bodies, JWT verification behavior, role checks, parent/ward checks, and
  ownership checks are unchanged.

PM2 can continue to capture stdout/stderr as before. In production these
backend records are JSON and are suitable for a later CloudWatch Agent
collection step; this phase does not claim that collection is configured.

### Tests completed

`pnpm test` runs eight passing Node tests. New coverage verifies:

- generated opaque request IDs and the `X-Request-Id` response header;
- route-template telemetry excludes route parameters and query strings;
- safe final-error JSON responses for 5XX and explicit 4XX errors;
- sensitive values from thrown errors and unapproved logger fields do not
  appear in captured log output;
- the existing JWT provider valid/invalid/expired token and provider-selection
  regression tests continue to pass.

`pnpm build` also completed successfully. The production build does not bundle
backend logging code, but this confirms the shared project build remains intact.

The repository has no integration test harness for DynamoDB-backed role and
ownership routes. Those handlers were not changed except for their catch-path
logging, and their authorization branches retain the existing responses. Add
provider-backed integration coverage before changing those authorization rules.

### Remaining unsafe logging sites

There are no raw `console.error` calls in `backend/src`. The logger's internal
`console.log` is the intended PM2 stdout sink. Development/migration scripts
under `scripts/` still use console output and can include local tooling error
messages; they are not part of the deployed Express process or PM2 log stream.
Review them separately before any script output is centrally collected.
