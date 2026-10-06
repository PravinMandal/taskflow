import mongoose from "mongoose";

let cached = globalThis.__taskflowMongoose;
if (!cached) cached = globalThis.__taskflowMongoose = { conn: null, promise: null };

/** Connect once per process (cached across Vercel serverless invocations). */
export async function connectDB(uri) {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (!uri) throw new Error("MONGO_URI is not configured");
    cached.promise = mongoose
      .connect(uri, { dbName: "taskflow", serverSelectionTimeoutMS: 8000 })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
