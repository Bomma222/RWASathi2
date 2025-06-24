import { 
  users, bills, complaints, notices, activities,
  type User, type InsertUser,
  type Bill, type InsertBill,
  type Complaint, type InsertComplaint,
  type Notice, type InsertNotice,
  type Activity, type InsertActivity
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllResidents(): Promise<User[]>;
  
  // Bills
  getBill(id: number): Promise<Bill | undefined>;
  getBillsByFlat(flatNumber: string): Promise<Bill[]>;
  getBillsByMonth(month: string): Promise<Bill[]>;
  createBill(bill: InsertBill): Promise<Bill>;
  updateBillStatus(id: number, status: string, paidAt?: Date): Promise<Bill | undefined>;
  getPendingBills(): Promise<Bill[]>;
  
  // Complaints
  getComplaint(id: number): Promise<Complaint | undefined>;
  getComplaintsByResident(residentId: number): Promise<Complaint[]>;
  getAllComplaints(): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaintStatus(id: number, status: string, resolvedAt?: Date): Promise<Complaint | undefined>;
  
  // Notices
  getNotice(id: number): Promise<Notice | undefined>;
  getAllNotices(): Promise<Notice[]>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  
  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bills: Map<number, Bill>;
  private complaints: Map<number, Complaint>;
  private notices: Map<number, Notice>;
  private activities: Map<number, Activity>;
  private currentUserId: number;
  private currentBillId: number;
  private currentComplaintId: number;
  private currentNoticeId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.bills = new Map();
    this.complaints = new Map();
    this.notices = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentBillId = 1;
    this.currentComplaintId = 1;
    this.currentNoticeId = 1;
    this.currentActivityId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phoneNumber === phoneNumber);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllResidents(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  // Bills
  async getBill(id: number): Promise<Bill | undefined> {
    return this.bills.get(id);
  }

  async getBillsByFlat(flatNumber: string): Promise<Bill[]> {
    return Array.from(this.bills.values()).filter(bill => bill.flatNumber === flatNumber);
  }

  async getBillsByMonth(month: string): Promise<Bill[]> {
    return Array.from(this.bills.values()).filter(bill => bill.month === month);
  }

  async createBill(insertBill: InsertBill): Promise<Bill> {
    const id = this.currentBillId++;
    const bill: Bill = {
      ...insertBill,
      id,
      paidAt: null,
      createdAt: new Date(),
    };
    this.bills.set(id, bill);
    return bill;
  }

  async updateBillStatus(id: number, status: string, paidAt?: Date): Promise<Bill | undefined> {
    const bill = this.bills.get(id);
    if (!bill) return undefined;
    
    const updatedBill = { ...bill, status, paidAt: paidAt || null };
    this.bills.set(id, updatedBill);
    return updatedBill;
  }

  async getPendingBills(): Promise<Bill[]> {
    return Array.from(this.bills.values()).filter(bill => bill.status !== 'paid');
  }

  // Complaints
  async getComplaint(id: number): Promise<Complaint | undefined> {
    return this.complaints.get(id);
  }

  async getComplaintsByResident(residentId: number): Promise<Complaint[]> {
    return Array.from(this.complaints.values()).filter(complaint => complaint.residentId === residentId);
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return Array.from(this.complaints.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComplaint(insertComplaint: InsertComplaint): Promise<Complaint> {
    const id = this.currentComplaintId++;
    const complaint: Complaint = {
      ...insertComplaint,
      id,
      resolvedAt: null,
      createdAt: new Date(),
    };
    this.complaints.set(id, complaint);
    return complaint;
  }

  async updateComplaintStatus(id: number, status: string, resolvedAt?: Date): Promise<Complaint | undefined> {
    const complaint = this.complaints.get(id);
    if (!complaint) return undefined;
    
    const updatedComplaint = { ...complaint, status, resolvedAt: resolvedAt || null };
    this.complaints.set(id, updatedComplaint);
    return updatedComplaint;
  }

  // Notices
  async getNotice(id: number): Promise<Notice | undefined> {
    return this.notices.get(id);
  }

  async getAllNotices(): Promise<Notice[]> {
    return Array.from(this.notices.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const id = this.currentNoticeId++;
    const notice: Notice = {
      ...insertNotice,
      id,
      createdAt: new Date(),
    };
    this.notices.set(id, notice);
    return notice;
  }

  // Activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
