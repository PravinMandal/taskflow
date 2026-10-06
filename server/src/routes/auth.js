import { Router } from "express";
import { body, validationResult } from "express-validator";
import { User, hashPassword } from "../models/User.js";
import { signToken } from "../lib/tokens.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function validationError(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => e.msg);
  return res.status(400).json({
    error: "Validation Error",
    message: details[0],
    details,
  });
}

const emailRule = body("email")
  .trim()
  .notEmpty().withMessage("Email is required.")
  .isEmail().withMessage("Please enter a valid email address.")
  .normalizeEmail();

const passwordRule = body("password")
  .notEmpty().withMessage("Password is required.")
  .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.")
  .matches(/[A-Za-z]/).withMessage("Password must include at least one letter.")
  .matches(/\d/).withMessage("Password must include at least one number.");

// POST /api/auth/signup
router.post(
  "/signup",
  body("name").trim().notEmpty().withMessage("Name is required.")
    .isLength({ min: 2, max: 60 }).withMessage("Name must be 2 to 60 characters."),
  emailRule,
  passwordRule,
  validationError,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: "An account with that email already exists. Try logging in instead.",
      });
    }
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: await hashPassword(password),
    });
    const token = signToken(user._id.toString());
    return res.status(201).json({ user: user.toSafeJSON(), token });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  emailRule,
  body("password").notEmpty().withMessage("Password is required."),
  validationError,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Incorrect email or password. Please try again.",
      });
    }
    const token = signToken(user._id.toString());
    return res.json({ user: { id: user._id.toString(), name: user.name, email: user.email }, token });
  })
);

// GET /api/auth/me
router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized", message: "Account not found. Please log in again." });
  }
  return res.json({ user: user.toSafeJSON() });
}));

export default router;
