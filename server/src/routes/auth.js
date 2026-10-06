import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validationError } from "../middleware/validationError.js";
import {
  emailRule,
  loginPasswordRule,
  nameRule,
  signupPasswordRule,
} from "../validators/authValidators.js";
import { login, me, signup } from "../controllers/authController.js";

const router = Router();

// POST /api/auth/signup
router.post(
  "/signup",
  nameRule,
  emailRule,
  signupPasswordRule,
  validationError,
  asyncHandler(signup)
);

// POST /api/auth/login
router.post(
  "/login",
  emailRule,
  loginPasswordRule,
  validationError,
  asyncHandler(login)
);

// GET /api/auth/me
router.get("/me", requireAuth, asyncHandler(me));

export default router;
