import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: request,
      router: appRouter,
      createContext: async () => {
        // Parse cookies from request
        const cookieHeader = request.headers.get("cookie") || "";
        const cookies: Record<string, string> = {};
        
        cookieHeader.split(";").forEach((cookie) => {
          const [key, value] = cookie.split("=");
          if (key && value) {
            cookies[key.trim()] = decodeURIComponent(value.trim());
          }
        });

        return createContext({
          req: {
            headers: request.headers,
            cookies,
          } as any,
          res: {} as any,
        });
      },
    });
  } catch (error) {
    console.error("tRPC error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
