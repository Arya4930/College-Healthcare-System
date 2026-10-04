import jwt from "jsonwebtoken";

export function createTokens(user) {
  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!accessSecret || !refreshSecret) throw new Error("JWT configuration is missing");
  const accessToken = jwt.sign({ _id: user._id, ID: user.ID, name: user.name, role: user.role, type: user.type, parent: user.parent || undefined }, accessSecret, { expiresIn: "7d" });
  const refreshToken = jwt.sign({ _id: user._id }, refreshSecret, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}
