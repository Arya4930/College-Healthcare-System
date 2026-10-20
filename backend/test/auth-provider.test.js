/* global process */

import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import { createJwtProvider } from "../src/auth/providers/jwt.js";
import { configuredProviderName } from "../src/auth/provider.js";
import { createCognitoProvider } from "../src/auth/providers/cognito.js";

const provider = createJwtProvider({ accessSecret: "test-access-secret", refreshSecret: "test-refresh-secret" });

test("JWT provider preserves the existing token identity and normalizes it", () => {
  const { accessToken, refreshToken } = provider.issueTokens({
    _id: "user-1", ID: "student-1", name: "Student", role: "student", type: "student", parent: "parent-1",
  });
  const identity = provider.verifyAccessToken(accessToken);

  assert.equal(identity.provider, "jwt");
  assert.equal(identity.subject, "user-1");
  assert.equal(identity.userId, "user-1");
  assert.equal(jwt.verify(refreshToken, "test-refresh-secret")._id, "user-1");
});

test("JWT provider rejects malformed and expired access tokens", () => {
  assert.throws(() => provider.verifyAccessToken("not-a-jwt"));
  const wrongSignature = jwt.sign({ _id: "user-1" }, "different-test-secret");
  assert.throws(() => provider.verifyAccessToken(wrongSignature));
  const expired = jwt.sign({ _id: "user-1" }, "test-access-secret", { expiresIn: -1 });
  assert.throws(() => provider.verifyAccessToken(expired));
});

test("provider selection defaults to JWT and rejects unsupported providers", () => {
  const previous = process.env.AUTH_PROVIDER;
  delete process.env.AUTH_PROVIDER;
  assert.equal(configuredProviderName(), "jwt");
  process.env.AUTH_PROVIDER = "unsupported";
  assert.throws(() => configuredProviderName(), /AUTH_PROVIDER/);
  if (previous === undefined) delete process.env.AUTH_PROVIDER;
  else process.env.AUTH_PROVIDER = previous;
});

test("Cognito provider fails closed until verification and mapping are implemented", () => {
  const previous = {
    AWS_REGION: process.env.AWS_REGION,
    COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    COGNITO_APP_CLIENT_ID: process.env.COGNITO_APP_CLIENT_ID,
  };
  delete process.env.AWS_REGION;
  delete process.env.COGNITO_USER_POOL_ID;
  delete process.env.COGNITO_APP_CLIENT_ID;
  assert.throws(() => createCognitoProvider(), /Cognito authentication requires/);
  process.env.AWS_REGION = "test-region-1";
  process.env.COGNITO_USER_POOL_ID = "test-pool";
  process.env.COGNITO_APP_CLIENT_ID = "test-client";
  assert.throws(() => createCognitoProvider(), /not enabled/);
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
