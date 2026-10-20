/* global process */

import jwt from "jsonwebtoken";

const ACCESS_TOKEN_OPTIONS = { expiresIn: "7d" };
const REFRESH_TOKEN_OPTIONS = { expiresIn: "7d" };

export function createJwtProvider({ accessSecret = process.env.ACCESS_TOKEN_SECRET, refreshSecret = process.env.REFRESH_TOKEN_SECRET } = {}) {
  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT authentication requires ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET");
  }

  return {
    name: "jwt",
    issueTokens(user) {
      const accessToken = jwt.sign(
        { _id: user._id, ID: user.ID, name: user.name, role: user.role, type: user.type, parent: user.parent || undefined },
        accessSecret,
        ACCESS_TOKEN_OPTIONS
      );
      const refreshToken = jwt.sign({ _id: user._id }, refreshSecret, REFRESH_TOKEN_OPTIONS);
      return { accessToken, refreshToken };
    },
    verifyAccessToken(token) {
      const claims = jwt.verify(token, accessSecret, { algorithms: ["HS256"] });
      if (!claims || typeof claims._id !== "string") {
        throw new Error("JWT access token is missing its user identifier");
      }
      return { provider: "jwt", subject: claims._id, userId: claims._id, claims };
    },
  };
}
