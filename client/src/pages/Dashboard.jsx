import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { api, ApiError } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toasts.jsx";
import { ThemeToggle } from "../components/ThemeToggle.jsx";
import { TaskRow } from "../components/TaskCard.jsx";
import { TaskModal } from "../components/TaskModal.jsx";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";
import { IconLogo, IconLogout, IconPlus } from "../components/icons.jsx";

const PRIORITY_TABS = [
  { value: "all", label: "All" },
  { value: "low", label: "Low", dot: "#a39b8c" },
  { value: "medium", label: "Medium", dot: "#d97706" },
  { value: "high", label: "High", dot: "#e5484d" },
];

export function Dashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listTasks({ search: debouncedSearch, status, priority, limit: 100 });
      setTasks(data.tasks || []);
      setCounts(data.counts || {});
    } catch (err) {
      toast.error(err.message || "Couldn't load your tasks.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, priority]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = useMemo(() => {
    const pending = counts.pending || 0;
    const progress = counts.in_progress || 0;
    const done = counts.completed || 0;
    const total = pending + progress + done;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { pending, progress, done, total, pct };
  }, [counts]);

  const groups = useMemo(() => {
    const order =
      status !== "all"
        ? [status]
        : ["pending", "in_progress", "completed"];
    const titles = { pending: "To do", in_progress: "In progress", completed: "Completed" };
    return order
      .map((s) => ({ status: s, title: titles[s], items: tasks.filter((t) => t.status === s) }))
      .filter((g) => g.items.length > 0);
  }, [tasks, status]);

  function openCreate() {
    setEditing(null);
    setModalError("");
    setModalOpen(true);
  }

  /** Session died mid-action: drop auth so the user lands on login cleanly. */
  function handleExpiredSession() {
    logout();
    toast.error("Your session expired. Please log in again.");
  }

  function isExpired(err) {
    return err instanceof ApiError && err.status === 401;
  }

  async function handleSubmit(payload) {
    setSaving(true);
    setModalError("");
    const wasEditing = editing;
    try {
      if (wasEditing) {
        const { task } = await api.updateTask(wasEditing.id, payload);
        setTasks((ts) => ts.map((t) => (t.id === task.id ? task : t)));
        toast.success("Task updated.");
      } else {
        const { task } = await api.createTask(payload);
        setTasks((ts) => [task, ...ts]);
        setCounts((c) => ({ ...c, [task.status]: (c[task.status] || 0) + 1 }));
        toast.success("Task added.");
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      if (isExpired(err)) {
        setModalOpen(false);
        handleExpiredSession();
        return;
      }
      setModalError(err.message || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleDone(task) {
    const next = task.status === "completed" ? "pending" : "completed";
    const prev = task.status;
    // Optimistic update so the checkbox feels instant.
    setTogglingId(task.id);
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
    try {
      const { task: updated } = await api.setStatus(task.id, next);
      setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
      setCounts((c) => ({
        ...c,
        [prev]: Math.max(0, (c[prev] || 1) - 1),
        [next]: (c[next] || 0) + 1,
      }));
      if (next === "completed") toast.success("Done. Nice work.");
    } catch (err) {
      if (isExpired(err)) {
        handleExpiredSession();
        return;
      }
      // Revert the optimistic change so the UI never lies.
      setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status: prev } : t)));
      toast.error(err.message || "Couldn't update that task.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleting || removingId) return;
    const target = deleting;
    // Optimistic removal: the row animates out immediately, so there is no
    // flash of the confirm dialog closing and reopening behind the list.
    setRemovingId(target.id);
    setDeleting(null);
    setTasks((ts) => ts.filter((t) => t.id !== target.id));
    try {
      await api.deleteTask(target.id);
      setCounts((c) => ({ ...c, [target.status]: Math.max(0, (c[target.status] || 1) - 1) }));
      toast.info("Task deleted.");
    } catch (err) {
      if (isExpired(err)) {
        handleExpiredSession();
        return;
      }
      // Restore the row; the delete never happened server-side.
      // Guard against duplicates if a refetch already brought it back.
      setTasks((ts) => (ts.some((t) => t.id === target.id) ? ts : [target, ...ts]));
      toast.error(err.message || "Couldn't delete that task.");
    } finally {
      setRemovingId(null);
    }
  }

  const initial = user?.name?.trim()?.[0]?.toUpperCase() || "T";
  const filtered = status !== "all" || priority !== "all" || debouncedSearch;

  const statusNav = [
    { value: "all", label: "All tasks", dot: "var(--text-faint)", count: stats.total },
    { value: "pending", label: "To do", dot: "var(--warn)", count: stats.pending },
    { value: "in_progress", label: "In progress", dot: "var(--info)", count: stats.progress },
    { value: "completed", label: "Completed", dot: "var(--ok)", count: stats.done },
  ];

  return (
    <div className="app">
      {/* ---------- Sidebar ---------- */}
      <aside className="side">
        <div className="brand">
          <span className="brand-mark"><IconLogo /></span>
          TaskFlow
        </div>
        <div className="side-label">Workspace</div>
        {statusNav.map((n) => (
          <button
            key={n.value}
            type="button"
            className={`nav-item ${status === n.value ? "active" : ""}`}
            onClick={() => setStatus(n.value)}
          >
            <span className="nav-dot" style={{ background: n.dot }} />
            {n.label}
            <span className="n-count">{n.count}</span>
          </button>
        ))}
        <div className="side-label">Priority</div>
        {PRIORITY_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`nav-item ${priority === t.value ? "active" : ""}`}
            onClick={() => setPriority(t.value)}
          >
            {t.dot && <span className="nav-dot" style={{ background: t.dot }} />}
            {t.label}
          </button>
        ))}
        <div className="side-foot">
          <div className="user-row" title={user?.email}>
            <span className="avatar">{initial}</span>
            <div style={{ minWidth: 0 }}>
              <div className="u-name">{user?.name}</div>
              <div className="u-mail">{user?.email}</div>
            </div>
          </div>
          <div className="side-actions">
            <ThemeToggle />
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout} title="Log out">
              <IconLogout /> <span className="hide-sm">Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- Mobile nav ---------- */}
      <nav className="mobile-nav">
        <div className="brand">
          <span className="brand-mark"><IconLogo /></span>
          TaskFlow
        </div>
        {statusNav.map((n) => (
          <button
            key={n.value}
            type="button"
            className={`nav-item ${status === n.value ? "active" : ""}`}
            onClick={() => setStatus(n.value)}
          >
            {n.label} · {n.count}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <ThemeToggle />
      </nav>

      {/* ---------- Main ---------- */}
      <div className="main">
        <div className="main-inner">
          <div className="topbar">
            <span className="crumb"><b>{weekdayLabel()}</b> · {stats.total === 0 ? "a clean slate" : `${stats.done}/${stats.total} done`}</span>
            <div className="topbar-spacer" />
            <button type="button" className="btn btn-primary btn-sm" onClick={openCreate}>
              <IconPlus /> <span className="hide-sm">New task</span>
            </button>
          </div>

          <motion.section
            className="page-head"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="eyebrow">{status === "all" ? "Overview" : statusNav.find((n) => n.value === status)?.label}</div>
            <h1>{greeting()}, {firstName(user?.name)}.</h1>
            <p className="page-sub">
              {stats.total === 0
                ? "A clean slate. Add your first task below."
                : `${stats.pending + stats.progress} open · ${stats.done} completed · ${stats.pct}% there`}
            </p>
            {stats.total > 0 && (
              <div className="progress-track" aria-hidden>
                <div className="progress-fill" style={{ width: `${stats.pct}%` }} />
              </div>
            )}
          </motion.section>

          <motion.div
            className="toolbar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08, duration: 0.4 }}
          >
            {PRIORITY_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`chip-tab ${priority === t.value ? "active" : ""}`}
                onClick={() => setPriority(t.value)}
              >
                {t.dot && <span className="p-dot" style={{ background: t.dot }} />}
                {t.label}
              </button>
            ))}
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
            />
          </motion.div>

          {loading ? (
            <div aria-label="Loading tasks" style={{ marginTop: 18 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skel-row">
                  <div className="skel-check" />
                  <div className="skel-line" style={{ width: `${60 - i * 5}%` }} />
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <motion.div className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="empty-mark">○</div>
              <h3>{filtered ? "No matching tasks" : "No tasks yet"}</h3>
              <p>{filtered ? "Try a different search or filter." : "Add one below to get started."}</p>
              {!filtered && (
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                  <IconPlus /> New task
                </button>
              )}
            </motion.div>
          ) : (
            <>
              {groups.map((g) => (
                <section key={g.status} className="task-group">
                  <div className="group-head">
                    <h2>{g.title}</h2>
                    <span className="g-count">{g.items.length}</span>
                  </div>
                  <motion.ul className="task-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <AnimatePresence initial={false}>
                      {g.items.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          toggling={togglingId === task.id}
                          onToggleDone={handleToggleDone}
                          onEdit={(t) => {
                            setEditing(t);
                            setModalError("");
                            setModalOpen(true);
                          }}
                          onDelete={setDeleting}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.ul>
                </section>
              ))}
              <button type="button" className="composer-btn" onClick={openCreate}>
                <span className="plus"><IconPlus /></span>
                Add task
              </button>
            </>
          )}

          <footer className="footer">TaskFlow</footer>
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        initial={editing}
        saving={saving}
        serverError={modalError}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Delete task?"
        message={`"${deleting?.title}" will be permanently removed.`}
        busy={removingId !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function weekdayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function firstName(name) {
  return (name || "there").trim().split(/\s+/)[0];
}
