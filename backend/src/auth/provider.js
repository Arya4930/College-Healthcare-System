/* global process */

let activeProvider;

export function configuredProviderName() {
  const name = (process.env.AUTH_PROVIDER || "jwt").trim().toLowerCase();
  if (name !== "jwt" && name !== "cognito") {
    throw new Error("AUTH_PROVIDER must be either jwt or cognito");
  }
  return name;
}

export async function initializeAuthProvider() {
  const name = configuredProviderName();
  if (name === "jwt") {
    const { createJwtProvider } = await import("./providers/jwt.js");
    activeProvider = createJwtProvider();
  } else {
    const { createCognitoProvider } = await import("./providers/cognito.js");
    activeProvider = createCognitoProvider();
  }
  return activeProvider;
}

export function getAuthProvider() {
  if (!activeProvider) {
    throw new Error("Authentication provider has not been initialized");
  }
  return activeProvider;
}
