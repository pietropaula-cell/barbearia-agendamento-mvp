import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      barbershopId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    } as any,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Booking router (public) ───────────────────────────────────────────────────

describe("booking.getBarbershop", () => {
  it("throws NOT_FOUND for unknown slug", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.booking.getBarbershop({ slug: "slug-that-does-not-exist-xyz" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("booking.getAvailableSlots", () => {
  it("returns empty array for barber with no schedules", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    // barberId 99999 doesn't exist → no schedules → no slots
    const slots = await caller.booking.getAvailableSlots({
      barberId: 99999,
      date: "2025-01-06", // Monday
      durationMin: 30,
    });
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBe(0);
  });
});

describe("booking.getAvailableDates", () => {
  it("returns empty array for barber with no schedules", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const dates = await caller.booking.getAvailableDates({
      barberId: 99999,
      month: "2025-01",
      durationMin: 30,
    });
    expect(Array.isArray(dates)).toBe(true);
    expect(dates.length).toBe(0);
  });
});

// ── Auth router ───────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns user when authenticated", async () => {
    const ctx = makeCtx({ name: "Alice" });
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me?.name).toBe("Alice");
  });

  it("returns null when not authenticated", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

// ── RBAC: barbershops router ──────────────────────────────────────────────────

describe("barbershops.create — RBAC", () => {
  it("throws FORBIDDEN for non-admin user", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.barbershops.create({ name: "Test", slug: "test-slug" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws FORBIDDEN for barber role", async () => {
    const ctx = makeCtx({ role: "barber" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.barbershops.create({ name: "Test", slug: "test-slug" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("barbershops.delete — RBAC", () => {
  it("throws FORBIDDEN for owner role", async () => {
    const ctx = makeCtx({ role: "owner", barbershopId: 1 });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.barbershops.delete({ id: 999 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ── RBAC: adminUsers router ───────────────────────────────────────────────────

describe("adminUsers.list — RBAC", () => {
  it("throws FORBIDDEN for non-admin", async () => {
    const ctx = makeCtx({ role: "owner" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.adminUsers.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("adminUsers.updateRole — RBAC", () => {
  it("throws FORBIDDEN for non-admin", async () => {
    const ctx = makeCtx({ role: "barber" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.adminUsers.updateRole({ userId: 2, role: "owner", barbershopId: null })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ── RBAC: services router ─────────────────────────────────────────────────────

describe("services.create — RBAC", () => {
  it("throws FORBIDDEN for user role", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.services.create({ barbershopId: 1, name: "Corte", durationMin: 30, price: "25.00" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ── Appointment status transitions ────────────────────────────────────────────

describe("appointments.updateStatus — RBAC", () => {
  it("throws FORBIDDEN for unauthenticated (user role)", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.appointments.updateStatus({ id: 999, status: "confirmed" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

// ── Branding router ──────────────────────────────────────────────────────────

describe("branding.updateAccentColor — RBAC", () => {
  it("throws FORBIDDEN for barber role", async () => {
    const ctx = makeCtx({ role: "barber" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.branding.updateAccentColor({ barbershopId: 1, accentColor: "#FF5733" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws error for invalid hex color", async () => {
    const ctx = makeCtx({ role: "owner", barbershopId: 1 });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.branding.updateAccentColor({ barbershopId: 1, accentColor: "invalid" })
    ).rejects.toThrow();
  });
});

describe("branding.uploadLogo — RBAC", () => {
  it("throws FORBIDDEN for user role", async () => {
    const ctx = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.branding.uploadLogo({ barbershopId: 1, base64: "iVBORw0KGgo=" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
