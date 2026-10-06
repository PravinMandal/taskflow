import { body, param, query } from "express-validator";
import mongoose from "mongoose";
import { TASK_STATUSES, TASK_PRIORITIES } from "../models/Task.js";

export const idRule = param("id")
  .custom((v) => mongoose.isValidObjectId(v))
  .withMessage("That task ID doesn't look valid.");

export const titleRule = body("title")
  .trim()
  .notEmpty().withMessage("Title is required. Give your task a name.")
  .isLength({ min: 1, max: 140 }).withMessage("Title must be 1 to 140 characters.");

export const optionalTitleRule = body("title").optional()
  .trim()
  .notEmpty().withMessage("Title can't be empty.")
  .isLength({ min: 1, max: 140 }).withMessage("Title must be 1 to 140 characters.");

export const descriptionRule = body("description").optional({ nullable: true })
  .isString().withMessage("Description must be text.")
  .isLength({ max: 2000 }).withMessage("Description must be under 2000 characters.");

export const statusRule = body("status").optional()
  .isIn(TASK_STATUSES)
  .withMessage(`Status must be one of: ${TASK_STATUSES.join(", ")}.`);

export const priorityRule = body("priority").optional()
  .isIn(TASK_PRIORITIES)
  .withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(", ")}.`);

export const requiredStatusRule = body("status")
  .isIn(TASK_STATUSES)
  .withMessage(`Status must be one of: ${TASK_STATUSES.join(", ")}.`);

export const dueDateRule = body("dueDate").optional({ nullable: true })
  .custom((v) => v === null || v === "" || !Number.isNaN(Date.parse(v)))
  .withMessage("Due date must be a valid date.");

export const listQueryRules = [
  query("status").optional().isIn([...TASK_STATUSES, "all"]).withMessage("Invalid status filter."),
  query("priority").optional().isIn([...TASK_PRIORITIES, "all"]).withMessage("Invalid priority filter."),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number."),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1 to 100."),
];
