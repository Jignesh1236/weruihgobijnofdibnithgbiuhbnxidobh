import { 
  users, inquiries, enrollments, courses, payments, settings,
  type User, type InsertUser,
  type Course, type InsertCourse,
  type Inquiry, type InsertInquiry, type InquiryWithCourse,
  type Enrollment, type InsertEnrollment, type EnrollmentWithDetails,
  type Payment, type InsertPayment, type PaymentWithEnrollment,
  type Setting, type InsertSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updateData: Partial<InsertUser>): Promise<User>;

  // Courses
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updateData: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Inquiries
  getAllInquiries(): Promise<InquiryWithCourse[]>;
  getInquiry(id: string): Promise<InquiryWithCourse | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: string, status: string): Promise<void>;
  deleteInquiry(id: string): Promise<void>;
  updateInquiry(id: string, updateData: Partial<InsertInquiry>): Promise<Inquiry>;
  bulkUpdateInquiryStatus(ids: string[], status: string): Promise<void>;
  bulkDeleteInquiries(ids: string[]): Promise<void>;

  // Enrollments
  getAllEnrollments(): Promise<EnrollmentWithDetails[]>;
  getEnrollment(id: string): Promise<EnrollmentWithDetails | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, updateData: Partial<InsertEnrollment>): Promise<Enrollment>;
  deleteEnrollment(id: string): Promise<void>;
  bulkDeleteEnrollments(ids: string[]): Promise<void>;

  // Payments
  getPayments(): Promise<PaymentWithEnrollment[]>;
  getPaymentsByEnrollment(enrollmentId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Statistics
  getStats(): Promise<{
    totalInquiries: number;
    enrolledStudents: number;
    pendingPayments: string;
    overduePayments: number;
    totalCollected: string;
  }>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.isActive, true)).orderBy(courses.name);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async updateCourse(id: string, updateData: Partial<InsertCourse>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getAllInquiries(): Promise<InquiryWithCourse[]> {
    const results = await db
      .select({
        id: inquiries.id,
        studentName: inquiries.studentName,
        courseId: inquiries.courseId,
        contactNo: inquiries.contactNo,
        address: inquiries.address,
        fatherContactNo: inquiries.fatherContactNo,
        status: inquiries.status,
        batchId: inquiries.batchId,
        createdAt: inquiries.createdAt,
        updatedAt: inquiries.updatedAt,
        course: courses,
      })
      .from(inquiries)
      .leftJoin(courses, eq(inquiries.courseId, courses.id))
      .orderBy(desc(inquiries.createdAt));

    return results.filter(result => result.course !== null) as InquiryWithCourse[];
  }

  async getInquiry(id: string): Promise<InquiryWithCourse | undefined> {
    const [result] = await db
      .select({
        id: inquiries.id,
        studentName: inquiries.studentName,
        courseId: inquiries.courseId,
        contactNo: inquiries.contactNo,
        address: inquiries.address,
        fatherContactNo: inquiries.fatherContactNo,
        status: inquiries.status,
        batchId: inquiries.batchId,
        createdAt: inquiries.createdAt,
        updatedAt: inquiries.updatedAt,
        course: courses,
      })
      .from(inquiries)
      .leftJoin(courses, eq(inquiries.courseId, courses.id))
      .where(eq(inquiries.id, id));

    if (!result || !result.course) return undefined;
    return result as InquiryWithCourse;
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db
      .insert(inquiries)
      .values(insertInquiry)
      .returning();
    return inquiry;
  }

  async updateInquiryStatus(id: string, status: string): Promise<void> {
    await db
      .update(inquiries)
      .set({ status, updatedAt: new Date() })
      .where(eq(inquiries.id, id));
  }

  async deleteInquiry(id: string): Promise<void> {
    // First, get any enrollments for this inquiry
    const relatedEnrollments = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.inquiryId, id));

    // Delete payments for any related enrollments
    for (const enrollment of relatedEnrollments) {
      await db.delete(payments).where(eq(payments.enrollmentId, enrollment.id));
    }

    // Delete any enrollments for this inquiry
    await db.delete(enrollments).where(eq(enrollments.inquiryId, id));

    // Finally, delete the inquiry itself
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  async bulkUpdateInquiryStatus(ids: string[], status: string): Promise<void> {
    await db
      .update(inquiries)
      .set({ status, updatedAt: new Date() })
      .where(inArray(inquiries.id, ids));
  }

  async bulkDeleteInquiries(ids: string[]): Promise<void> {
    // First, get any enrollments for these inquiries
    const relatedEnrollments = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(inArray(enrollments.inquiryId, ids));

    // Delete payments for any related enrollments
    if (relatedEnrollments.length > 0) {
      const enrollmentIds = relatedEnrollments.map(e => e.id);
      await db.delete(payments).where(inArray(payments.enrollmentId, enrollmentIds));
    }

    // Delete any enrollments for these inquiries
    await db.delete(enrollments).where(inArray(enrollments.inquiryId, ids));

    // Finally, delete the inquiries themselves
    await db.delete(inquiries).where(inArray(inquiries.id, ids));
  }

  async updateInquiry(id: string, updateData: Partial<InsertInquiry>): Promise<Inquiry> {
    const [inquiry] = await db
      .update(inquiries)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry;
  }

  async getAllEnrollments(): Promise<EnrollmentWithDetails[]> {
    const results = await db
      .select({
        enrollment: enrollments,
        course: courses,
        inquiry: inquiries,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(inquiries, eq(enrollments.inquiryId, inquiries.id))
      .orderBy(desc(enrollments.createdAt));

    const enrollmentsWithPayments = await Promise.all(
      results.map(async (result) => {
        const enrollmentPayments = await this.getPaymentsByEnrollment(result.enrollment.id);
        return {
          ...result.enrollment,
          course: result.course!,
          inquiry: result.inquiry!,
          payments: enrollmentPayments,
        };
      })
    );

    return enrollmentsWithPayments;
  }

  async getEnrollment(id: string): Promise<EnrollmentWithDetails | undefined> {
    const [result] = await db
      .select({
        enrollment: enrollments,
        course: courses,
        inquiry: inquiries,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(inquiries, eq(enrollments.inquiryId, inquiries.id))
      .where(eq(enrollments.id, id));

    if (!result) return undefined;

    const enrollmentPayments = await this.getPaymentsByEnrollment(result.enrollment.id);

    return {
      ...result.enrollment,
      course: result.course!,
      inquiry: result.inquiry!,
      payments: enrollmentPayments,
    };
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values(insertEnrollment)
      .returning();
    return enrollment;
  }

  async updateEnrollment(id: string, updateData: Partial<InsertEnrollment>): Promise<Enrollment> {
    const [enrollment] = await db
      .update(enrollments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    return enrollment;
  }

  async deleteEnrollment(id: string): Promise<void> {
    // First, delete all payments for this enrollment
    await db.delete(payments).where(eq(payments.enrollmentId, id));
    
    // Then delete the enrollment itself
    await db.delete(enrollments).where(eq(enrollments.id, id));
  }

  async bulkDeleteEnrollments(ids: string[]): Promise<void> {
    // First, delete all payments for these enrollments
    await db.delete(payments).where(inArray(payments.enrollmentId, ids));
    
    // Then delete the enrollments themselves
    await db.delete(enrollments).where(inArray(enrollments.id, ids));
  }

  async getPayments(): Promise<PaymentWithEnrollment[]> {
    const results = await db
      .select({
        payment: payments,
        enrollment: {
          id: enrollments.id,
          studentName: enrollments.studentName,
        },
        course: {
          name: courses.name,
        },
      })
      .from(payments)
      .leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .orderBy(desc(payments.paymentDate));

    return results.map(result => ({
      ...result.payment,
      enrollment: {
        studentName: result.enrollment?.studentName || '',
        course: {
          name: result.course?.name || '',
        },
      },
    })) as PaymentWithEnrollment[];
  }

  async getPaymentsByEnrollment(enrollmentId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.enrollmentId, enrollmentId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getStats(): Promise<{
    totalInquiries: number;
    enrolledStudents: number;
    pendingPayments: string;
    overduePayments: number;
    totalCollected: string;
  }> {
    const [inquiryCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(inquiries);

    const [enrollmentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(enrollments);

    const [totalCollected] = await db
      .select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(payments);

    const enrollmentsWithPayments = await this.getAllEnrollments();

    let pendingAmount = 0;
    let overdueCount = 0;
    const today = new Date();

    enrollmentsWithPayments.forEach((enrollment) => {
      const paidAmount = enrollment.payments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount.toString()), 0);
      const totalFee = parseFloat(enrollment.totalFee.toString());
      const balance = totalFee - paidAmount;

      if (balance > 0) {
        pendingAmount += balance;

        // Check if overdue (assuming 30 days from start date for first payment)
        const dueDate = new Date(enrollment.startDate);
        dueDate.setDate(dueDate.getDate() + 30);
        if (today > dueDate && paidAmount === 0) {
          overdueCount++;
        }
      }
    });

    return {
      totalInquiries: inquiryCount.count,
      enrolledStudents: enrollmentCount.count,
      pendingPayments: pendingAmount.toFixed(2),
      overduePayments: overdueCount,
      totalCollected: totalCollected.total || "0",
    };
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    try {
      const [setting] = await db.select().from(settings).where(eq(settings.key, key));
      return setting || undefined;
    } catch (error) {
      console.error("Error getting setting:", error);
      throw error;
    }
  }

  async setSetting(key: string, value: string, description?: string): Promise<Setting> {
    try {
      const [setting] = await db
        .insert(settings)
        .values({ key, value, description })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value,
            updatedAt: new Date(),
            ...(description && { description })
          }
        })
        .returning();
      return setting;
    } catch (error) {
      console.error("Error setting setting:", error);
      throw error;
    }
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    try {
      const [setting] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return setting;
    } catch (error) {
      console.error("Error updating setting:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();