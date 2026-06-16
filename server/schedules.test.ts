import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { barberSchedules, appointments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(barbershopId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "local",
    role: "admin",
    barbershopId,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

let testBarberId = 0;
let testBarbershopId = 0;

describe("barbers.setSchedules with break times", () => {

  beforeAll(async () => {
    // Create test data
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // For this test, we'll use hardcoded IDs that should exist
    // In a real scenario, you'd create test data first
    testBarberId = 1;
    testBarbershopId = 1;
  });

  afterAll(async () => {
    // Clean up test data
    const db = await getDb();
    if (!db) return;
    
    try {
      await db.delete(barberSchedules).where(eq(barberSchedules.barberId, testBarberId));
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should save barber schedules with break times", async () => {
    const ctx = createAdminContext(testBarbershopId);
    const caller = appRouter.createCaller(ctx);

    const schedules = [
      {
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "18:00",
        breakStartTime: "12:00",
        breakEndTime: "13:00",
      },
      {
        dayOfWeek: 2, // Tuesday
        startTime: "09:00",
        endTime: "18:00",
        breakStartTime: "12:30",
        breakEndTime: "13:30",
      },
    ];

    const result = await caller.barbers.setSchedules({
      barberId: testBarberId,
      schedules,
    });

    expect(result).toEqual({ success: true });

    // Verify the data was saved
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const savedSchedules = await db
      .select()
      .from(barberSchedules)
      .where(eq(barberSchedules.barberId, testBarberId));

    expect(savedSchedules).toHaveLength(2);
    
    const monday = savedSchedules.find(s => s.dayOfWeek === 1);
    expect(monday).toBeDefined();
    expect(monday?.breakStartTime).toBe("12:00");
    expect(monday?.breakEndTime).toBe("13:00");

    const tuesday = savedSchedules.find(s => s.dayOfWeek === 2);
    expect(tuesday).toBeDefined();
    expect(tuesday?.breakStartTime).toBe("12:30");
    expect(tuesday?.breakEndTime).toBe("13:30");
  });

  it("should save barber schedules without break times", async () => {
    const ctx = createAdminContext(testBarbershopId);
    const caller = appRouter.createCaller(ctx);

    const schedules = [
      {
        dayOfWeek: 3, // Wednesday
        startTime: "09:00",
        endTime: "18:00",
      },
    ];

    const result = await caller.barbers.setSchedules({
      barberId: testBarberId,
      schedules,
    });

    expect(result).toEqual({ success: true });

    // Verify the data was saved
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const savedSchedules = await db
      .select()
      .from(barberSchedules)
      .where(eq(barberSchedules.barberId, testBarberId));

    expect(savedSchedules).toHaveLength(1);
    
    const wednesday = savedSchedules[0];
    expect(wednesday?.breakStartTime).toBeNull();
    expect(wednesday?.breakEndTime).toBeNull();
  });
});

