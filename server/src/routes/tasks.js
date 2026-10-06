import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";
import { Task, TASK_STATUSES, TASK_PRIORITIES } from "../models/Task.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function validationError(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => e.msg);
  return res.status(400).json({ error: "Validation Error", message: details[0], details });
}

const idRule = param("id")
  .custom((v) => mongoose.isValidObjectId(v))
  .withMessage("That task ID doesn't look valid.");

const titleRule = body("title")
  .trim()
  .notEmpty().withMessage("Title is required. Give your task a name.")
  .isLength({ min: 1, max: 140 }).withMessage("Title must be 1 to 140 characters.");

const optionalTitle = body("title").optional()
  .trim()
  .notEmpty().withMessage("Title can't be empty.")
  .isLength({ min: 1, max: 140 }).withMessage("Title must be 1 to 140 characters.");

const descriptionRule = body("description").optional({ nullable: true })
  .isString().withMessage("Description must be text.")
  .isLength({ max: 2000 }).withMessage("Description must be under 2000 characters.");

const statusRule = () =>
  body("status").optional().isIn(TASK_STATUSES)
    .withMessage(`Status must be one of: ${TASK_STATUSES.join(", ")}.`);
const priorityRule = () =>
  body("priority").optional().isIn(TASK_PRIORITIES)
    .withMessage(`Priority must be one of: ${TASK_PRIORITIES.join(", ")}.`);


const dueRule = body("dueDate").optional({ nullable: true })
  .custom((v) => v === null || v === "" || !Number.isNaN(Date.parse(v)))
  .withMessage("Due date must be a valid date.");

const normalizeDue = (v) => (v === undefined || v === null || v === "" ? null : new Date(v));

// GET /api/tasks?search=&status=&priority=&sort=createdAt&order=desc&page=&limit=
router.get(
  "/",
  query("status").optional().isIn([...TASK_STATUSES, "all"]).withMessage("Invalid status filter."),
  query("priority").optional().isIn([...TASK_PRIORITIES, "all"]).withMessage("Invalid priority filter."),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive number."),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1 to 100."),
  validationError,
  asyncHandler(async (req, res) => {
    const { search = "", status, priority, sort = "createdAt", order = "desc" } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const filter = { owner: req.userId };
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ title: rx }, { description: rx }];
    }

    const sortable = ["createdAt", "updatedAt", "dueDate", "title", "priority", "status"];
    const sortField = sortable.includes(sort) ? sort : "createdAt";
    const direction = order === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Task.find(filter).sort({ [sortField]: direction }).skip((page - 1) * limit).limit(limit),
      Task.countDocuments(filter),
    ]);

    const counts = await Task.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);

    return res.json({
      tasks: items.map((t) => t.toJSONSafe()),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
    });
  })
);

// GET /api/tasks/:id
router.get("/:id", idRule, validationError, asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, owner: req.userId });
  if (!task) return res.status(404).json({ error: "Not Found", message: "That task doesn't exist or isn't yours." });
  return res.json({ task: task.toJSONSafe() });
}));

// POST /api/tasks
router.post(
  "/",
  titleRule, descriptionRule, statusRule(), priorityRule(), dueRule,
  validationError,
  asyncHandler(async (req, res) => {
    const task = await Task.create({
      owner: req.userId,
      title: req.body.title.trim(),
      description: (req.body.description || "").trim(),
      status: req.body.status || "pending",
      priority: req.body.priority || "medium",
      dueDate: normalizeDue(req.body.dueDate),
    });
    return res.status(201).json({ task: task.toJSONSafe() });
  })
);

// PUT /api/tasks/:id
router.put(
  "/:id",
  idRule, optionalTitle, descriptionRule, statusRule(), priorityRule(), dueRule,
  validationError,
  asyncHandler(async (req, res) => {
    const patch = {};
    if (req.body.title !== undefined) patch.title = req.body.title.trim();
    if (req.body.description !== undefined) patch.description = String(req.body.description || "").trim();
    if (req.body.status !== undefined) patch.status = req.body.status;
    if (req.body.priority !== undefined) patch.priority = req.body.priority;
    if (req.body.dueDate !== undefined) patch.dueDate = normalizeDue(req.body.dueDate);

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: patch },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ error: "Not Found", message: "That task doesn't exist or isn't yours." });
    return res.json({ task: task.toJSONSafe() });
  })
);

// PATCH /api/tasks/:id/status: quick status cycling
router.patch(
  "/:id/status",
  idRule,
  body("status").isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(", ")}.`),
  validationError,
  asyncHandler(async (req, res) => {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { $set: { status: req.body.status } },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Not Found", message: "That task doesn't exist or isn't yours." });
    return res.json({ task: task.toJSONSafe() });
  })
);

// DELETE /api/tasks/:id
router.delete("/:id", idRule, validationError, asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!task) return res.status(404).json({ error: "Not Found", message: "That task doesn't exist or isn't yours." });
  return res.json({ message: "Task deleted.", id: task._id.toString() });
}));

export default router;
