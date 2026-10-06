import mongoose from "mongoose";

export const TASK_STATUSES = ["pending", "in_progress", "completed"];
export const TASK_PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    status: { type: String, enum: TASK_STATUSES, default: "pending", index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "medium", index: true },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ owner: 1, createdAt: -1 });

taskSchema.methods.toJSONSafe = function () {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    status: this.status,
    priority: this.priority,
    dueDate: this.dueDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Task = mongoose.models.Task ?? mongoose.model("Task", taskSchema);
