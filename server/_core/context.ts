import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Try local authentication first (check for session cookie with userId)
    const cookies = parseCookies(opts.req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie as string);
        if (session.userId) {
          // Local authentication - get user from database
          const db = await getDb();
          if (db) {
            const dbUser = await db
              .select()
              .from(users)
              .where(eq(users.id, session.userId))
              .limit(1);
            if (dbUser.length > 0) {
              user = dbUser[0];
            }
          }
        }
      } catch (e) {
        // Session cookie is not valid JSON, try OAuth
      }
    }
    
    // If local auth failed, try OAuth
    if (!user) {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
