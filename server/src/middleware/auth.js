import { verifyToken } from "../lib/tokens.js";

/** Require a valid `Authorization: Bearer <jwt>` header. Sets req.userId. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Please log in to continue. Your session is missing or expired.",
    });
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Your session has expired. Please log in again.",
    });
  }
}
