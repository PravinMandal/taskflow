import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toasts.jsx";
import { ThemeToggle } from "../components/ThemeToggle.jsx";
import { IconLogo } from "../components/icons.jsx";

export function AuthPage() {
  const { login, signup } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const errs = {};
    if (mode === "signup") {
      if (!form.name.trim()) errs.name = "Please tell us your name.";
      else if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    }
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errs.email = "That email doesn't look right.";
    if (!form.password) errs.password = "Password is required.";
    else if (mode === "signup") {
      if (form.password.length < 8) errs.password = "Use at least 8 characters.";
      else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
        errs.password = "Include at least one letter and one number.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email.trim(), form.password);
        toast.success("Welcome back.");
      } else {
        await signup(form.name.trim(), form.email.trim(), form.password);
        toast.success("Account created. Welcome.");
      }
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setErrors({});
    setServerError("");
  }

  return (
    <div className="auth-wrap">
      <div style={{ position: "absolute", top: 18, right: 18 }}>
        <ThemeToggle />
      </div>
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-brand">
          <span className="brand-mark"><IconLogo /></span>
          TaskFlow
        </div>
        <div className="auth-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
              <p className="sub">
                {mode === "login" ? "Log in to continue to your tasks." : "A calmer task list is one minute away."}
              </p>
              {serverError && <div className="form-error">{serverError}</div>}
              <form onSubmit={handleSubmit} noValidate>
                {mode === "signup" && (
                  <div className="field">
                    <label htmlFor="auth-name">Name</label>
                    <input id="auth-name" value={form.name} onChange={set("name")} placeholder="Ada Lovelace" autoComplete="name" />
                    <span className="hint">{errors.name || ""}</span>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="auth-email">Email</label>
                  <input id="auth-email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
                  <span className="hint">{errors.email || ""}</span>
                </div>
                <div className="field">
                  <label htmlFor="auth-pass">Password</label>
                  <input
                    id="auth-pass"
                    type="password"
                    value={form.password}
                    onChange={set("password")}
                    placeholder={mode === "signup" ? "8+ characters, letter + number" : "Your password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                  <span className="hint">{errors.password || ""}</span>
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={busy} style={{ marginTop: 6 }}>
                  {busy && <span className="spin" />}
                  {mode === "login" ? "Log in" : "Create account"}
                </button>
              </form>
              <p className="auth-switch">
                {mode === "login" ? "New here? " : "Already have an account? "}
                <button type="button" onClick={switchMode}>
                  {mode === "login" ? "Create an account" : "Log in"}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
