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

Two production build targets are supported:

| Target | Command | Base path | Public API URL |
| --- | --- | --- | --- |
| GitHub Pages | `npm run build` | `/College-Healthcare-System/` | Set `VITE_API_URL=https://api-cad.arya22.dev` in the build environment |
| S3 + CloudFront (`https://campuscare.arya22.dev`) | `npm run build:aws` | `/` | `https://api-cad.arya22.dev` from committed `.env.aws` |

The AWS mode is explicit so the existing GitHub Pages `build` and `deploy`
workflows remain unchanged. `.env.aws` contains public build configuration only.
All `VITE_*` values are embedded in the browser bundle, so never put credentials,
tokens, or other secrets in them.

For an alternative AWS build environment file, copy the public values from
`.env.frontend.example`:

```env
VITE_API_URL=https://api-cad.arya22.dev
VITE_BASE_PATH=/
```

`VITE_API_URL` is required outside Vite development mode. It must be the
public HTTPS API origin only; do not use an EC2 private address, `:4000`, a
DynamoDB endpoint, or a former Render URL. GitHub Pages serves this repository
under `/College-Healthcare-System/`; the AWS build serves the custom domain root.

For local development, use:

```env
VITE_API_URL=http://localhost:4000
```

Build S3/CloudFront artifacts with `npm run build:aws`. The existing
`HashRouter` uses URL fragments, so refreshing a client-side route does not
require a server-side SPA fallback rewrite.

## Backend CORS and authentication configuration

For the S3 + CloudFront deployment, set the EC2 backend environment to the
exact public frontend origin:

```env
FRONTEND_URL=https://campuscare.arya22.dev
NODE_ENV=production
TRUST_PROXY=true
```

The API enables credentialed CORS only for `FRONTEND_URL`; it never uses a
wildcard origin for authenticated requests. Production cookies use `Secure` and
`SameSite=None` so they can accompany cross-origin HTTPS requests. The frontend
also preserves its existing bearer-token Authorization flow. Browsers or
institutional policies that block third-party cookies may prevent cookie-based
session behavior, but the current Authorization-header flow continues to work.

If using the GitHub Pages target instead, its origin is
`https://arya4930.github.io` (without the repository path). Configure one
matching deployment origin as `FRONTEND_URL`; do not put credentials or secrets
in any frontend environment file.

## Build and verification

```bash
npm run build:aws
```

Confirm the generated files contain `https://api-cad.arya22.dev` and no former
Render API URL. Upload the resulting `dist` directory through the approved S3 /
CloudFront release process only after the build is reviewed. Test login, a
protected request, and a hard refresh of a `#/` route in a real browser after
deployment.
