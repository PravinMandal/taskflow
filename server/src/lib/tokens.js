import jwt from "jsonwebtoken";

const getSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not configured");
  return s;
};

export function signToken(userId) {
  return jwt.sign({ sub: userId }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
