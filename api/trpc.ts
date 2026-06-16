import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// tRPC middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error }) {
      console.error("tRPC error:", error);
    },
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
