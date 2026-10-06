import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];
const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const emptyForm = { title: "", description: "", status: "pending", priority: "medium", dueDate: "" };

function toInputDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  // Use local components (not toISOString) so a stored UTC midnight never
  // shifts to the previous day in negative-offset timezones.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Quiet centered editor. */
export function TaskModal({ open, initial, saving, serverError, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              title: initial.title ?? "",
              description: initial.description ?? "",
              status: initial.status ?? "pending",
              priority: initial.priority ?? "medium",
              dueDate: toInputDate(initial.dueDate),
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = "Give your task a title.";
    else if (form.title.trim().length > 140) errs.title = "Title must be under 140 characters.";
    if ((form.description || "").length > 2000) errs.description = "Description must be under 2000 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
    });
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open ]);

  // Portal to body: framer-motion transforms on ancestors break
  // position:fixed and made dialogs flash in the wrong spot on open.
  //
  // Backdrop and card are SIBLINGS, not parent/child: a fading parent would
  // multiply its opacity into the card and leave it translucent mid-animation
  // (the delete-dialog flicker). The card animates transform only and stays
  // fully opaque.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
          />
          <motion.div
            key="card"
            className="modal-centering"
            initial={{ y: 14, scale: 0.98 }}
            animate={{ y: 0, scale: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ y: 8, scale: 0.98, transition: { duration: 0.14 } }}
            onClick={onClose}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label={initial ? "Edit task" : "New task"}
              onClick={(e) => e.stopPropagation()}
            >
            <h2>{initial ? "Edit task" : "New task"}</h2>
            <p className="sub">{initial ? "Refine the details below." : "What needs doing?"}</p>
            {serverError && <div className="form-error">{serverError}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="task-title">Title</label>
                <input id="task-title" value={form.title} onChange={set("title")} placeholder="e.g. Review the launch plan" maxLength={140} autoFocus />
                <span className="hint">{errors.title || ""}</span>
              </div>
              <div className="field">
                <label htmlFor="task-desc">Notes</label>
                <textarea id="task-desc" value={form.description} onChange={set("description")} placeholder="Anything that helps future you..." maxLength={2000} />
                <span className="hint">{errors.description || ""}</span>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="task-status">Status</label>
                  <select id="task-status" value={form.status} onChange={set("status")}>
                    {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="task-priority">Priority</label>
                  <select id="task-priority" value={form.priority} onChange={set("priority")}>
                    {PRIORITIES.map((p) => (<option key={p.value} value={p.value}>{p.label}</option>))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="task-due">Due date</label>
                <input id="task-due" type="date" value={form.dueDate} onChange={set("dueDate")} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spin" />}
                  {initial ? "Save changes" : "Add task"}
                </button>
              </div>
            </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
