import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  smallint,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  role: mysqlEnum("role", ["user", "admin", "owner", "barber"]).default("user").notNull(),
  barbershopId: int("barbershopId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Barbershops ──────────────────────────────────────────────────────────────
export const barbershops = mysqlTable("barbershops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: varchar("address", { length: 255 }),
  description: text("description"),
  ownerId: int("ownerId"),
  logoUrl: varchar("logoUrl", { length: 255 }),
  accentColor: varchar("accentColor", { length: 7 }).default("#C9A84C"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Barbershop = typeof barbershops.$inferSelect;
export type InsertBarbershop = typeof barbershops.$inferInsert;

// ─── Barbers ──────────────────────────────────────────────────────────────────
export const barbers = mysqlTable("barbers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  barbershopId: int("barbershopId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  bio: text("bio"),
  avatarUrl: varchar("avatarUrl", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = typeof barbers.$inferInsert;

// ─── Barber Schedules ─────────────────────────────────────────────────────────
// dayOfWeek: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
export const barberSchedules = mysqlTable("barber_schedules", {
  id: int("id").autoincrement().primaryKey(),
  barberId: int("barberId").notNull(),
  dayOfWeek: smallint("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
});

export type BarberSchedule = typeof barberSchedules.$inferSelect;
export type InsertBarberSchedule = typeof barberSchedules.$inferInsert;

// ─── Services ─────────────────────────────────────────────────────────────────
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  barbershopId: int("barbershopId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  durationMin: smallint("durationMin").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  barbershopId: int("barbershopId").notNull(),
  barberId: int("barberId").notNull(),
  serviceId: int("serviceId"),
  customerId: int("customerId"),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "blocked"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;