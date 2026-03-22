import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, varchar, decimal, date, time, uniqueIndex, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "project_manager", "technician", "admin_manager"]);
export const workOrderTypeEnum = pgEnum("workOrderType", ["installation", "breakdown", "maintenance"]);
export const statusEnum = pgEnum("status", ["pending", "in_progress", "completed", "cancelled"]);
export const documentTypeEnum = pgEnum("documentType", ["plan", "project", "safety_plan", "contract", "permit", "specification", "conformity", "other"]);
export const materialTypeEnum = pgEnum("materialType", ["received", "requested"]);
export const materialStatusEnum = pgEnum("materialStatus", ["pending", "requested", "approved", "ordered", "received", "incident", "closed", "rejected"]);
export const expenseCategoryEnum = pgEnum("category", ['fuel', 'toll', 'parking', 'hotel', 'meal', 'vehicle_cleaning', 'store_purchase', 'other']);
export const expenseStatusEnum = pgEnum("expenseStatus", ['pending', 'approved', 'rejected', 'pending_invoicing', 'invoiced', 'void']);
export const dailyAssignmentStatusEnum = pgEnum("dailyAssignmentStatus", ["assigned", "working", "paused", "completed"]);
export const approvalStatusEnum = pgEnum("approvalStatus", ["approved", "pending"]);
export const assignmentSourceEnum = pgEnum("assignmentSource", ["pm", "system", "technician"]);
export const templateTypeEnum = pgEnum("templateType", ["installation_started", "installation_completed", "client_conformity"]);
export const shiftStatusEnum = pgEnum("shiftStatus", ["active", "paused", "ended"]);
export const notificationTypeEnum = pgEnum("notificationType", ["assignment_pending", "material_update", "system"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("technician").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Installations table - stores photovoltaic installation projects
 */
export const installations = pgTable("installations", {
  id: serial("id").primaryKey(),
  // Client Info
  clientId: varchar("clientId", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientDocument: varchar("clientDocument", { length: 50 }),
  clientPhone: varchar("clientPhone", { length: 50 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  address: text("address").notNull(),

  // Work Info
  workOrderType: workOrderTypeEnum("workOrderType").default("installation").notNull(),
  workDescription: text("workDescription"),
  installationType: varchar("installationType", { length: 100 }).notNull().default("solar"), 

  // Pricing
  installationPrice: decimal("installationPrice", { precision: 10, scale: 2 }), 
  laborPrice: decimal("laborPrice", { precision: 10, scale: 2 }), 
  budget: varchar("budget", { length: 50 }), 

  // Dates & Status
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: statusEnum("status").default("pending").notNull(),

  // Assignments
  assignedTechnicianIds: jsonb("assignedTechnicianIds"), 

  // Signatures & Conformity
  clientSignatureUrl: text("clientSignatureUrl"),
  clientSignatureDate: timestamp("clientSignatureDate"),
  technicianObservations: text("technicianObservations"),
  conformityPdfUrl: text("conformityPdfUrl"),
  conformityPdfKey: varchar("conformityPdfKey", { length: 500 }),

  createdById: integer("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Installation = typeof installations.$inferSelect;
export type InsertInstallation = typeof installations.$inferInsert;

/**
 * Documents table - stores references to files in S3
 */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: integer("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  documentType: documentTypeEnum("documentType").notNull(),
  description: text("description"), 
  uploadedById: integer("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Daily reports table
 */
export const dailyReports = pgTable("dailyReports", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  userId: integer("userId").notNull(),
  reportDate: timestamp("reportDate").notNull(),
  workDescription: text("workDescription").notNull(),
  hoursWorked: integer("hoursWorked").notNull(),
  signatureUrl: text("signatureUrl"),
  signatureKey: varchar("signatureKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

/**
 * Photos table
 */
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  dailyReportId: integer("dailyReportId").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  caption: text("caption"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

/**
 * Materials table
 */
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  userId: integer("userId").notNull(), 
  type: materialTypeEnum("type").notNull(),
  requestId: varchar("requestId", { length: 100 }), 
  materialName: varchar("materialName", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  description: text("description"),
  supplierName: varchar("supplierName", { length: 255 }),
  deliveryNoteNumber: varchar("deliveryNoteNumber", { length: 100 }),
  deliveryNotePhotoKey: varchar("deliveryNotePhotoKey", { length: 500 }),
  deliveryNotePhotoUrl: text("deliveryNotePhotoUrl"),
  status: materialStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

/**
 * Expenses table
 */
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  userId: integer("userId").notNull(),
  date: date("date").notNull(),
  category: expenseCategoryEnum("category").notNull(),
  vendor: varchar("vendor", { length: 255 }).notNull(),
  documentNumber: varchar("documentNumber", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  receiptPhotoKey: varchar("receiptPhotoKey", { length: 500 }).notNull(),
  receiptPhotoUrl: text("receiptPhotoUrl").notNull(),
  status: expenseStatusEnum("status").default('pending_invoicing').notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Auxiliary Contacts table
 */
export const auxiliaryContacts = pgTable("auxiliaryContacts", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  contactRole: varchar("contactRole", { length: 100 }), // e.g. "Jefe de Mantenimiento"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuxiliaryContact = typeof auxiliaryContacts.$inferSelect;
export type InsertAuxiliaryContact = typeof auxiliaryContacts.$inferInsert;

/**
 * Installation Notes table
 */
export const installationNotes = pgTable("installationNotes", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  userId: integer("userId").notNull(),
  noteText: text("noteText").notNull(),
  parentNoteId: integer("parentNoteId"), // For threading
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstallationNote = typeof installationNotes.$inferSelect;
export type InsertInstallationNote = typeof installationNotes.$inferInsert;

/**
 * Installation Audit Logs (General History)
 */
export const installationAuditLogs = pgTable("installationAuditLogs", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  userId: integer("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'document_upload', 'report_created'
  details: text("details"), // Description of the action
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstallationAuditLog = typeof installationAuditLogs.$inferSelect;
export type InsertInstallationAuditLog = typeof installationAuditLogs.$inferInsert;

/**
 * Technician Daily Assignments
 */
export const technicianDailyAssignments = pgTable("technicianDailyAssignments", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  technicianId: integer("technicianId").notNull(),
  date: date("date").notNull(), // YYYY-MM-DD
  status: dailyAssignmentStatusEnum("status").default("assigned").notNull(),
  approvalStatus: approvalStatusEnum("approvalStatus").default("approved").notNull(),
  assignmentSource: assignmentSourceEnum("assignmentSource").default("pm").notNull(),
  startTime: time("startTime"),
  endTime: time("endTime"),
  totalMinutes: integer("totalMinutes").default(0),
  activeStartTime: timestamp("activeStartTime"),
  totalHours: integer("totalHours").default(0), 
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("unique_assignment").on(t.technicianId, t.installationId, t.date),
}));

export type TechnicianDailyAssignment = typeof technicianDailyAssignments.$inferSelect;
export type InsertTechnicianDailyAssignment = typeof technicianDailyAssignments.$inferInsert;

/**
 * Installation Status History table
 */
export const installationStatusHistory = pgTable("installationStatusHistory", {
  id: serial("id").primaryKey(),
  installationId: integer("installationId").notNull(),
  userId: integer("userId").notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstallationStatusHistory = typeof installationStatusHistory.$inferSelect;
export type InsertInstallationStatusHistory = typeof installationStatusHistory.$inferInsert;

/**
 * Email Templates table
 */
export const emailTemplates = pgTable("emailTemplates", {
  id: serial("id").primaryKey(),
  templateType: templateTypeEnum("templateType").notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(), // HTML
  signature: text("signature"), // HTML
  logoUrl: text("logoUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Technician Shifts (Tablas de Fichaje v15.2)
 */
export const technicianShifts = pgTable("technicianShifts", {
  id: serial("id").primaryKey(),
  technicianId: integer("technicianId").notNull(),
  date: date("date").notNull(),
  status: shiftStatusEnum("status").default("active").notNull(),
  startAt: timestamp("startAt").defaultNow().notNull(),
  endAt: timestamp("endAt"),
  totalMinutes: integer("totalMinutes").default(0),
  activeStartAt: timestamp("activeStartAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("unique_shift").on(t.technicianId, t.date),
}));

export type TechnicianShift = typeof technicianShifts.$inferSelect;
export type InsertTechnicianShift = typeof technicianShifts.$inferInsert;

/**
 * Notifications (v15.2)
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: notificationTypeEnum("type").notNull(),
  installationId: integer("installationId"),
  technicianId: integer("technicianId"),
  date: date("date"),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
