import "dotenv/config.js";

const REQUIRED_APPLICATION_SECRET_KEYS = [
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
];

let applicationSecretsPromise;

function useAwsSecrets() {
  return process.env.NODE_ENV === "production" || process.env.USE_AWS_SECRETS === "true";
}

function requiredSecretKeysMissing(configuration) {
  return REQUIRED_APPLICATION_SECRET_KEYS.filter(
    (key) => typeof configuration[key] !== "string" || configuration[key].trim() === ""
  );
}

function parseSecret(response) {
  const secretString = response.SecretString ?? (
    response.SecretBinary
      ? Buffer.from(response.SecretBinary).toString("utf8")
      : undefined
  );

  if (!secretString) {
    throw new Error("AWS Secrets Manager returned an empty application secret");
  }

  try {
    const secret = JSON.parse(secretString);

    if (!secret || Array.isArray(secret) || typeof secret !== "object") {
      throw new Error("AWS application secret must be a JSON object");
    }

    return secret;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("AWS application secret must contain valid JSON");
    }

    throw error;
  }
}

async function loadFromAwsSecretsManager() {
  const region = process.env.AWS_REGION;
  const secretName = process.env.AWS_SECRET_NAME;

  if (!region || !secretName) {
    throw new Error(
      "AWS secrets mode requires AWS_REGION and AWS_SECRET_NAME"
    );
  }

  try {
    const { GetSecretValueCommand, SecretsManagerClient } = await import(
      "@aws-sdk/client-secrets-manager"
    );
    const client = new SecretsManagerClient({ region });
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );
    const secret = parseSecret(response);
    const missing = requiredSecretKeysMissing(secret);

    if (missing.length > 0) {
      throw new Error(
        `AWS application secret is missing required keys: ${missing.join(", ")}`
      );
    }

    return Object.freeze(
      Object.fromEntries(REQUIRED_APPLICATION_SECRET_KEYS.map((key) => [key, secret[key]]))
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AWS application secret")) {
      throw error;
    }

    throw new Error(
      "Unable to retrieve the CampusCare application secret from AWS Secrets Manager. Verify AWS_REGION, AWS_SECRET_NAME, and the CampusCare-EC2-Role permissions."
    );
  }
}

function loadFromEnvironment() {
  return Object.freeze(
    Object.fromEntries(
      REQUIRED_APPLICATION_SECRET_KEYS.map((key) => [key, process.env[key]])
    )
  );
}

/**
 * Loads JWT application secrets once at startup. Existing authentication code
 * reads process.env, so the loaded values are applied only for AWS mode.
 */
export function loadApplicationSecrets() {
  if (!applicationSecretsPromise) {
    applicationSecretsPromise = (async () => {
      const secrets = useAwsSecrets()
        ? await loadFromAwsSecretsManager()
        : loadFromEnvironment();

      if (useAwsSecrets()) {
        for (const key of REQUIRED_APPLICATION_SECRET_KEYS) {
          process.env[key] = secrets[key];
        }
      }

      return secrets;
    })();
  }

  return applicationSecretsPromise;
}
