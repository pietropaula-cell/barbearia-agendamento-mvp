import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
