import { body } from "express-validator";

export const nameRule = body("name")
  .trim()
  .notEmpty().withMessage("Name is required.")
  .isLength({ min: 2, max: 60 }).withMessage("Name must be 2 to 60 characters.");

export const emailRule = body("email")
  .trim()
  .notEmpty().withMessage("Email is required.")
  .isEmail().withMessage("Please enter a valid email address.")
  .normalizeEmail();

export const signupPasswordRule = body("password")
  .notEmpty().withMessage("Password is required.")
  .isLength({ min: 8 }).withMessage("Password must be at least 8 characters long.")
  .matches(/[A-Za-z]/).withMessage("Password must include at least one letter.")
  .matches(/\d/).withMessage("Password must include at least one number.");

export const loginPasswordRule = body("password")
  .notEmpty().withMessage("Password is required.");
