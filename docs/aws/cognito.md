# Cognito migration preparation

## Current authentication

CampusCare currently uses the `jwt` provider (the default). `POST /api/auth/login`
checks an institution ID, password, and type against the application user record,
then issues seven-day access and refresh JWTs. `POST /api/auth/register` is
admin-only, and `GET /api/auth/verify` verifies an access token. The backend
accepts the access token from the `accessToken` cookie or `Authorization: Bearer`.

The React client stores the access token in local storage, sends it as a bearer
token, and uses `/api/auth/verify` on startup. It has no refresh endpoint or
server-side logout endpoint today; the existing refresh token is persisted in the
user record and returned by login, but is not consumed by the frontend. This is
documented behavior, not changed by this preparation work.

After identity is verified, the backend fetches the application user by its
internal ID. Route authorization continues to use that database record for role
and type checks. This preserves student, parent, doctor, and admin permissions;
parent/ward lookups use the stored parent association, and appointment/order
ownership uses the stored institution ID. Client-supplied role fields are not
trusted for authorization.

## Provider selection

`AUTH_PROVIDER=jwt` is the default and requires `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET`. It retains the existing login response, JWT payloads,
expiration, cookies, and API behavior.

`AUTH_PROVIDER=cognito` is deliberately unavailable in this phase. Startup fails
closed if its required configuration is absent, and also fails closed if it is
present because safe Cognito JWT verification and subject mapping have not yet
been implemented. This prevents a configuration change from accepting unsigned
or unchecked tokens.

Backend-only future configuration:

```dotenv
AUTH_PROVIDER=cognito
AWS_REGION=ap-southeast-2
COGNITO_USER_POOL_ID=
COGNITO_APP_CLIENT_ID=
```

Do not put these values, a Cognito client secret, AWS credentials, JWT secrets,
or Secrets Manager values in `VITE_` variables. No user pool, app client, or AWS
resource is created by this repository.

## Requirements before enabling Cognito

A future provider must verify Cognito **access tokens** using the user pool JWKS
and cryptographic signature. It must validate the expected issuer, app client
identifier (the `client_id` claim for access tokens), `token_use=access`, expiry,
and normal JWT time claims before any application lookup. Decoding a JWT payload
alone is not verification.

The immutable Cognito `sub` must be associated with the existing internal
CampusCare user ID through an explicit, verified mapping. Cognito usernames and
emails must not be treated as interchangeable with institution IDs or DynamoDB
user IDs. The current DynamoDB user schema/repository has no `cognitoSub` field;
adding a mapping and backfilling it is a separate migration, so Cognito cannot
yet look up users safely.

## Migration and rollback

1. Create and configure the user pool and app client outside this repository.
2. Implement and test JWKS validation plus a database migration for the stable
   `sub` mapping.
3. Test every role, admin registration, parent/ward lookup, and record ownership
   flow in a non-production environment.
4. Change `AUTH_PROVIDER` only after those checks. Keep the current JWT secrets
   and provider available for rollback until the cutover is proven.

Changing `AUTH_PROVIDER` back to `jwt` restores the existing authentication path;
it does not alter user records or DynamoDB tables.
