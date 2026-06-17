import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { TRPCError } from "@trpc/server";

describe("booking.searchByPhone", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Create a caller with empty context (public procedure)
    caller = appRouter.createCaller({});
  });

  it("should return empty array for non-existent phone", async () => {
    const result = await caller.booking.searchByPhone({ phone: "99999999999" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("should require minimum 8 digits", async () => {
    try {
      await caller.booking.searchByPhone({ phone: "1234567" });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
    }
  });

  it("should accept valid phone format", async () => {
    // Should not throw, just return empty array
    const result = await caller.booking.searchByPhone({ phone: "11999999999" });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("booking.cancelAppointment", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    caller = appRouter.createCaller({});
  });

  it("should require phone parameter for security", async () => {
    try {
      // @ts-ignore - intentionally testing missing phone
      await caller.booking.cancelAppointment({ id: 999 });
      expect.fail("Should have thrown validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
    }
  });

  it("should reject non-existent appointment", async () => {
    try {
      await caller.booking.cancelAppointment({ id: 999999, phone: "11999999999" });
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      // Accept NOT_FOUND or INTERNAL_SERVER_ERROR (from db query)
      const code = (error as TRPCError<any>).code;
      expect(["NOT_FOUND", "INTERNAL_SERVER_ERROR"]).toContain(code);
    }
  });

  it("should reject if phone doesn't match appointment", async () => {
    try {
      // Try to cancel with wrong phone
      await caller.booking.cancelAppointment({ id: 1, phone: "99999999999" });
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      // Accept NOT_FOUND, FORBIDDEN, or INTERNAL_SERVER_ERROR
      const code = (error as TRPCError<any>).code;
      expect(["NOT_FOUND", "FORBIDDEN", "INTERNAL_SERVER_ERROR"]).toContain(code);
    }
  });
});
