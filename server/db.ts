import { and, eq, gte, lte, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Appointment,
  Barber,
  BarberSchedule,
  Barbershop,
  Customer,
  InsertAppointment,
  InsertBarber,
  InsertBarberSchedule,
  InsertBarbershop,
  InsertCustomer,
  InsertService,
  InsertUser,
  Service,
  User,
  appointments,
  barberSchedules,
  barbers,
  barbershops,
  customers,
  services,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.createdAt);
}

export async function createUser(
  name: string | undefined,
  email: string | undefined,
  role: User["role"],
  barbershopId?: number | null
): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Gerar um openId único para o novo usuário
  const openId = `admin-created-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const values: InsertUser = {
    openId,
    name: name ?? null,
    email: email ?? null,
    role,
    barbershopId: barbershopId ?? null,
  };
  
  await db.insert(users).values(values);
  
  // Buscar o usuário criado pelo openId
  const created = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (!created[0]) throw new Error("Failed to create user");
  return created[0];
}

export async function updateUserRole(
  userId: number,
  role: User["role"],
  barbershopId?: number | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role, barbershopId: barbershopId ?? null }).where(eq(users.id, userId));
}

// ─── Barbershops ──────────────────────────────────────────────────────────────

export async function getAllBarbershops(): Promise<Barbershop[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(barbershops).orderBy(barbershops.name);
}

export async function getBarbershopById(id: number): Promise<Barbershop | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(barbershops).where(eq(barbershops.id, id)).limit(1);
  return result[0];
}

export async function getBarbershopBySlug(slug: string): Promise<Barbershop | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(barbershops)
    .where(and(eq(barbershops.slug, slug), eq(barbershops.active, true)))
    .limit(1);
  return result[0];
}

export async function createBarbershop(data: InsertBarbershop): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(barbershops).values(data);
  return Number((result as any)[0]?.insertId ?? 0);
}

export async function updateBarbershop(id: number, data: Partial<InsertBarbershop>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(barbershops).set(data).where(eq(barbershops.id, id));
}

export async function deleteBarbershop(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(barbershops).set({ active: false }).where(eq(barbershops.id, id));
}

// ─── Barbers ──────────────────────────────────────────────────────────────────

export async function getBarbersByBarbershop(barbershopId: number): Promise<Barber[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(barbers)
    .where(and(eq(barbers.barbershopId, barbershopId), eq(barbers.active, true)))
    .orderBy(barbers.name);
}

export async function getBarberById(id: number): Promise<Barber | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(barbers).where(eq(barbers.id, id)).limit(1);
  return result[0];
}

export async function createBarber(data: InsertBarber): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(barbers).values(data);
  return Number((result as any)[0]?.insertId ?? 0);
}

export async function updateBarber(id: number, data: Partial<InsertBarber>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(barbers).set(data).where(eq(barbers.id, id));
}

export async function deleteBarber(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(barbers).set({ active: false }).where(eq(barbers.id, id));
}

// ─── Barber Schedules ─────────────────────────────────────────────────────────

export async function getSchedulesByBarber(barberId: number): Promise<BarberSchedule[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(barberSchedules)
    .where(eq(barberSchedules.barberId, barberId))
    .orderBy(barberSchedules.dayOfWeek);
}

export async function setBarberSchedules(
  barberId: number,
  schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(barberSchedules).where(eq(barberSchedules.barberId, barberId));
  if (schedules.length > 0) {
    await db.insert(barberSchedules).values(schedules.map((s) => ({ ...s, barberId })));
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getServicesByBarbershop(barbershopId: number): Promise<Service[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(services)
    .where(and(eq(services.barbershopId, barbershopId), eq(services.active, true)))
    .orderBy(services.name);
}

export async function getServiceById(id: number): Promise<Service | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

export async function createService(data: InsertService): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(services).values(data);
  return Number((result as any)[0]?.insertId ?? 0);
}

export async function updateService(id: number, data: Partial<InsertService>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(services).set(data).where(eq(services.id, id));
}

export async function deleteService(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(services).set({ active: false }).where(eq(services.id, id));
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function upsertCustomer(data: InsertCustomer): Promise<Customer> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(customers).where(eq(customers.phone, data.phone)).limit(1);
  if (existing[0]) {
    await db.update(customers).set({ name: data.name }).where(eq(customers.phone, data.phone));
    return { ...existing[0], name: data.name };
  }
  const result = await db.insert(customers).values(data);
  const id = Number((result as any)[0]?.insertId ?? 0);
  return { id, ...data, createdAt: new Date() };
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export async function getAppointmentsByBarbershop(
  barbershopId: number,
  from?: Date,
  to?: Date
): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(appointments.barbershopId, barbershopId)];
  if (from) conditions.push(gte(appointments.startsAt, from));
  if (to) conditions.push(lte(appointments.startsAt, to));
  return db.select().from(appointments).where(and(...conditions)).orderBy(appointments.startsAt);
}

export async function getAppointmentsByBarber(
  barberId: number,
  from?: Date,
  to?: Date
): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [
    eq(appointments.barberId, barberId),
    ne(appointments.status, "cancelled"),
  ];
  if (from) conditions.push(gte(appointments.startsAt, from));
  if (to) conditions.push(lte(appointments.startsAt, to));
  return db.select().from(appointments).where(and(...conditions)).orderBy(appointments.startsAt);
}

export async function getAppointmentById(id: number): Promise<Appointment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result[0];
}

export async function createAppointment(data: InsertAppointment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(appointments).values(data);
  return Number((result as any)[0]?.insertId ?? 0);
}

export async function updateAppointmentStatus(
  id: number,
  status: Appointment["status"]
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(appointments).set({ status }).where(eq(appointments.id, id));
}

export async function hasConflict(
  barberId: number,
  startsAt: Date,
  endsAt: Date,
  excludeId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const conditions: any[] = [
    eq(appointments.barberId, barberId),
    ne(appointments.status, "cancelled"),
    lte(appointments.startsAt, endsAt),
    gte(appointments.endsAt, startsAt),
  ];
  if (excludeId) conditions.push(ne(appointments.id, excludeId));
  const result = await db.select().from(appointments).where(and(...conditions)).limit(1);
  return result.length > 0;
}

export async function getBarberSlotsOnDate(
  barberId: number,
  date: Date
): Promise<Array<{ startsAt: Date; endsAt: Date }>> {
  const db = await getDb();
  if (!db) return [];
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return db
    .select({ startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.barberId, barberId),
        ne(appointments.status, "cancelled"),
        gte(appointments.startsAt, dayStart),
        lte(appointments.startsAt, dayEnd)
      )
    );
}
