import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./server/_core/context";
import { appRouter } from "./server/routers";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// CORS
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.header("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Storage proxy for /manus-storage/* paths
app.use("/manus-storage", async (req, res) => {
  const key = req.url?.replace(/^\/?/, "");
  if (!key) {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Missing storage key");
    return;
  }

  const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
  const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;

  if (!forgeBaseUrl || !forgeKey) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Storage proxy not configured");
    return;
  }

  try {
    const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
    forgeUrl.searchParams.set("path", key);

    const forgeResp = await fetch(forgeUrl, {
      headers: { Authorization: `Bearer ${forgeKey}` },
    });

    if (!forgeResp.ok) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Storage backend error");
      return;
    }

    const { url } = (await forgeResp.json()) as { url: string };
    if (!url) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Empty signed URL");
      return;
    }

    res.writeHead(307, { Location: url, "Cache-Control": "no-store" });
    res.end();
  } catch {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Storage proxy error");
  }
});

// tRPC endpoint
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

// Serve static frontend files from dist/public directory
const distPath = path.join(__dirname, "dist", "public");
app.use(express.static(distPath));

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Express error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Fallback to index.html for SPA routing (must be after error handler)
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Frontend not built. Run 'pnpm build' first." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 tRPC endpoint: http://localhost:${PORT}/api/trpc`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});
