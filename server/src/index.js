import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./lib/db.js";

const PORT = parseInt(process.env.PORT, 10) || 5000;

async function main() {
  await connectDB(process.env.MONGO_URI);
  console.log("✓ MongoDB connected");
  const app = createApp();
  app.listen(PORT, () => console.log(`✓ TaskFlow API listening on http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error("✗ Failed to start server:", err.message);
  process.exit(1);
});
