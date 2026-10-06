const BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "taskflow.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Thin JSON client: throws ApiError with the server's friendly message. */
async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    throw new ApiError(
      (data && data.message) || `Request failed (${res.status}). Please try again.`,
      res.status,
      data && data.details
    );
  }
  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/auth/me"),
  listTasks: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "" && v !== "all") qs.set(k, v);
    }
    const q = qs.toString();
    return request(`/tasks${q ? `?${q}` : ""}`);
  },
  createTask: (payload) => request("/tasks", { method: "POST", body: payload }),
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: "PUT", body: payload }),
  setStatus: (id, status) => request(`/tasks/${id}/status`, { method: "PATCH", body: { status } }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};

