import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 15 }).notNull().unique(),
  name: text("name").notNull(),
  flatNumber: varchar("flat_number", { length: 10 }).notNull(),
  tower: varchar("tower", { length: 5 }),
  role: varchar("role", { length: 20 }).notNull().default("resident"), // 'admin' or 'resident'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  flatNumber: varchar("flat_number", { length: 10 }).notNull(),
  residentId: integer("resident_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("unpaid"), // 'paid', 'unpaid', 'overdue'
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => users.id),
  flatNumber: varchar("flat_number", { length: 10 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  photoUrl: text("photo_url"),
  status: varchar("status", { length: 20 }).notNull().default("open"), // 'open', 'in_progress', 'resolved'
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // 'low', 'medium', 'high'
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  adminId: integer("admin_id").notNull().references(() => users.id),
  isImportant: boolean("is_important").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'payment', 'complaint', 'notice', etc.
  title: text("title").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
