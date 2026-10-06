import { motion } from "framer-motion";
import { IconCheck } from "./icons.jsx";

const STATUS_META = {
  pending: { label: "Pending", pill: "pill--pending" },
  in_progress: { label: "In progress", pill: "pill--in_progress" },
  completed: { label: "Done", pill: "pill--completed" },
};

function dueInfo(dueDate, status) {
  if (!dueDate) return null;
  // Stored dates are UTC midnights from date-only inputs, so format in UTC
  // to avoid showing the previous day in negative-offset timezones.
  const label = new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  if (status === "completed") return { text: label, overdue: false };
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { text: `${label} · Overdue`, overdue: true };
  if (diff === 0) return { text: "Due today", overdue: false };
  if (diff === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due ${label}`, overdue: false };
}

/** Rich list row: checkbox, title + description, status pill, priority, due. */
export function TaskRow({ task, onToggleDone, onEdit, onDelete, toggling }) {
  const done = task.status === "completed";
  const meta = STATUS_META[task.status] ?? STATUS_META.pending;
  const due = dueInfo(task.dueDate, task.status);

  return (
    <motion.li
      className={`task-row ${done ? "is-done" : ""} p-${task.priority}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, overflow: "hidden", transition: { duration: 0.22 } }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        className={`check ${done ? "is-done" : ""}`}
        onClick={() => onToggleDone(task)}
        disabled={toggling}
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        title={done ? "Reopen" : "Complete"}
      >
        <IconCheck />
      </button>
      <div className="task-main" onClick={() => onEdit(task)}>
        <div className="task-title">{task.title}</div>
        {task.description && <p className="task-desc">{task.description}</p>}
        <div className="task-meta">
          <span className={`pill ${meta.pill}`}>{meta.label}</span>
          <span className={`pill pill--flag ${task.priority === "high" ? "f-high" : ""}`}>
            {task.priority === "high" ? "▲ High" : task.priority === "medium" ? "● Medium" : "○ Low"}
          </span>
          {due && <span className={`pill pill--due ${due.overdue ? "over" : ""}`}>{due.text}</span>}
        </div>
      </div>
      <div className="row-actions">
        <button type="button" className="icon-btn" onClick={() => onEdit(task)} title="Edit" aria-label={`Edit ${task.title}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
        </button>
        <button type="button" className="icon-btn danger" onClick={() => onDelete(task)} title="Delete" aria-label={`Delete ${task.title}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6" /></svg>
        </button>
      </div>
    </motion.li>
  );
}
