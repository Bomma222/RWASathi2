import { db } from "./db";
import { users, bills, complaints, notices, activities, billingFields } from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database with initial data...");

  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Create demo users
    const demoUsers = [
      {
        phoneNumber: "+919876543210",
        name: "Rajesh Kumar",
        flatNumber: "A-101",
        role: "admin" as const,
        isActive: true,
      },
      {
        phoneNumber: "+919876543211", 
        name: "Priya Sharma",
        flatNumber: "B-205",
        role: "resident" as const,
        isActive: true,
      },
      {
        phoneNumber: "+919876543212",
        name: "Amit Singh",
        flatNumber: "C-304",
        role: "resident" as const,
        isActive: true,
      },
      {
        phoneNumber: "+919876543213",
        name: "Security Staff",
        flatNumber: "Security",
        role: "watchman" as const,
        isActive: true,
      },
    ];

    const insertedUsers = await db.insert(users).values(demoUsers).returning();
    console.log(`Created ${insertedUsers.length} demo users`);

    // Create billing fields
    const billingFieldsData = [
      {
        name: "General Maintenance",
        type: "fixed" as const,
        amount: 2500.00,
        order: 1,
        isActive: true,
      },
      {
        name: "Water Charges",
        type: "calculated" as const,
        rate: 0.05,
        unit: "liters",
        order: 2,
        isActive: true,
      },
      {
        name: "Electricity Common Area",
        type: "variable" as const,
        order: 3,
        isActive: true,
      },
      {
        name: "Lift Maintenance",
        type: "fixed" as const,
        amount: 300.00,
        order: 4,
        isActive: true,
      },
    ];

    const insertedFields = await db.insert(billingFields).values(billingFieldsData).returning();
    console.log(`Created ${insertedFields.length} billing fields`);

    // Create sample bills
    const billsData = [
      {
        flatNumber: "B-205",
        month: "2024-12",
        totalAmount: 3850.00,
        status: "pending" as const,
        dueDate: new Date("2025-01-15"),
        waterReading: 15000,
        waterUsage: 2500,
      },
      {
        flatNumber: "C-304", 
        month: "2024-12",
        totalAmount: 3650.00,
        status: "paid" as const,
        dueDate: new Date("2025-01-15"),
        paidAt: new Date("2024-12-28"),
        waterReading: 12000,
        waterUsage: 2000,
      },
    ];

    const insertedBills = await db.insert(bills).values(billsData).returning();
    console.log(`Created ${insertedBills.length} sample bills`);

    // Create sample complaints
    const complaintsData = [
      {
        residentId: insertedUsers[1].id,
        title: "Water Pressure Issue",
        description: "Low water pressure in bathroom taps during morning hours",
        category: "plumbing",
        priority: "medium" as const,
        status: "open" as const,
      },
      {
        residentId: insertedUsers[2].id,
        title: "Lift Not Working",
        description: "Lift has been stuck on 3rd floor for 2 days",
        category: "maintenance",
        priority: "high" as const,
        status: "in_progress" as const,
      },
    ];

    const insertedComplaints = await db.insert(complaints).values(complaintsData).returning();
    console.log(`Created ${insertedComplaints.length} sample complaints`);

    // Create sample notices
    const noticesData = [
      {
        title: "Monthly Maintenance Meeting",
        content: "Monthly RWA meeting scheduled for January 15th at 6 PM in the community hall. All residents are requested to attend.",
        type: "meeting" as const,
        priority: "medium" as const,
      },
      {
        title: "Water Supply Maintenance",
        content: "Water supply will be interrupted on January 10th from 10 AM to 2 PM for tank cleaning. Please store water accordingly.",
        type: "maintenance" as const,
        priority: "high" as const,
      },
    ];

    const insertedNotices = await db.insert(notices).values(noticesData).returning();
    console.log(`Created ${insertedNotices.length} sample notices`);

    // Create sample activities
    const activitiesData = [
      {
        type: "payment_received",
        title: "Payment Received",
        description: "Maintenance payment received from C-304",
        metadata: { amount: 3650, flatNumber: "C-304" },
      },
      {
        type: "complaint_filed",
        title: "New Complaint Filed",
        description: "Water pressure issue reported by B-205",
        metadata: { complaintId: insertedComplaints[0].id },
      },
      {
        type: "notice_published",
        title: "Notice Published",
        description: "Monthly meeting notice published",
        metadata: { noticeId: insertedNotices[0].id },
      },
    ];

    const insertedActivities = await db.insert(activities).values(activitiesData).returning();
    console.log(`Created ${insertedActivities.length} sample activities`);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}