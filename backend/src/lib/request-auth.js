import { getAuthProvider } from "../auth/provider.js";
import { getRepositories } from "../repositories/index.js";

export async function authenticatedUser(req) {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const identity = getAuthProvider().verifyAccessToken(token);
  return getRepositories().users.findById(identity.userId);
}

export function safeUser(user) {
  if (!user) return user;
  const { password, passwordHash, refreshToken, ...safe } = user;
  return safe;
}
