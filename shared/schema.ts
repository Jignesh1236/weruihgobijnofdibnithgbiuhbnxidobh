import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  duration: integer("duration").notNull(), // in months
  fullFee: decimal("full_fee", { precision: 10, scale: 2 }).notNull(),
  installmentFee: decimal("installment_fee", { precision: 10, scale: 2 }).notNull(),
  installment1: decimal("installment1", { precision: 10, scale: 2 }).notNull(),
  installment2: decimal("installment2", { precision: 10, scale: 2 }).notNull(),
  feePlans: text("fee_plans").notNull(), // JSON string containing installment plans
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentName: text("student_name").notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  contactNo: text("contact_no").notNull(),
  address: text("address").notNull(),
  fatherContactNo: text("father_contact_no").notNull(),
  status: text("status").notNull(), // 'pending' | 'confirmed' | 'enrolled'
  batchId: text("batch_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inquiryId: varchar("inquiry_id").references(() => inquiries.id).notNull(),
  studentName: text("student_name").notNull(),
  courseId: varchar("course_id").references(() => courses.id).notNull(),
  contactNo: text("contact_no").notNull(),
  fatherName: text("father_name").notNull(),
  fatherContactNo: text("father_contact_no").notNull(),
  studentEducation: text("student_education").notNull(),
  studentEmail: text("student_email").notNull(),
  studentAddress: text("student_address").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  feePlan: text("fee_plan").notNull(), // 'full' | 'installments'
  totalFee: decimal("total_fee", { precision: 10, scale: 2 }).notNull(),
  batchId: text("batch_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").references(() => enrollments.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMode: text("payment_mode").notNull(), // 'cash' | 'card' | 'upi' | 'bank_transfer'
  transactionId: text("transaction_id"),
  installmentNumber: integer("installment_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings table for persistent configuration
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  course: one(courses, {
    fields: [inquiries.courseId],
    references: [courses.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  inquiry: one(inquiries, {
    fields: [enrollments.inquiryId],
    references: [inquiries.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  inquiries: many(inquiries),
  enrollments: many(enrollments),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const inquiryStatusEnum = pgEnum('inquiry_status', [
  'pending', 
  'contacted', 
  'enrolled', 
  'books_given',
  'exam_completed', 
  'certificate_issued',
  'cancelled'
]);

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(["pending", "confirmed", "enrolled", "books_given", "exam_completed", "certificate_issued"]),
});

// Batch definitions
export const BATCHES = [
  { id: "batch1", name: "Batch 1", time: "7:30 AM - 9:00 AM" },
  { id: "batch2", name: "Batch 2", time: "9:00 AM - 10:30 AM" },
  { id: "batch3", name: "Batch 3", time: "10:30 AM - 12:00 PM" },
  { id: "batch4", name: "Batch 4", time: "12:00 PM - 1:30 PM" },
  { id: "batch5", name: "Batch 5", time: "1:30 PM - 3:00 PM" },
  { id: "batch6", name: "Batch 6", time: "3:00 PM - 4:30 PM" },
  { id: "batch7", name: "Batch 7", time: "4:30 PM - 6:00 PM" },
] as const;

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Inquiry = typeof inquiries.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Extended types with relations
export type InquiryWithCourse = Inquiry & {
  course: Course;
};

export type EnrollmentWithDetails = Enrollment & {
  course: Course;
  inquiry: Inquiry;
  payments: Payment[];
};

export type PaymentWithEnrollment = Payment & {
  enrollment: {
    studentName: string;
    course: {
      name: string;
    };
  };
};