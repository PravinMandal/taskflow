import { User, hashPassword } from "../models/User.js";
import { signToken } from "../lib/tokens.js";

/** POST /api/auth/signup: register a new account and return a session token. */
export async function signup(req, res) {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({
      error: "Conflict",
      message: "An account with that email already exists. Try logging in instead.",
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password),
  });
  const token = signToken(user._id.toString());
  return res.status(201).json({ user: user.toSafeJSON(), token });
}

/** POST /api/auth/login: verify credentials and return a session token. */
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Incorrect email or password. Please try again.",
    });
  }

  const token = signToken(user._id.toString());
  return res.json({
    user: { id: user._id.toString(), name: user.name, email: user.email },
    token,
  });
}

/** GET /api/auth/me: return the currently authenticated user. */
export async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Account not found. Please log in again.",
    });
  }
  return res.json({ user: user.toSafeJSON() });
}
