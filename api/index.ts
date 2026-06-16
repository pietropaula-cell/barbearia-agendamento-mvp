import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir arquivos estáticos do frontend
const publicDir = join(__dirname, "../dist/public");
app.use(express.static(publicDir));

// tRPC middleware
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(join(publicDir, "index.html"));
});

export default app;
