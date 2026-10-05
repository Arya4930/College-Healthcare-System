# Phase 7: frontend production API configuration

## Production request path

```text
React/Vite frontend
  -> VITE_API_BASE_URL (public ALB/backend HTTPS domain)
  -> ALB
  -> EC2 Express API
  -> DynamoDB and Secrets Manager
```

The browser never receives AWS credentials, DynamoDB configuration, Secrets
Manager values, or backend JWT signing secrets. Only variables prefixed
`VITE_` are included in a Vite bundle, so use them only for public values.

## Frontend build configuration

Create an uncommitted frontend environment file from `.env.frontend.example`:

```env
VITE_API_BASE_URL=https://<public-api-domain-or-alb-dns>
VITE_BASE_PATH=/
```

`VITE_API_BASE_URL` is required outside Vite development mode. It must be the
public HTTPS API origin only; do not use an EC2 private address, `:4000`, a
DynamoDB endpoint, or a former Render URL. `VITE_BASE_PATH` is optional and is
needed only if the static host publishes the app beneath a path prefix.

For local development, use:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Build with `pnpm build` after setting the production value. The existing
`HashRouter` uses URL fragments, so refreshing a client-side route does not
require a server-side SPA fallback rewrite.

## Backend CORS and authentication configuration

Set the EC2 backend environment to the exact public frontend origin:

```env
FRONTEND_URL=https://<public-frontend-domain>
NODE_ENV=production
TRUST_PROXY=true
```

The API enables credentialed CORS only for `FRONTEND_URL`; it never uses a
wildcard origin for authenticated requests. Production cookies use `Secure` and
`SameSite=None` so they can accompany cross-origin HTTPS requests. The frontend
also preserves its existing bearer-token Authorization flow. Browsers or
institutional policies that block third-party cookies may prevent cookie-based
session behavior, but the current Authorization-header flow continues to work.

Deploy the resulting static frontend to the chosen static host and configure
its HTTPS origin as `FRONTEND_URL` on the backend. Do not put credentials or
secrets in either frontend environment file.
