import { getAuthProvider } from "../auth/provider.js";

export function createTokens(user) {
  return getAuthProvider().issueTokens(user);
}
