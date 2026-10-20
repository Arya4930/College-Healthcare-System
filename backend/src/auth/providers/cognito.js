/* global process */

export function createCognitoProvider() {
  const required = ["AWS_REGION", "COGNITO_USER_POOL_ID", "COGNITO_APP_CLIENT_ID"];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length) {
    throw new Error(`Cognito authentication requires: ${missing.join(", ")}`);
  }

  // Cognito is intentionally fail-closed until JWKS verification and sub mapping are implemented.
  throw new Error(
    "Cognito authentication is not enabled. Configure JWKS verification and a Cognito sub-to-user mapping before selecting AUTH_PROVIDER=cognito."
  );
}
