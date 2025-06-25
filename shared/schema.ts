import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  flatNumber: varchar("flat_number", { length: 10 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("resident"), // 'admin', 'resident', 'watchman'
  residentType: varchar("resident_type", { length: 20 }).default("owner"), // 'owner', 'tenant'
  flatStatus: varchar("flat_status", { length: 20 }).default("occupied"), // 'occupied', 'vacant'
  email: varchar("email", { length: 100 }),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  moveInDate: timestamp("move_in_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  flatNumber: varchar("flat_number", { length: 10 }).notNull(),
  residentId: integer("resident_id").references(() => users.id),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM format
  
  // Water meter readings
  previousReading: integer("previous_reading").default(0),
  currentReading: integer("current_reading").default(0),
  waterUsage: integer("water_usage").default(0),
  
  // Charge breakdown
  maintenanceCharges: decimal("maintenance_charges", { precision: 10, scale: 2 }).default("0"),
  waterCharges: decimal("water_charges", { precision: 10, scale: 2 }).default("0"),
  electricityCharges: decimal("electricity_charges", { precision: 10, scale: 2 }).default("0"),
  otherCharges: decimal("other_charges", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  presentDues: decimal("present_dues", { precision: 10, scale: 2 }).notNull(),
  
  // Status and dates
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'paid', 'pending', 'overdue', 'partially_cleared'
  dueDate: timestamp("due_date").notNull(),
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

export const billingFields = pgTable("billing_fields", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'fixed', 'variable', 'calculated'
  category: varchar("category", { length: 50 }).notNull(), // 'water', 'maintenance', 'charges', 'dues'
  defaultValue: decimal("default_value", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  description: text("description"),
  formula: text("formula"), // For calculated fields
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const billItems = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").references(() => bills.id, { onDelete: "cascade" }).notNull(),
  fieldId: integer("field_id").references(() => billingFields.id).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
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

export const insertBillingFieldSchema = createInsertSchema(billingFields).omit({
  id: true,
  createdAt: true,
});

export const insertBillItemSchema = createInsertSchema(billItems).omit({
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

export type BillingField = typeof billingFields.$inferSelect;
export type InsertBillingField = z.infer<typeof insertBillingFieldSchema>;

export type BillItem = typeof billItems.$inferSelect;
export type InsertBillItem = z.infer<typeof insertBillItemSchema>;
