import { createApp } from "../server/src/app.js";
import { connectDB } from "../server/src/lib/db.js";

const app = createApp();

// Vercel serverless entry: connect lazily, then serve.
let ready = null;
async function ensureReady() {
  if (!ready) ready = connectDB(process.env.MONGO_URI);
  await ready;
}

export default async function handler(req, res) {
  try {
    await ensureReady();
  } catch (err) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Database unavailable. Please try again in a moment.",
    });
  }
  return app(req, res);
}
