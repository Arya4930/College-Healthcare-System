# Phase 7: frontend production API configuration

## Production request path

```text
React/Vite frontend
  -> VITE_API_URL=https://api-cad.arya22.dev
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
VITE_API_URL=https://api-cad.arya22.dev
VITE_BASE_PATH=/College-Healthcare-System/
```

`VITE_API_URL` is required outside Vite development mode. It must be the
public HTTPS API origin only; do not use an EC2 private address, `:4000`, a
DynamoDB endpoint, or a former Render URL. GitHub Pages serves this repository
under `/College-Healthcare-System/`, which is the default `VITE_BASE_PATH`.

For local development, use:

```env
VITE_API_URL=http://localhost:4000
```

Build with `pnpm build` after setting the production value. The existing
`HashRouter` uses URL fragments, so refreshing a client-side route does not
require a server-side SPA fallback rewrite.

## Backend CORS and authentication configuration

Set the EC2 backend environment to the exact public frontend origin:

```env
FRONTEND_URL=https://arya4930.github.io
NODE_ENV=production
TRUST_PROXY=true
```

The API enables credentialed CORS only for `FRONTEND_URL`; it never uses a
wildcard origin for authenticated requests. Production cookies use `Secure` and
`SameSite=None` so they can accompany cross-origin HTTPS requests. The frontend
also preserves its existing bearer-token Authorization flow. Browsers or
institutional policies that block third-party cookies may prevent cookie-based
session behavior, but the current Authorization-header flow continues to work.

Deploy the resulting static frontend to GitHub Pages and configure its HTTPS
origin (`https://arya4930.github.io`, without the repository path) as
`FRONTEND_URL` on the backend. Do not put credentials or secrets in either
frontend environment file.

## Build and verification

```bash
# Bash
VITE_API_URL=https://api-cad.arya22.dev pnpm build

# PowerShell
$env:VITE_API_URL='https://api-cad.arya22.dev'; pnpm build
```

Confirm the generated files contain `https://api-cad.arya22.dev` and no former
Render API URL. Publish the `dist` directory with the existing `pnpm deploy`
workflow only after the build is reviewed. Test login, a protected request, and
a hard refresh of a `#/` route in a real browser after deployment.
