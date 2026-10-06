import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { validationError } from "../middleware/validationError.js";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  setTaskStatus,
  updateTask,
} from "../controllers/taskController.js";
import {
  descriptionRule,
  dueDateRule,
  idRule,
  listQueryRules,
  optionalTitleRule,
  priorityRule,
  requiredStatusRule,
  statusRule,
  titleRule,
} from "../validators/taskValidators.js";

const router = Router();
router.use(requireAuth);

// GET /api/tasks?search=&status=&priority=&sort=&order=&page=&limit=
router.get("/", listQueryRules, validationError, asyncHandler(listTasks));

// GET /api/tasks/:id
router.get("/:id", idRule, validationError, asyncHandler(getTask));

// POST /api/tasks
router.post(
  "/",
  titleRule,
  descriptionRule,
  statusRule,
  priorityRule,
  dueDateRule,
  validationError,
  asyncHandler(createTask)
);

// PUT /api/tasks/:id
router.put(
  "/:id",
  idRule,
  optionalTitleRule,
  descriptionRule,
  statusRule,
  priorityRule,
  dueDateRule,
  validationError,
  asyncHandler(updateTask)
);

// PATCH /api/tasks/:id/status: quick status change for checkbox toggling
router.patch(
  "/:id/status",
  idRule,
  requiredStatusRule,
  validationError,
  asyncHandler(setTaskStatus)
);

// DELETE /api/tasks/:id
router.delete("/:id", idRule, validationError, asyncHandler(deleteTask));

export default router;
