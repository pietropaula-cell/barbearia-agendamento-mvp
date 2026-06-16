import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { createContext } from "../server/_core/context";
import { appRouter } from "../server/routers";
import { VercelRequest, VercelResponse } from "@vercel/node";

const handler = createHTTPHandler({
  router: appRouter,
  createContext,
});

export default async (req: VercelRequest, res: VercelResponse) => {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    await handler(
      {
        method: req.method as any,
        headers: req.headers,
        body: req.body,
        query: req.query,
        cookies: req.cookies,
      },
      res
    );
  } catch (error) {
    console.error("tRPC error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
