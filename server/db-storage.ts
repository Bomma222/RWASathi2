import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  bills,
  complaints,
  notices,
  activities,
  billingFields,
  billItems,
  type User,
  type InsertUser,
  type Bill,
  type InsertBill,
  type Complaint,
  type InsertComplaint,
  type Notice,
  type InsertNotice,
  type Activity,
  type InsertActivity,
  type BillingField,
  type InsertBillingField,
  type BillItem,
  type InsertBillItem,
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllResidents(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Bills
  async getBill(id: number): Promise<Bill | undefined> {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    return bill || undefined;
  }

  async getBillsByFlat(flatNumber: string): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.flatNumber, flatNumber));
  }

  async getBillsByMonth(month: string): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.month, month));
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const [bill] = await db.insert(bills).values(insertBill).returning();
    return bill;
  }

  async updateBillStatus(id: number, status: string, paidAt?: Date): Promise<Bill | undefined> {
    const updates: { status: string; paidAt?: Date } = { status };
    
    const [bill] = await db
      .update(bills)
      .set(updates)
      .where(eq(bills.id, id))
      .returning();
    return bill || undefined;
  }

  async getPendingBills(): Promise<Bill[]> {
    return await db.select().from(bills).where(eq(bills.status, 'pending'));
  }

  // Complaints
  async getComplaint(id: number): Promise<Complaint | undefined> {
    const [complaint] = await db.select().from(complaints).where(eq(complaints.id, id));
    return complaint || undefined;
  }

  async getComplaintsByResident(residentId: number): Promise<Complaint[]> {
    return await db.select().from(complaints).where(eq(complaints.residentId, residentId));
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  }

  async createComplaint(insertComplaint: InsertComplaint): Promise<Complaint> {
    const [complaint] = await db.insert(complaints).values(insertComplaint).returning();
    return complaint;
  }

  async updateComplaintStatus(id: number, status: string, resolvedAt?: Date): Promise<Complaint | undefined> {
    const updates: { status: string; resolvedAt?: Date } = { status };
    
    const [complaint] = await db
      .update(complaints)
      .set(updates)
      .where(eq(complaints.id, id))
      .returning();
    return complaint || undefined;
  }

  // Notices
  async getNotice(id: number): Promise<Notice | undefined> {
    const [notice] = await db.select().from(notices).where(eq(notices.id, id));
    return notice || undefined;
  }

  async getAllNotices(): Promise<Notice[]> {
    return await db.select().from(notices).orderBy(desc(notices.createdAt));
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const [notice] = await db.insert(notices).values(insertNotice).returning();
    return notice;
  }

  // Activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Billing Fields
  async getBillingFields(): Promise<BillingField[]> {
    return await db
      .select()
      .from(billingFields)
      .orderBy(billingFields.sortOrder);
  }

  async createBillingField(insertField: InsertBillingField): Promise<BillingField> {
    const [field] = await db.insert(billingFields).values(insertField).returning();
    return field;
  }

  async updateBillingField(id: number, updates: Partial<InsertBillingField>): Promise<BillingField | undefined> {
    const [field] = await db
      .update(billingFields)
      .set(updates)
      .where(eq(billingFields.id, id))
      .returning();
    return field || undefined;
  }

  async deleteBillingField(id: number): Promise<boolean> {
    const result = await db.delete(billingFields).where(eq(billingFields.id, id));
    return ((result as { rowCount?: number }).rowCount ?? 0) > 0;
  }

  // Bill Items
  async getBillItems(billId: number): Promise<BillItem[]> {
    return await db.select().from(billItems).where(eq(billItems.billId, billId));
  }

  async createBillItem(insertItem: InsertBillItem): Promise<BillItem> {
    const [item] = await db.insert(billItems).values(insertItem).returning();
    return item;
  }

  // -------------------------------------------------------------
  // Additional interface methods required by IStorage
  // -------------------------------------------------------------

  async updateComplaint(
    id: number,
    updates: Partial<InsertComplaint>,
  ): Promise<Complaint | undefined> {
    const [complaint] = await db
      .update(complaints)
      .set(updates)
      .where(eq(complaints.id, id))
      .returning();
    return complaint || undefined;
  }

  async updateNotice(
    id: number,
    updates: Partial<InsertNotice>,
  ): Promise<Notice | undefined> {
    const [notice] = await db
      .update(notices)
      .set(updates)
      .where(eq(notices.id, id))
      .returning();
    return notice || undefined;
  }

  async deleteNotice(id: number): Promise<boolean> {
    const result = await db.delete(notices).where(eq(notices.id, id));
    return ((result as { rowCount?: number }).rowCount ?? 0) > 0;
  }
}