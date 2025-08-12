import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertInquirySchema, insertEnrollmentSchema, insertPaymentSchema, insertCustomStudentFeeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default courses
  await initializeDefaultCourses();

  // Initialize default users in database if not exist
  try {
    let websiteUser = await storage.getUserByUsername('website');
    if (!websiteUser) {
      await storage.createUser({ username: 'website', password: "santmegh123" });
      console.log("✓ Default website user created: website/santmegh123");
    }

    let adminUser = await storage.getUserByUsername('admin');
    if (!adminUser) {
      await storage.createUser({ username: 'admin', password: "admin123" });
      console.log("✓ Default admin user created: admin/admin123");
    }
  } catch (error) {
    console.error("Users table error:", error.message);
    console.log("❌ Database not properly initialized. Please run: psql $DATABASE_URL -f init-db.sql");
  }

  // Website access login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const websiteUser = await storage.getUserByUsername('website');
      if (!websiteUser) {
        return res.status(500).json({ message: "System configuration error" });
      }

      const isValid = password === websiteUser.password;
      
      if (isValid) {
        res.json({ success: true, message: "Access granted" });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const adminUser = await storage.getUserByUsername('admin');
      if (!adminUser) {
        return res.status(500).json({ message: "System configuration error" });
      }

      const isValid = password === adminUser.password;
      
      if (isValid) {
        res.json({ success: true, message: "Login successful" });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Website access password change endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const websiteUser = await storage.getUserByUsername('website');
      if (!websiteUser) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Verify current website password
      const isCurrentValid = currentPassword === websiteUser.password;
      
      if (!isCurrentValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Update website password in database
      await storage.updateUser(websiteUser.id, { password: newPassword });
      
      res.json({ success: true, message: "Website password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Password change failed" });
    }
  });

  // Admin password change endpoint
  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const adminUser = await storage.getUserByUsername('admin');
      if (!adminUser) {
        return res.status(500).json({ message: "System configuration error" });
      }

      // Verify current password
      const isCurrentValid = currentPassword === adminUser.password;
      
      if (!isCurrentValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Update password in database
      await storage.updateUser(adminUser.id, { password: newPassword });
      
      res.json({ success: true, message: "Admin password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Password change failed" });
    }
  });

  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to fetch courses", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get course by ID
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Create new course
  app.post("/api/courses", async (req, res) => {
    try {
      const validatedData = req.body; // We'll add proper validation later
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Update course
  app.patch("/api/courses/:id", async (req, res) => {
    try {
      const validatedData = req.body; // We'll add proper validation later
      const course = await storage.updateCourse(req.params.id, validatedData);
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Delete course
  app.delete("/api/courses/:id", async (req, res) => {
    try {
      await storage.deleteCourse(req.params.id);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Get all inquiries
  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getAllInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });

  // Get inquiry by ID
  app.get("/api/inquiries/:id", async (req, res) => {
    try {
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiry" });
    }
  });

  // Create new inquiry
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  // Update inquiry status
  app.patch("/api/inquiries/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateInquiryStatus(req.params.id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Delete inquiry
  app.delete("/api/inquiries/:id", async (req, res) => {
    try {
      await storage.deleteInquiry(req.params.id);
      res.json({ message: "Inquiry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inquiry" });
    }
  });

  // Update inquiry
  app.patch("/api/inquiries/:id", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.partial().parse(req.body);
      const inquiry = await storage.updateInquiry(req.params.id, validatedData);
      res.json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inquiry" });
    }
  });

  // Bulk operations on inquiries
  app.post("/api/inquiries/bulk", async (req, res) => {
    try {
      const { ids, action, status } = req.body;
      
      if (action === "updateStatus") {
        await storage.bulkUpdateInquiryStatus(ids, status);
        res.json({ message: "Inquiries updated successfully" });
      } else if (action === "delete") {
        await storage.bulkDeleteInquiries(ids);
        res.json({ message: "Inquiries deleted successfully" });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to perform bulk operation" });
    }
  });

  // Get all enrollments
  app.get("/api/enrollments", async (req, res) => {
    try {
      const enrollments = await storage.getAllEnrollments();
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Get enrollment by ID
  app.get("/api/enrollments/:id", async (req, res) => {
    try {
      const enrollment = await storage.getEnrollment(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollment" });
    }
  });

  // Create new enrollment
  app.post("/api/enrollments", async (req, res) => {
    try {
      const validatedData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(validatedData);
      
      // Update inquiry status to enrolled
      await storage.updateInquiryStatus(validatedData.inquiryId, "enrolled");
      
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  // Update enrollment
  app.patch("/api/enrollments/:id", async (req, res) => {
    try {
      const validatedData = insertEnrollmentSchema.partial().parse(req.body);
      const enrollment = await storage.updateEnrollment(req.params.id, validatedData);
      res.json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });

  // Delete enrollment
  app.delete("/api/enrollments/:id", async (req, res) => {
    try {
      await storage.deleteEnrollment(req.params.id);
      res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete enrollment" });
    }
  });

  // Bulk operations on enrollments
  app.post("/api/enrollments/bulk", async (req, res) => {
    try {
      const { ids, action } = req.body;
      
      if (action === "delete") {
        await storage.bulkDeleteEnrollments(ids);
        res.json({ message: "Enrollments deleted successfully" });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to perform bulk operation" });
    }
  });

  // Get payments for enrollment
  app.get("/api/enrollments/:id/payments", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByEnrollment(req.params.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get all payments
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to fetch payments", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Record payment
  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // SMS sending helper function
  async function sendSMS(phoneNumber: string, message: string) {
    // Check if SMS credentials are available
    const smsProvider = process.env.SMS_PROVIDER || 'console'; // 'msg91', 'twilio', 'fast2sms', 'textlocal'
    
    try {
      switch (smsProvider) {
        case 'msg91':
          if (!process.env.MSG91_API_KEY || !process.env.MSG91_SENDER_ID) {
            throw new Error('MSG91 credentials not configured');
          }
          const msg91Response = await fetch('https://api.msg91.com/api/v5/flow/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'authkey': process.env.MSG91_API_KEY
            },
            body: JSON.stringify({
              sender: process.env.MSG91_SENDER_ID,
              short_url: '0',
              mobiles: phoneNumber,
              message: message
            })
          });
          if (!msg91Response.ok) throw new Error('MSG91 SMS failed');
          return { success: true, provider: 'MSG91' };

        case 'fast2sms':
          if (!process.env.FAST2SMS_API_KEY) {
            throw new Error('Fast2SMS credentials not configured');
          }
          const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'authorization': process.env.FAST2SMS_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              route: 'q',
              message: message,
              language: 'english',
              flash: 0,
              numbers: phoneNumber
            })
          });
          if (!fast2smsResponse.ok) throw new Error('Fast2SMS failed');
          return { success: true, provider: 'Fast2SMS' };

        case 'textlocal':
          if (!process.env.TEXTLOCAL_API_KEY || !process.env.TEXTLOCAL_SENDER) {
            throw new Error('TextLocal credentials not configured');
          }
          const textlocalResponse = await fetch('https://api.textlocal.in/send/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              apikey: process.env.TEXTLOCAL_API_KEY,
              numbers: phoneNumber,
              message: message,
              sender: process.env.TEXTLOCAL_SENDER
            })
          });
          if (!textlocalResponse.ok) throw new Error('TextLocal SMS failed');
          return { success: true, provider: 'TextLocal' };

        case 'twilio':
          if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
            throw new Error('Twilio credentials not configured');
          }
          const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              From: process.env.TWILIO_PHONE_NUMBER,
              To: `+91${phoneNumber}`,
              Body: message
            })
          });
          if (!twilioResponse.ok) throw new Error('Twilio SMS failed');
          return { success: true, provider: 'Twilio' };

        default:
          // Console simulation mode
          console.log(`📱 SMS Reminder to ${phoneNumber}: ${message}`);
          return { success: true, provider: 'Console (Simulation)' };
      }
    } catch (error) {
      console.error(`SMS Error (${smsProvider}):`, error);
      // Fallback to console logging
      console.log(`📱 SMS Fallback to ${phoneNumber}: ${message}`);
      return { success: false, error: error instanceof Error ? error.message : String(error), provider: smsProvider };
    }
  }

  // Send payment reminder SMS
  app.post("/api/send-reminder", async (req, res) => {
    try {
      const { enrollmentId, studentName, contactNo, courseName, pendingAmount } = req.body;
      
      // Format the reminder message
      const message = `Dear ${studentName}, this is a payment reminder for your ${courseName} course at SANTMEGH COMPUTER EDUCATION. Pending amount: ₹${pendingAmount.toLocaleString()}. Please complete your payment at your earliest convenience. Thank you!`;
      
      const smsResult = await sendSMS(contactNo, message);
      
      res.json({
        success: smsResult.success,
        message: smsResult.success ? "Payment reminder sent successfully" : "SMS failed, logged to console",
        sentTo: contactNo,
        studentName,
        provider: smsResult.provider,
        error: smsResult.error,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("SMS Reminder error:", error);
      res.status(500).json({ message: "Failed to send payment reminder", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Send bulk payment reminder SMS
  app.post("/api/send-bulk-reminders", async (req, res) => {
    try {
      const { enrollments } = req.body;
      let sentCount = 0;
      let successCount = 0;
      const results = [];

      for (const enrollment of enrollments) {
        const totalFee = parseFloat(enrollment.totalFee);
        const paidAmount = enrollment.payments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0);
        const pendingAmount = totalFee - paidAmount;

        if (pendingAmount > 0) {
          const message = `Dear ${enrollment.studentName}, this is a payment reminder for your ${enrollment.course.name} course at SANTMEGH COMPUTER EDUCATION. Pending amount: ₹${pendingAmount.toLocaleString()}. Please complete your payment at your earliest convenience. Thank you!`;
          
          const smsResult = await sendSMS(enrollment.contactNo, message);
          
          results.push({
            studentName: enrollment.studentName,
            contactNo: enrollment.contactNo,
            courseName: enrollment.course.name,
            pendingAmount: pendingAmount,
            sent: smsResult.success,
            provider: smsResult.provider,
            error: smsResult.error
          });
          
          sentCount++;
          if (smsResult.success) successCount++;
        }
      }

      res.json({
        success: true,
        message: "Bulk payment reminders processed",
        sentCount,
        successCount,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Bulk SMS Reminder error:", error);
      res.status(500).json({ message: "Failed to send bulk payment reminders", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to fetch statistics", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Custom Student Fees routes
  // Get all custom student fees
  app.get("/api/custom-fees", async (req, res) => {
    try {
      const customFees = await storage.getAllCustomStudentFees();
      res.json(customFees);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to fetch custom student fees", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get custom student fee by ID
  app.get("/api/custom-fees/:id", async (req, res) => {
    try {
      const customFee = await storage.getCustomStudentFee(req.params.id);
      if (!customFee) {
        return res.status(404).json({ message: "Custom student fee not found" });
      }
      res.json(customFee);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to fetch custom student fee", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Check if student has custom fee
  app.get("/api/custom-fees/check/:studentName/:contactNo/:courseId", async (req, res) => {
    try {
      const { studentName, contactNo, courseId } = req.params;
      const customFee = await storage.getCustomStudentFeeByStudent(
        decodeURIComponent(studentName), 
        decodeURIComponent(contactNo), 
        courseId
      );
      res.json({ hasCustomFee: !!customFee, customFee });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to check custom student fee", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Create new custom student fee
  app.post("/api/custom-fees", async (req, res) => {
    try {
      const validatedData = insertCustomStudentFeeSchema.parse(req.body);
      
      // Check if custom fee already exists for this student and course
      const existingFee = await storage.getCustomStudentFeeByStudent(
        validatedData.studentName, 
        validatedData.contactNo, 
        validatedData.courseId
      );
      
      if (existingFee) {
        return res.status(400).json({ message: "Custom fee already exists for this student and course" });
      }
      
      const customFee = await storage.createCustomStudentFee(validatedData);
      
      // Update existing enrollments with the new custom fee
      await storage.updateEnrollmentFeesForCustomFee(customFee);
      
      res.status(201).json(customFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to create custom student fee", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update custom student fee
  app.patch("/api/custom-fees/:id", async (req, res) => {
    try {
      const validatedData = insertCustomStudentFeeSchema.partial().parse(req.body);
      const customFee = await storage.updateCustomStudentFee(req.params.id, validatedData);
      
      // Update existing enrollments with the updated custom fee
      await storage.updateEnrollmentFeesForCustomFee(customFee);
      
      res.json(customFee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to update custom student fee", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete custom student fee
  app.delete("/api/custom-fees/:id", async (req, res) => {
    try {
      await storage.deleteCustomStudentFee(req.params.id);
      res.json({ message: "Custom student fee deleted successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to delete custom student fee", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Sync enrollment fees with custom fees (manual trigger)
  app.post("/api/custom-fees/:id/sync-enrollments", async (req, res) => {
    try {
      const customFee = await storage.getCustomStudentFee(req.params.id);
      if (!customFee) {
        return res.status(404).json({ message: "Custom student fee not found" });
      }
      
      await storage.updateEnrollmentFeesForCustomFee(customFee);
      res.json({ message: "Enrollment fees synced successfully" });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Failed to sync enrollment fees", error: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaultCourses() {
  // Courses are now manually managed via SQL, no automatic initialization needed
}
