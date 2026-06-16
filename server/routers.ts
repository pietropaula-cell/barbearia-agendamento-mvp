import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateRandomPassword, hashPassword } from "./auth-local";
import { authRouter } from "./auth-router";
import {
  createAppointment,
  createBarber,
  createBarbershop,
  createService,
  createUser,
  deleteBarber,
  deleteBarbershop,
  deleteService,
  deleteUser,
  getAllBarbershops,
  getAllUsers,
  getAppointmentById,
  getAppointmentsByBarber,
  getAppointmentsByBarbershop,
  getBarberById,
  getBarberSlotsOnDate,
  getBarbersByBarbershop,
  getBarbershopById,
  getBarbershopBySlug,
  getSchedulesByBarber,
  getServiceById,
  getServicesByBarbershop,
  hasConflict,
  setBarberSchedules,
  updateAppointmentStatus,
  updateBarber,
  updateBarbershop,
  updateService,
  updateUserRole,
  upsertCustomer,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

function requireRole(userRole: string | undefined, allowed: string[]): void {
  if (!userRole || !allowed.includes(userRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso não autorizado." });
  }
}

function requireBarbershopAccess(
  userRole: string | undefined,
  userBarbershopId: number | null | undefined,
  targetBarbershopId: number
): void {
  if (userRole === "admin") return;
  if (userRole === "owner" && userBarbershopId === targetBarbershopId) return;
  throw new TRPCError({ code: "FORBIDDEN", message: "Acesso não autorizado a esta barbearia." });
}

async function getAvailableSlots(
  barberId: number,
  dateStr: string,
  durationMin: number
): Promise<string[]> {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay();
  const schedules = await getSchedulesByBarber(barberId);
  const schedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);
  if (!schedule) return [];
  const bookedSlots = await getBarberSlotsOnDate(barberId, date);
  const slots: string[] = [];
  const [startH, startM] = schedule.startTime.split(":").map(Number);
  const [endH, endM] = schedule.endTime.split(":").map(Number);
  const workStart = startH * 60 + startM;
  const workEnd = endH * 60 + endM;
  for (let t = workStart; t + durationMin <= workEnd; t += durationMin) {
    const slotStart = new Date(Date.UTC(year, month - 1, day, Math.floor(t / 60), t % 60));
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60 * 1000);
    const conflict = bookedSlots.some(
      (b) => b.startsAt.getTime() < slotEnd.getTime() && b.endsAt.getTime() > slotStart.getTime()
    );
    if (!conflict) {
      const hh = String(Math.floor(t / 60)).padStart(2, "0");
      const mm = String(t % 60).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  adminUsers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireRole(ctx.user.role, ["admin"]);
      return getAllUsers();
    }),
    delete: protectedProcedure.input(z.object({ userId: z.number() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin"]);
      await deleteUser(input.userId);
      return { success: true };
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().optional(), email: z.string().email().optional(), password: z.string().optional(), role: z.enum(["user", "admin", "owner", "barber"]), barbershopId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin"]);
        if ((input.role === "owner" || input.role === "barber") && !input.barbershopId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Barbearia eh obrigatoria para Dono ou Barbeiro" });
        }
        const user = await createUser(input.name, input.email, input.password, input.role, input.barbershopId);
        return user;
      }),
    updateRole: protectedProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "owner", "barber"]), barbershopId: z.number().nullable().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin"]);
        await updateUserRole(input.userId, input.role, input.barbershopId);
        return { success: true };
      }),
  }),
  barbershops: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      requireRole(ctx.user.role, ["admin", "owner"]);
      if (ctx.user.role === "admin") return getAllBarbershops();
      if (ctx.user.barbershopId) { const b = await getBarbershopById(ctx.user.barbershopId); return b ? [b] : []; }
      return [];
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin", "owner"]);
      const b = await getBarbershopById(input.id);
      if (!b) throw new TRPCError({ code: "NOT_FOUND" });
      requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, b.id);
      return b;
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().min(2), slug: z.string().min(2).regex(/^[a-z0-9-]+$/), phone: z.string().optional(), address: z.string().optional(), description: z.string().optional(), ownerId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin"]);
        const id = await createBarbershop({ ...input, ownerId: input.ownerId ?? ctx.user.id });
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(2).optional(), slug: z.string().min(2).optional(), phone: z.string().optional(), address: z.string().optional(), description: z.string().optional(), logoUrl: z.string().optional(), accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(), active: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        const { id, ...data } = input;
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, id);
        await updateBarbershop(id, data);
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin"]);
      await deleteBarbershop(input.id);
      return { success: true };
    }),
    toggleStatus: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin", "owner"]);
      const barbershop = await getBarbershopById(input.id);
      if (!barbershop) throw new TRPCError({ code: "NOT_FOUND" });
      requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.id);
      await updateBarbershop(input.id, { active: !barbershop.active });
      return { success: true };
    }),
  }),
  barbers: router({
    list: protectedProcedure.input(z.object({ barbershopId: z.number() })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin", "owner", "barber"]);
      if (ctx.user.role !== "admin") requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
      return getBarbersByBarbershop(input.barbershopId);
    }),
    create: protectedProcedure
      .input(z.object({ barbershopId: z.number(), name: z.string().min(2), bio: z.string().optional(), avatarUrl: z.string().optional(), userId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
        const id = await createBarber(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(2).optional(), bio: z.string().optional(), avatarUrl: z.string().optional(), active: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        const barber = await getBarberById(input.id);
        if (!barber) throw new TRPCError({ code: "NOT_FOUND" });
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, barber.barbershopId);
        const { id, ...data } = input;
        await updateBarber(id, data);
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin", "owner"]);
      const barber = await getBarberById(input.id);
      if (!barber) throw new TRPCError({ code: "NOT_FOUND" });
      requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, barber.barbershopId);
      await deleteBarber(input.id);
      return { success: true };
    }),
    getSchedules: protectedProcedure.input(z.object({ barberId: z.number() })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin", "owner", "barber"]);
      return getSchedulesByBarber(input.barberId);
    }),
    setSchedules: protectedProcedure
      .input(z.object({ barberId: z.number(), schedules: z.array(z.object({ dayOfWeek: z.number().min(0).max(6), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/) })) }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        const barber = await getBarberById(input.barberId);
        if (!barber) throw new TRPCError({ code: "NOT_FOUND" });
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, barber.barbershopId);
        await setBarberSchedules(input.barberId, input.schedules);
        return { success: true };
      }),
  }),
  services: router({
    list: protectedProcedure.input(z.object({ barbershopId: z.number() })).query(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin", "owner", "barber"]);
      if (ctx.user.role !== "admin") requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
      return getServicesByBarbershop(input.barbershopId);
    }),
    create: protectedProcedure
      .input(z.object({ barbershopId: z.number(), name: z.string().min(2), description: z.string().optional(), durationMin: z.number().min(5).max(480), price: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
        const id = await createService(input);
        return { id };
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().min(2).optional(), description: z.string().optional(), durationMin: z.number().min(5).max(480).optional(), price: z.string().optional(), active: z.boolean().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        const service = await getServiceById(input.id);
        if (!service) throw new TRPCError({ code: "NOT_FOUND" });
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, service.barbershopId);
        const { id, ...data } = input;
        await updateService(id, data);
        return { success: true };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      requireRole(ctx.user.role, ["admin", "owner"]);
      const service = await getServiceById(input.id);
      if (!service) throw new TRPCError({ code: "NOT_FOUND" });
      requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, service.barbershopId);
      await deleteService(input.id);
      return { success: true };
    }),
  }),
  appointments: router({
    listByBarbershop: protectedProcedure
      .input(z.object({ barbershopId: z.number(), from: z.date().optional(), to: z.date().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        if (ctx.user.role !== "admin") requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
        return getAppointmentsByBarbershop(input.barbershopId, input.from, input.to);
      }),
    listMine: protectedProcedure
      .input(z.object({ barberId: z.number(), from: z.date().optional(), to: z.date().optional() }))
      .query(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner", "barber"]);
        return getAppointmentsByBarber(input.barberId, input.from, input.to);
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "confirmed", "cancelled", "blocked"]) }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner", "barber"]);
        await updateAppointmentStatus(input.id, input.status);
        return { success: true };
      }),
    blockSlot: protectedProcedure
      .input(z.object({ barberId: z.number(), barbershopId: z.number(), startsAt: z.date(), endsAt: z.date(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner", "barber"]);
        const conflict = await hasConflict(input.barberId, input.startsAt, input.endsAt);
        if (conflict) throw new TRPCError({ code: "CONFLICT", message: "Horário já ocupado." });
        const id = await createAppointment({ ...input, status: "blocked" });
        return { id };
      }),
  }),
  booking: router({
    getBarbershop: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const b = await getBarbershopBySlug(input.slug);
      if (!b) throw new TRPCError({ code: "NOT_FOUND", message: "Barbearia não encontrada." });
      return b;
    }),
    getBarbers: publicProcedure.input(z.object({ barbershopId: z.number() })).query(async ({ input }) => {
      return getBarbersByBarbershop(input.barbershopId);
    }),
    getServices: publicProcedure.input(z.object({ barbershopId: z.number() })).query(async ({ input }) => {
      return getServicesByBarbershop(input.barbershopId);
    }),
    getAvailableDates: publicProcedure
      .input(z.object({ barberId: z.number(), month: z.string().regex(/^\d{4}-\d{2}$/), durationMin: z.number() }))
      .query(async ({ input }) => {
        const schedules = await getSchedulesByBarber(input.barberId);
        const workDays = new Set(schedules.map((s) => s.dayOfWeek));
        const [year, month] = input.month.split("-").map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const availableDates: string[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(Date.UTC(year, month - 1, d));
          if (date < today) continue;
          if (!workDays.has(date.getUTCDay())) continue;
          const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const slots = await getAvailableSlots(input.barberId, ds, input.durationMin);
          if (slots.length > 0) availableDates.push(ds);
        }
        return availableDates;
      }),
    getAvailableSlots: publicProcedure
      .input(z.object({ barberId: z.number(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), durationMin: z.number() }))
      .query(async ({ input }) => {
        return getAvailableSlots(input.barberId, input.date, input.durationMin);
      }),
    createAppointment: publicProcedure
      .input(z.object({ barbershopId: z.number(), barberId: z.number(), serviceId: z.number(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), customerName: z.string().min(2), customerPhone: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const service = await getServiceById(input.serviceId);
        if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });
        const [year, month, day] = input.date.split("-").map(Number);
        const [hour, minute] = input.time.split(":").map(Number);
        const startsAt = new Date(Date.UTC(year, month - 1, day, hour, minute));
        const endsAt = new Date(startsAt.getTime() + Number(service.durationMin) * 60 * 1000);
        const conflict = await hasConflict(input.barberId, startsAt, endsAt);
        if (conflict) throw new TRPCError({ code: "CONFLICT", message: "Horário não disponível. Por favor, escolha outro horário." });
        const customer = await upsertCustomer({ name: input.customerName, phone: input.customerPhone });
        const id = await createAppointment({ barbershopId: input.barbershopId, barberId: input.barberId, serviceId: input.serviceId, customerId: customer.id, startsAt, endsAt, status: "pending" });
        return { id, startsAt, endsAt, service: { name: service.name, price: service.price, durationMin: service.durationMin }, customer: { name: customer.name, phone: customer.phone } };
      }),
    cancelAppointment: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const appt = await getAppointmentById(input.id);
      if (!appt) throw new TRPCError({ code: "NOT_FOUND" });
      if (appt.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "Agendamento já cancelado." });
      await updateAppointmentStatus(input.id, "cancelled");
      return { success: true };
    }),
    getAllBarbershops: publicProcedure.query(async () => {
      const all = await getAllBarbershops();
      return all.filter((b) => b.active);
    }),
  }),

  // Branding procedures (upload logo, update accent color)
  branding: router({
    uploadLogo: protectedProcedure
      .input(z.object({ barbershopId: z.number(), base64: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        const shop = await getBarbershopById(input.barbershopId);
        if (!shop) throw new TRPCError({ code: "NOT_FOUND" });
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
        
        // Decode base64 and upload to S3
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(`barbershops/${input.barbershopId}/logo.png`, buffer, "image/png");
        
        await updateBarbershop(input.barbershopId, { logoUrl: url });
        return { url };
      }),
    uploadFacade: protectedProcedure
      .input(z.object({ barbershopId: z.number(), base64: z.string() }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        const shop = await getBarbershopById(input.barbershopId);
        if (!shop) throw new TRPCError({ code: "NOT_FOUND" });
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
        
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(`barbershops/${input.barbershopId}/facade.png`, buffer, "image/png");
        
        await updateBarbershop(input.barbershopId, { description: url });
        return { url };
      }),
    updateAccentColor: protectedProcedure
      .input(z.object({ barbershopId: z.number(), accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }))
      .mutation(async ({ ctx, input }) => {
        requireRole(ctx.user.role, ["admin", "owner"]);
        const shop = await getBarbershopById(input.barbershopId);
        if (!shop) throw new TRPCError({ code: "NOT_FOUND" });
        requireBarbershopAccess(ctx.user.role, ctx.user.barbershopId, input.barbershopId);
        
        await updateBarbershop(input.barbershopId, { accentColor: input.accentColor });
        return { success: true };
      }),
  }),
  seed: router({
    createTestData: publicProcedure.mutation(async () => {
      // Criar barbearia de teste
      const barbershopId = await createBarbershop({
        name: "Barbearia Premium",
        slug: "barbearia-premium",
        phone: "(11) 98765-4321",
        address: "Rua das Flores, 123 - São Paulo, SP",
        description: "A melhor barbearia da região",
        accentColor: "#C9A84C" as const,
        active: true,
      });

      // Criar usuário owner de teste
      const owner = await createUser(
        "João Silva",
        "joao@barbearia.com",
        "senha123456",
        "owner",
        barbershopId
      );

      // Criar barbeiros
      const barber1 = await createBarber({
        barbershopId: barbershopId,
        name: "Carlos",
        bio: "Corte Clássico",
        active: true,
      });

      const barber2 = await createBarber({
        barbershopId: barbershopId,
        name: "Roberto",
        bio: "Barba e Corte",
        active: true,
      });

      const barber3 = await createBarber({
        barbershopId: barbershopId,
        name: "Felipe",
        bio: "Design de Sobrancelha",
        active: true,
      });

      // Criar serviços
      const service1Id = await createService({
        barbershopId: barbershopId,
        name: "Corte Clássico",
        durationMin: 30,
        price: "50.00",
        active: true,
      });

      const service2Id = await createService({
        barbershopId: barbershopId,
        name: "Corte + Barba",
        durationMin: 45,
        price: "80.00",
        active: true,
      });

      const service3Id = await createService({
        barbershopId: barbershopId,
        name: "Barba",
        durationMin: 20,
        price: "40.00",
        active: true,
      });

      const service4Id = await createService({
        barbershopId: barbershopId,
        name: "Hidratação",
        durationMin: 40,
        price: "60.00",
        active: true,
      });

      return {
        success: true,
        data: {
          barbershop: { id: barbershopId, name: "Barbearia Premium", slug: "barbearia-premium" },
          owner: { id: owner.id, name: owner.name, email: owner.email, role: owner.role || "owner" },
          barbers: [
            { id: barber1, name: "Carlos" },
            { id: barber2, name: "Roberto" },
            { id: barber3, name: "Felipe" },
          ],
          services: [
            { id: service1Id, name: "Corte Clássico", price: 50.0 },
            { id: service2Id, name: "Corte + Barba", price: 80.0 },
            { id: service3Id, name: "Barba", price: 40.0 },
            { id: service4Id, name: "Hidratação", price: 60.0 },
          ],
          message: `Dados de teste criados! Faça login com email: joao@barbearia.com`,
        },
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
// Deploy trigger: 1781645769
