import mongoose from "mongoose";
import { Task } from "../models/Task.js";

const notFound = (res) =>
  res.status(404).json({
    error: "Not Found",
    message: "That task doesn't exist or isn't yours.",
  });

const normalizeDueDate = (v) =>
  v === undefined || v === null || v === "" ? null : new Date(v);

function buildListFilter(userId, { search = "", status, priority }) {
  const filter = { owner: userId };
  if (status && status !== "all") filter.status = status;
  if (priority && priority !== "all") filter.priority = priority;
  if (search.trim()) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { description: rx }];
  }
  return filter;
}

/** GET /api/tasks: list the caller's tasks with search, filters, and pagination. */
export async function listTasks(req, res) {
  const { search = "", status, priority, sort = "createdAt", order = "desc" } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));

  const filter = buildListFilter(req.userId, { search, status, priority });

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
}

/** GET /api/tasks/:id: fetch one of the caller's tasks. */
export async function getTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, owner: req.userId });
  if (!task) return notFound(res);
  return res.json({ task: task.toJSONSafe() });
}

/** POST /api/tasks: create a task for the caller. */
export async function createTask(req, res) {
  const task = await Task.create({
    owner: req.userId,
    title: req.body.title.trim(),
    description: (req.body.description || "").trim(),
    status: req.body.status || "pending",
    priority: req.body.priority || "medium",
    dueDate: normalizeDueDate(req.body.dueDate),
  });
  return res.status(201).json({ task: task.toJSONSafe() });
}

/** PUT /api/tasks/:id: patch any editable fields of one of the caller's tasks. */
export async function updateTask(req, res) {
  const patch = {};
  if (req.body.title !== undefined) patch.title = req.body.title.trim();
  if (req.body.description !== undefined) patch.description = String(req.body.description || "").trim();
  if (req.body.status !== undefined) patch.status = req.body.status;
  if (req.body.priority !== undefined) patch.priority = req.body.priority;
  if (req.body.dueDate !== undefined) patch.dueDate = normalizeDueDate(req.body.dueDate);

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { $set: patch },
    { new: true, runValidators: true }
  );
  if (!task) return notFound(res);
  return res.json({ task: task.toJSONSafe() });
}

/** PATCH /api/tasks/:id/status: quick status change for checkbox toggling. */
export async function setTaskStatus(req, res) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.userId },
    { $set: { status: req.body.status } },
    { new: true }
  );
  if (!task) return notFound(res);
  return res.json({ task: task.toJSONSafe() });
}

/** DELETE /api/tasks/:id: remove one of the caller's tasks. */
export async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!task) return notFound(res);
  return res.json({ message: "Task deleted.", id: task._id.toString() });
}
