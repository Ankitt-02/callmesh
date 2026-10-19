import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";

// Load environment variables from .env file if available
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend/.env")
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // Ignore parse/read error and continue
    }
  }
}

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 8000);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.get("/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? "healthy" : "unhealthy",
    database: isConnected ? "connected" : "disconnected"
  });
});

app.use("/api/v1/users", userRoutes);

const start = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("FATAL: MONGODB_URI environment variable is missing.");
    process.exit(1);
  }

  try {
    const connectionDb = await mongoose.connect(mongoUri);
    console.log(`MONGO Connected DB Host: ${connectionDb.connection.host}`);
  } catch (err) {
    console.error(`FATAL: MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  const port = app.get("port");
  server.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
};

const handleShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await mongoose.connection.close();
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

start();
