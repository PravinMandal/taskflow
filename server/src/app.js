import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(morgan("tiny"));

  const clientUrl = process.env.CLIENT_URL || "*";
  app.use(cors({ origin: clientUrl === "*" ? "*" : clientUrl.split(","), credentials: true }));
  app.use(express.json({ limit: "100kb" }));

  // Generous but real rate limits (relaxed in dev)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 300 : 2000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too Many Requests", message: "Slow down a little. Too many requests, try again soon." },
  });
  app.use("/api/", limiter);

  app.get("/api/health", (_req, res) => res.json({ ok: true, service: "taskflow", time: new Date().toISOString() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);

  app.use("/api/", notFound);
  app.use(errorHandler);
  return app;
}
