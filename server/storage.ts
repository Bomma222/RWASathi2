import { 
  users, bills, complaints, notices, activities, billingFields, billItems,
  type User, type InsertUser,
  type Bill, type InsertBill,
  type Complaint, type InsertComplaint,
  type Notice, type InsertNotice,
  type Activity, type InsertActivity,
  type BillingField, type InsertBillingField,
  type BillItem, type InsertBillItem
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
  updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: number): Promise<boolean>;
  
  // Activities
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Billing Fields
  getBillingFields(): Promise<BillingField[]>;
  createBillingField(field: InsertBillingField): Promise<BillingField>;
  updateBillingField(id: number, updates: Partial<InsertBillingField>): Promise<BillingField | undefined>;
  deleteBillingField(id: number): Promise<boolean>;
  
  // Bill Items
  getBillItems(billId: number): Promise<BillItem[]>;
  createBillItem(item: InsertBillItem): Promise<BillItem>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private bills: Map<number, Bill>;
  private complaints: Map<number, Complaint>;
  private notices: Map<number, Notice>;
  private activities: Map<number, Activity>;
  private billingFields: Map<number, BillingField>;
  private billItems: Map<number, BillItem>;
  private currentUserId: number;
  private currentBillId: number;
  private currentComplaintId: number;
  private currentNoticeId: number;
  private currentActivityId: number;
  private currentBillingFieldId: number;
  private currentBillItemId: number;

  constructor() {
    this.users = new Map();
    this.bills = new Map();
    this.complaints = new Map();
    this.notices = new Map();
    this.activities = new Map();
    this.billingFields = new Map();
    this.billItems = new Map();
    this.currentUserId = 1;
    this.currentBillId = 1;
    this.currentComplaintId = 1;
    this.currentNoticeId = 1;
    this.currentActivityId = 1;
    this.currentBillingFieldId = 1;
    this.currentBillItemId = 1;
    
    // Add demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo admin user
    const admin: User = {
      id: 1,
      phoneNumber: "+919876543210",
      name: "RWA President",
      flatNumber: "101",
      tower: "A",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(1, admin);
    this.currentUserId = 2;

    // Demo residents
    const residents = [
      { phoneNumber: "+919876543211", name: "Rajesh Kumar", flatNumber: "102", tower: "A" },
      { phoneNumber: "+919876543212", name: "Priya Sharma", flatNumber: "201", tower: "A" },
      { phoneNumber: "+919876543213", name: "Venkat Reddy", flatNumber: "301", tower: "B" },
    ];

    residents.forEach((resident, index) => {
      const user: User = {
        id: this.currentUserId++,
        ...resident,
        role: "resident",
        isActive: true,
        createdAt: new Date(),
      };
      this.users.set(user.id, user);
    });

    // Demo bills with detailed breakdown like the maintenance sheet
    const currentMonth = new Date().toISOString().slice(0, 7);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const detailedBills = [
      {
        flatNumber: "G1", residentId: 1, 
        pastWaterReading: 142116, presentWaterReading: 143816, 
        generalMaintenance: "1000", repairCharges: "0", previousDues: "0",
        status: "paid" as const
      },
      {
        flatNumber: "G2", residentId: 2,
        pastWaterReading: 84356, presentWaterReading: 87320,
        generalMaintenance: "1000", repairCharges: "0", previousDues: "0", 
        status: "unpaid" as const
      },
      {
        flatNumber: "G3", residentId: 3,
        pastWaterReading: 91202, presentWaterReading: 91602,
        generalMaintenance: "1000", repairCharges: "0", previousDues: "0",
        status: "unpaid" as const
      },
      {
        flatNumber: "G4", residentId: 4,
        pastWaterReading: 119843, presentWaterReading: 121377,
        generalMaintenance: "1000", repairCharges: "198.83", previousDues: "0",
        status: "overdue" as const
      },
      {
        flatNumber: "101", residentId: 2,
        pastWaterReading: 104361, presentWaterReading: 106068,
        generalMaintenance: "1000", repairCharges: "0", previousDues: "0",
        status: "unpaid" as const
      },
      {
        flatNumber: "102", residentId: 3,
        pastWaterReading: 134074, presentWaterReading: 135098,
        generalMaintenance: "1000", repairCharges: "0", previousDues: "0",
        status: "unpaid" as const
      },
      {
        flatNumber: "103", residentId: 4,
        pastWaterReading: 109172, presentWaterReading: 109579,
        generalMaintenance: "1000", repairCharges: "30000", previousDues: "0",
        status: "partially_cleared" as const
      }
    ];

    detailedBills.forEach(bill => {
      const usedLiters = bill.presentWaterReading - bill.pastWaterReading;
      const waterBill = usedLiters * 0.05; // ₹0.05 per liter
      const totalAmount = waterBill + Number(bill.generalMaintenance) + Number(bill.repairCharges) + Number(bill.previousDues);
      
      const billData: Bill = {
        id: this.currentBillId++,
        flatNumber: bill.flatNumber,
        residentId: bill.residentId,
        month: currentMonth,
        pastWaterReading: bill.pastWaterReading,
        presentWaterReading: bill.presentWaterReading,
        usedLiters,
        waterBill: waterBill.toString(),
        generalMaintenance: bill.generalMaintenance,
        repairCharges: bill.repairCharges,
        previousDues: bill.previousDues,
        totalAmount: totalAmount.toString(),
        presentDues: bill.status === "paid" ? "0" : totalAmount.toString(),
        status: bill.status,
        dueDate,
        paidAt: bill.status === "paid" ? new Date() : null,
        createdAt: new Date(),
      };
      this.bills.set(billData.id, billData);
    });

    // Demo notices
    const notices = [
      {
        title: "Monthly Maintenance Meeting",
        description: "All residents are invited to attend the monthly maintenance meeting on 28th January at 6 PM in the community hall.",
        isImportant: true,
      },
      {
        title: "Water Supply Interruption",
        description: "Water supply will be interrupted tomorrow from 10 AM to 2 PM for tank cleaning.",
        isImportant: false,
      },
    ];

    notices.forEach(notice => {
      const noticeData: Notice = {
        id: this.currentNoticeId++,
        ...notice,
        adminId: 1,
        createdAt: new Date(),
      };
      this.notices.set(noticeData.id, noticeData);
    });

    // Demo complaints
    const complaints = [
      {
        residentId: 2,
        flatNumber: "102",
        type: "plumbing",
        subject: "Leaking bathroom tap",
        description: "The bathroom tap has been leaking for 3 days. Please fix it urgently.",
        status: "open" as const,
        priority: "high" as const,
      },
      {
        residentId: 3,
        flatNumber: "201",
        type: "electrical",
        subject: "Lift not working",
        description: "The lift has been out of order since yesterday evening.",
        status: "in_progress" as const,
        priority: "medium" as const,
      },
    ];

    complaints.forEach(complaint => {
      const complaintData: Complaint = {
        id: this.currentComplaintId++,
        ...complaint,
        photoUrl: null,
        resolvedAt: null,
        createdAt: new Date(),
      };
      this.complaints.set(complaintData.id, complaintData);
    });

    // Demo activities
    const activities = [
      {
        type: "payment_received",
        title: "Payment received from 101",
        description: "Maintenance bill of ₹3500 paid",
        userId: 1,
      },
      {
        type: "complaint_submitted",
        title: "New complaint from 102",
        description: "Leaking bathroom tap",
        userId: 2,
      },
      {
        type: "notice_posted",
        title: "New notice posted",
        description: "Monthly Maintenance Meeting",
        userId: 1,
      },
    ];

    activities.forEach(activity => {
      const activityData: Activity = {
        id: this.currentActivityId++,
        ...activity,
        metadata: null,
        createdAt: new Date(),
      };
      this.activities.set(activityData.id, activityData);
    });

    // Initialize default billing fields
    const defaultBillingFields = [
      {
        name: "pastWaterReading",
        label: "Past Water Reading",
        type: "variable" as const,
        category: "water",
        defaultValue: "0",
        sortOrder: 1,
        description: "Previous month's water meter reading"
      },
      {
        name: "presentWaterReading", 
        label: "Present Water Reading",
        type: "variable" as const,
        category: "water",
        defaultValue: "0",
        sortOrder: 2,
        description: "Current month's water meter reading"
      },
      {
        name: "usedLiters",
        label: "Used Liters",
        type: "calculated" as const,
        category: "water",
        defaultValue: "0",
        sortOrder: 3,
        formula: "presentWaterReading - pastWaterReading",
        description: "Water consumption in liters"
      },
      {
        name: "waterBill",
        label: "Water Bill",
        type: "calculated" as const,
        category: "water",
        defaultValue: "0",
        sortOrder: 4,
        formula: "usedLiters * 0.05",
        description: "Water charges at ₹0.05 per liter"
      },
      {
        name: "generalMaintenance",
        label: "General Maintenance",
        type: "fixed" as const,
        category: "maintenance",
        defaultValue: "1000",
        sortOrder: 5,
        description: "Fixed monthly maintenance charges"
      },
      {
        name: "repairCharges",
        label: "Repair Charges",
        type: "variable" as const,
        category: "charges",
        defaultValue: "0",
        sortOrder: 6,
        description: "Additional repair and maintenance costs"
      },
      {
        name: "previousDues",
        label: "Previous Dues",
        type: "variable" as const,
        category: "dues",
        defaultValue: "0",
        sortOrder: 7,
        description: "Outstanding amount from previous months"
      }
    ];

    defaultBillingFields.forEach(field => {
      const fieldData: BillingField = {
        id: this.currentBillingFieldId++,
        ...field,
        isActive: true,
        createdAt: new Date(),
      };
      this.billingFields.set(fieldData.id, fieldData);
    });
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
      tower: insertUser.tower || null,
      role: insertUser.role || "resident",
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
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
    
    // Calculate water charges based on usage
    const usedLiters = (insertBill.presentWaterReading || 0) - (insertBill.pastWaterReading || 0);
    const waterRate = 0.05; // ₹0.05 per liter
    const waterBill = usedLiters * waterRate;
    
    // Calculate total amount
    const generalMaintenance = insertBill.generalMaintenance || 1000;
    const repairCharges = insertBill.repairCharges || 0;
    const previousDues = insertBill.previousDues || 0;
    const totalAmount = waterBill + Number(generalMaintenance) + Number(repairCharges) + Number(previousDues);
    
    const bill: Bill = {
      ...insertBill,
      id,
      usedLiters,
      waterBill: waterBill.toString(),
      totalAmount: totalAmount.toString(),
      presentDues: totalAmount.toString(),
      status: insertBill.status || "unpaid",
      residentId: insertBill.residentId || null,
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
      status: insertComplaint.status || "open",
      priority: insertComplaint.priority || "medium",
      photoUrl: insertComplaint.photoUrl || null,
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
      isImportant: insertNotice.isImportant !== undefined ? insertNotice.isImportant : false,
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
      description: insertActivity.description || null,
      userId: insertActivity.userId || null,
      metadata: insertActivity.metadata || null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Billing Fields methods
  async getBillingFields(): Promise<BillingField[]> {
    return Array.from(this.billingFields.values())
      .filter(field => field.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async createBillingField(insertField: InsertBillingField): Promise<BillingField> {
    const id = this.currentBillingFieldId++;
    const field: BillingField = {
      ...insertField,
      id,
      isActive: insertField.isActive ?? true,
      sortOrder: insertField.sortOrder ?? 0,
      createdAt: new Date(),
    };
    this.billingFields.set(id, field);
    return field;
  }

  async updateBillingField(id: number, updates: Partial<InsertBillingField>): Promise<BillingField | undefined> {
    const field = this.billingFields.get(id);
    if (!field) return undefined;

    const updatedField: BillingField = { ...field, ...updates };
    this.billingFields.set(id, updatedField);
    return updatedField;
  }

  async deleteBillingField(id: number): Promise<boolean> {
    return this.billingFields.delete(id);
  }

  // Bill Items methods
  async getBillItems(billId: number): Promise<BillItem[]> {
    return Array.from(this.billItems.values()).filter(item => item.billId === billId);
  }

  async createBillItem(insertItem: InsertBillItem): Promise<BillItem> {
    const id = this.currentBillItemId++;
    const item: BillItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.billItems.set(id, item);
    return item;
  }
}

// Switch to database storage for production
import { DatabaseStorage } from './db-storage';
export const storage = new DatabaseStorage();
