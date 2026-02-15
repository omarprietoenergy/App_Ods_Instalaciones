import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, time, uniqueIndex } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "project_manager", "technician", "admin_manager"]).default("technician").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Installations table - stores photovoltaic installation projects
 */
export const installations = mysqlTable("installations", {
  id: int("id").autoincrement().primaryKey(),
  // Client Info
  clientId: varchar("clientId", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientDocument: varchar("clientDocument", { length: 50 }),
  clientPhone: varchar("clientPhone", { length: 50 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  address: text("address").notNull(),

  // Work Info
  workOrderType: mysqlEnum("workOrderType", ["installation", "breakdown", "maintenance"]).default("installation").notNull(),
  workDescription: text("workDescription"),
  installationType: varchar("installationType", { length: 100 }).notNull().default("solar"), // Keep for backward compat or generic type

  // Pricing
  installationPrice: decimal("installationPrice", { precision: 10, scale: 2 }), // Restricted visibility
  laborPrice: decimal("laborPrice", { precision: 10, scale: 2 }), // Visible to all
  budget: varchar("budget", { length: 50 }), // Legacy field, keeping for now

  // Dates & Status
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),

  // Assignments
  assignedTechnicianIds: json("assignedTechnicianIds"), // JSON array of numbers
  // assignedTechnicianId: int("assignedTechnicianId"), // Deprecated/Legacy

  // Signatures & Conformity
  clientSignatureUrl: text("clientSignatureUrl"),
  clientSignatureDate: timestamp("clientSignatureDate"),
  technicianObservations: text("technicianObservations"),
  conformityPdfUrl: text("conformityPdfUrl"),
  conformityPdfKey: varchar("conformityPdfKey", { length: 500 }),

  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installation = typeof installations.$inferSelect;
export type InsertInstallation = typeof installations.$inferInsert;

/**
 * Documents table - stores references to files in S3
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  documentType: mysqlEnum("documentType", [
    "plan", "project", "safety_plan", "contract", "permit", "specification", "conformity", "other"
  ]).notNull(),
  description: text("description"), // For "other" type or general notes
  uploadedById: int("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Daily reports table
 */
export const dailyReports = mysqlTable("dailyReports", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  userId: int("userId").notNull(),
  reportDate: timestamp("reportDate").notNull(),
  workDescription: text("workDescription").notNull(),
  hoursWorked: int("hoursWorked").notNull(),
  signatureUrl: text("signatureUrl"),
  signatureKey: varchar("signatureKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

/**
 * Photos table
 */
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  dailyReportId: int("dailyReportId").notNull(),
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
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  userId: int("userId").notNull(), // Requestor or Receiver
  type: mysqlEnum("type", ["received", "requested"]).notNull(),
  requestId: varchar("requestId", { length: 100 }), // Group ID for multiple items
  materialName: varchar("materialName", { length: 255 }).notNull(),
  quantity: int("quantity").notNull(),
  description: text("description"),
  supplierName: varchar("supplierName", { length: 255 }),
  deliveryNoteNumber: varchar("deliveryNoteNumber", { length: 100 }),
  deliveryNotePhotoKey: varchar("deliveryNotePhotoKey", { length: 500 }),
  deliveryNotePhotoUrl: text("deliveryNotePhotoUrl"),
  status: mysqlEnum("status", ["pending", "requested", "approved", "ordered", "received", "incident", "closed", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

/**
 * Expenses table
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  userId: int("userId").notNull(),
  date: date("date").notNull(),
  category: mysqlEnum("category", ['fuel', 'toll', 'parking', 'hotel', 'meal', 'vehicle_cleaning', 'store_purchase', 'other']).notNull(),
  vendor: varchar("vendor", { length: 255 }).notNull(),
  documentNumber: varchar("documentNumber", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  receiptPhotoKey: varchar("receiptPhotoKey", { length: 500 }).notNull(),
  receiptPhotoUrl: text("receiptPhotoUrl").notNull(),
  status: mysqlEnum("status", ['pending', 'approved', 'rejected', 'pending_invoicing', 'invoiced', 'void']).default('pending_invoicing').notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Auxiliary Contacts table
 */
export const auxiliaryContacts = mysqlTable("auxiliaryContacts", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
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
export const installationNotes = mysqlTable("installationNotes", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  userId: int("userId").notNull(),
  noteText: text("noteText").notNull(),
  parentNoteId: int("parentNoteId"), // For threading
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstallationNote = typeof installationNotes.$inferSelect;
export type InsertInstallationNote = typeof installationNotes.$inferInsert;

/**
 * Installation Audit Logs (General History)
 */
export const installationAuditLogs = mysqlTable("installationAuditLogs", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'document_upload', 'report_created'
  details: text("details"), // Description of the action
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstallationAuditLog = typeof installationAuditLogs.$inferSelect;
export type InsertInstallationAuditLog = typeof installationAuditLogs.$inferInsert;

/**
 * Technician Daily Assignments
 */
export const technicianDailyAssignments = mysqlTable("technicianDailyAssignments", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  technicianId: int("technicianId").notNull(),
  date: date("date").notNull(), // YYYY-MM-DD
  status: mysqlEnum("status", ["assigned", "working", "paused", "completed"]).default("assigned").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["approved", "pending"]).default("approved").notNull(),
  assignmentSource: mysqlEnum("assignmentSource", ["pm", "system", "technician"]).default("pm").notNull(),
  startTime: time("startTime"),
  endTime: time("endTime"),
  totalMinutes: int("totalMinutes").default(0),
  activeStartTime: timestamp("activeStartTime"),
  totalHours: int("totalHours").default(0), // Deprecated, keeping for compatibility
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
export const installationStatusHistory = mysqlTable("installationStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  installationId: int("installationId").notNull(),
  userId: int("userId").notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstallationStatusHistory = typeof installationStatusHistory.$inferSelect;
export type InsertInstallationStatusHistory = typeof installationStatusHistory.$inferInsert;

/**
 * Email Templates table
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  templateType: mysqlEnum("templateType", ["installation_started", "installation_completed", "client_conformity"]).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(), // HTML
  signature: text("signature"), // HTML
  logoUrl: text("logoUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Technician Shifts (Tablas de Fichaje v15.2)
 */
export const technicianShifts = mysqlTable("technicianShifts", {
  id: int("id").autoincrement().primaryKey(),
  technicianId: int("technicianId").notNull(),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["active", "paused", "ended"]).default("active").notNull(),
  startAt: timestamp("startAt").defaultNow().notNull(),
  endAt: timestamp("endAt"),
  totalMinutes: int("totalMinutes").default(0),
  activeStartAt: timestamp("activeStartAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("unique_shift").on(t.technicianId, t.date),
}));

export type TechnicianShift = typeof technicianShifts.$inferSelect;
export type InsertTechnicianShift = typeof technicianShifts.$inferInsert;

/**
 * Notifications (v15.2)
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["assignment_pending", "material_update", "system"]).notNull(),
  installationId: int("installationId"),
  technicianId: int("technicianId"),
  date: date("date"),
  message: text("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;