import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express, { Request, Response } from "express";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// tRPC middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
