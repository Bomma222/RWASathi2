import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBillSchema, insertComplaintSchema, insertNoticeSchema, insertActivitySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phoneNumber, name, flatNumber, tower } = req.body;
      
      let user = await storage.getUserByPhone(phoneNumber);
      
      if (!user) {
        // Auto-register new user
        const userData = insertUserSchema.parse({
          phoneNumber,
          name,
          flatNumber,
          tower: tower || "A",
          role: "resident",
          isActive: true,
        });
        user = await storage.createUser(userData);
      }
      
      res.json({ user });
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Get user by phone number
  app.get("/api/users/phone/:phoneNumber", async (req, res) => {
    try {
      const user = await storage.getUserByPhone(req.params.phoneNumber);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllResidents();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const updates = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(parseInt(req.params.id), updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Bill routes
  app.get("/api/bills", async (req, res) => {
    try {
      const { month, flatNumber, status } = req.query;
      
      let bills;
      if (month) {
        bills = await storage.getBillsByMonth(month as string);
      } else if (flatNumber) {
        bills = await storage.getBillsByFlat(flatNumber as string);
      } else if (status === 'pending') {
        bills = await storage.getPendingBills();
      } else {
        // Get current month bills by default
        const currentMonth = new Date().toISOString().slice(0, 7);
        bills = await storage.getBillsByMonth(currentMonth);
      }
      
      res.json(bills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bills" });
    }
  });

  app.post("/api/bills", async (req, res) => {
    try {
      const billData = insertBillSchema.parse(req.body);
      const bill = await storage.createBill(billData);
      
      // Create activity
      await storage.createActivity({
        type: "bill_generated",
        title: `Bill generated for ${bill.flatNumber}`,
        description: `Monthly maintenance bill of ₹${bill.amount} generated`,
        userId: bill.residentId,
        metadata: JSON.stringify({ billId: bill.id, amount: bill.amount }),
      });
      
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: "Invalid bill data" });
    }
  });

  app.put("/api/bills/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const paidAt = status === 'paid' ? new Date() : undefined;
      const bill = await storage.updateBillStatus(parseInt(req.params.id), status, paidAt);
      
      if (!bill) {
        return res.status(404).json({ error: "Bill not found" });
      }
      
      if (status === 'paid') {
        // Create activity
        await storage.createActivity({
          type: "payment_received",
          title: `Payment received from ${bill.flatNumber}`,
          description: `Maintenance bill of ₹${bill.amount} paid`,
          userId: bill.residentId,
          metadata: JSON.stringify({ billId: bill.id, amount: bill.amount }),
        });
      }
      
      res.json(bill);
    } catch (error) {
      res.status(400).json({ error: "Invalid status update" });
    }
  });

  // Complaint routes
  app.get("/api/complaints", async (req, res) => {
    try {
      const { residentId } = req.query;
      
      let complaints;
      if (residentId) {
        complaints = await storage.getComplaintsByResident(parseInt(residentId as string));
      } else {
        complaints = await storage.getAllComplaints();
      }
      
      res.json(complaints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  app.post("/api/complaints", async (req, res) => {
    try {
      const complaintData = insertComplaintSchema.parse(req.body);
      const complaint = await storage.createComplaint(complaintData);
      
      // Create activity
      await storage.createActivity({
        type: "complaint_submitted",
        title: `New complaint from ${complaint.flatNumber}`,
        description: complaint.subject,
        userId: complaint.residentId,
        metadata: JSON.stringify({ complaintId: complaint.id, type: complaint.type }),
      });
      
      res.json(complaint);
    } catch (error) {
      res.status(400).json({ error: "Invalid complaint data" });
    }
  });

  app.put("/api/complaints/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const resolvedAt = status === 'resolved' ? new Date() : undefined;
      const complaint = await storage.updateComplaintStatus(parseInt(req.params.id), status, resolvedAt);
      
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      // Create activity
      await storage.createActivity({
        type: "complaint_updated",
        title: `Complaint ${status}`,
        description: `${complaint.title} - Status updated to ${status}`,
        userId: complaint.residentId,
      });
      
      res.json(complaint);
    } catch (error) {
      res.status(400).json({ error: "Invalid status update" });
    }
  });

  app.put("/api/complaints/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const complaint = await storage.updateComplaint(id, updates);
      
      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }
      
      // Create activity log
      await storage.createActivity({
        type: "complaint_updated",
        title: "Complaint Updated",
        description: `Updated complaint: ${complaint.title}`,
        userId: req.session.user?.id || 1
      });
      
      res.json(complaint);
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).json({ error: "Failed to update complaint" });
    }
  });

  // Notice routes
  // Get all notices
  app.get("/api/notices", async (req: Request, res: Response) => {
    try {
      const notices = await storage.getAllNotices();
      res.json(notices);
    } catch (error) {
      console.error("Error getting notices:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create new notice
  app.post("/api/notices", async (req: Request, res: Response) => {
    try {
      const noticeData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(noticeData);
      
      // Log activity
      await storage.createActivity({
        type: "notice_published",
        title: "Notice Published",
        description: notice.title,
        userId: notice.adminId,
        metadata: JSON.stringify({ noticeId: notice.id })
      });
      
      res.status(201).json(notice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid notice data", details: error.errors });
      }
      console.error("Error creating notice:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notices", async (req, res) => {
    try {
      const noticeData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(noticeData);
      
      // Create activity
      await storage.createActivity({
        type: "notice_posted",
        title: "New notice posted",
        description: notice.title,
        userId: notice.adminId,
        metadata: JSON.stringify({ noticeId: notice.id }),
      });
      
      res.json(notice);
    } catch (error) {
      res.status(400).json({ error: "Invalid notice data" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { limit } = req.query;
      const activities = await storage.getRecentActivities(limit ? parseInt(limit as string) : undefined);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const residents = await storage.getAllResidents();
      const pendingBills = await storage.getPendingBills();
      const complaints = await storage.getAllComplaints();
      
      const totalFlats = residents.length;
      const pendingDues = pendingBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
      const openComplaints = complaints.filter(c => c.status === 'open').length;
      
      res.json({
        totalFlats,
        pendingDues,
        openComplaints,
        totalComplaints: complaints.length,
        resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Billing Fields routes
  app.get("/api/billing-fields", async (req: Request, res: Response) => {
    try {
      const fields = await storage.getBillingFields();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching billing fields:", error);
      res.status(500).json({ error: "Failed to fetch billing fields" });
    }
  });

  app.post("/api/billing-fields", async (req: Request, res: Response) => {
    try {
      const insertFieldSchema = z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["fixed", "variable", "calculated"]),
        category: z.string(),
        defaultValue: z.string().optional(),
        description: z.string().optional(),
        formula: z.string().optional(),
        sortOrder: z.number().optional(),
      });
      
      const fieldData = insertFieldSchema.parse(req.body);
      const field = await storage.createBillingField(fieldData);
      res.json(field);
    } catch (error) {
      console.error("Error creating billing field:", error);
      res.status(500).json({ error: "Failed to create billing field" });
    }
  });

  app.put("/api/billing-fields/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateFieldSchema = z.object({
        label: z.string().optional(),
        type: z.enum(["fixed", "variable", "calculated"]).optional(),
        category: z.string().optional(),
        defaultValue: z.string().optional(),
        description: z.string().optional(),
        formula: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      });
      
      const updates = updateFieldSchema.parse(req.body);
      const field = await storage.updateBillingField(id, updates);
      
      if (!field) {
        return res.status(404).json({ error: "Billing field not found" });
      }
      
      res.json(field);
    } catch (error) {
      console.error("Error updating billing field:", error);
      res.status(500).json({ error: "Failed to update billing field" });
    }
  });

  app.delete("/api/billing-fields/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBillingField(id);
      
      if (!success) {
        return res.status(404).json({ error: "Billing field not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting billing field:", error);
      res.status(500).json({ error: "Failed to delete billing field" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
