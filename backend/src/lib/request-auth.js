import jwt from "jsonwebtoken";
import { getRepositories } from "../repositories/index.js";

export async function authenticatedUser(req) {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  return getRepositories().users.findById(decoded._id);
}

export function safeUser(user) {
  if (!user) return user;
  const { password, passwordHash, refreshToken, ...safe } = user;
  return safe;
}
