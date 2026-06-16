import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./auth-local";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router } from "./_core/trpc";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
  loginLocal: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Banco de dados indisponível",
          });
        }

        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (!userResult.length) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha inválidos",
          });
        }

        const user = userResult[0];

        if (!user.passwordHash) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha inválidos",
          });
        }

        const isPasswordValid = verifyPassword(input.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha inválidos",
          });
        }

        // Criar sessão
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const sessionData = JSON.stringify({
          userId: user.id,
          role: user.role,
        });

        ctx.res.cookie(COOKIE_NAME, sessionData, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            role: user.role,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Auth] Login error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao fazer login",
        });
      }
    }),
});
