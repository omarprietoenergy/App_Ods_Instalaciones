import { eq, and, desc, sql, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export { eq, and, desc, sql };
import { nanoid } from "nanoid";
import {
  users,
  installations,
  documents,
  dailyReports,
  photos,
  materials,
  auxiliaryContacts,
  installationNotes,
  installationStatusHistory,
  installationAuditLogs,
  technicianDailyAssignments,
  emailTemplates,
  technicianShifts,
  notifications,
  expenses
} from "../drizzle/schema";

export {
  users,
  installations,
  documents,
  dailyReports,
  photos,
  materials,
  auxiliaryContacts,
  installationNotes,
  installationStatusHistory,
  installationAuditLogs,
  technicianDailyAssignments,
  emailTemplates,
  technicianShifts,
  notifications,
  expenses
};

let _db: any = null;
let _pool: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    _db = drizzle(_pool);
  }
  return _db;
}

export async function upsertUser(user: any) {
  const db = await getDb();
  await db.insert(users).values(user).onConflictDoUpdate({
    target: [users.email],
    set: user,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const res = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return res[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const res = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return res[0];
}

export async function createUser(data: any) {
  const db = await getDb();
  return await db.insert(users).values(data).returning();
}

export async function getUserById(id: number) {
  const db = await getDb();
  const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return res[0];
}

export async function getAllUsers() {
  const db = await getDb();
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getTechnicians() {
  const db = await getDb();
  return await db.select().from(users).where(eq(users.role, 'technician')).orderBy(users.name);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  await db.delete(users).where(eq(users.id, id));
}

export async function updateUser(id: number, data: any) {
  const db = await getDb();
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function getAllInstallations() {
  const db = await getDb();
  return await db.select().from(installations).orderBy(desc(installations.createdAt));
}

export async function getInstallationById(id: number) {
  const database = await getDb();
  const res = await database.select().from(installations).where(eq(installations.id, id)).limit(1);
  return res[0];
}

export async function createInstallation(data: any) {
  const db = await getDb();
  return await db.insert(installations).values(data).returning();
}

export async function updateInstallation(id: number, data: any) {
  const db = await getDb();
  await db.update(installations).set(data).where(eq(installations.id, id));
}

export async function deleteInstallation(id: number) {
  const db = await getDb();
  await db.delete(installations).where(eq(installations.id, id));
}

export async function getInstallationsByTechnician(technicianId: number) {
  const db = await getDb();
  return await db.select().from(installations).where(sql`${installations.assignedTechnicianIds}::jsonb @> ${technicianId}::jsonb`);
}

export async function getInstallationsByTechnicianToday(technicianId: number) {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const assignments = await db.select().from(technicianDailyAssignments)
    .where(and(eq(technicianDailyAssignments.technicianId, technicianId), eq(technicianDailyAssignments.date, today)));
  const instIds = assignments.map(a => a.installationId);
  if (instIds.length === 0) return [];
  return await db.select().from(installations).where(sql`${installations.id} IN (${instIds.join(',')})`);
}

export async function getDocumentsByInstallation(installationId: number) {
  const db = await getDb();
  return await db.select().from(documents).where(eq(documents.installationId, installationId)).orderBy(desc(documents.createdAt));
}

export async function createDocument(data: any) {
  const db = await getDb();
  return await db.insert(documents).values(data).returning();
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  await db.delete(documents).where(eq(documents.id, id));
}

export async function createDailyReport(data: any) {
  const db = await getDb();
  return await db.insert(dailyReports).values(data).returning();
}

export async function getDailyReportsByInstallation(installationId: number) {
  const db = await getDb();
  return await db.select().from(dailyReports).where(eq(dailyReports.installationId, installationId)).orderBy(desc(dailyReports.reportDate));
}

export async function getDailyReportById(id: number) {
  const db = await getDb();
  const res = await db.select().from(dailyReports).where(eq(dailyReports.id, id)).limit(1);
  return res[0];
}

export async function updateDailyReport(id: number, data: any) {
  const db = await getDb();
  await db.update(dailyReports).set(data).where(eq(dailyReports.id, id));
}

export async function createPhoto(data: any) {
  const db = await getDb();
  return await db.insert(photos).values(data).returning();
}

export async function getPhotosByDailyReport(dailyReportId: number) {
  const db = await getDb();
  return await db.select().from(photos).where(eq(photos.dailyReportId, dailyReportId)).orderBy(desc(photos.createdAt));
}

export async function deletePhoto(id: number) {
  const db = await getDb();
  await db.delete(photos).where(eq(photos.id, id));
}

export async function createMaterial(data: any) {
  const db = await getDb();
  return await db.insert(materials).values(data).returning();
}

export async function getMaterialsByInstallation(installationId: number) {
  const db = await getDb();
  return await db.select().from(materials).where(eq(materials.installationId, installationId)).orderBy(desc(materials.createdAt));
}

export async function updateMaterial(id: number, data: any) {
  const db = await getDb();
  await db.update(materials).set(data).where(eq(materials.id, id));
}

export async function getPendingMaterials() {
  const db = await getDb();
  return await db.select().from(materials).where(eq(materials.status, 'pending')).orderBy(desc(materials.createdAt));
}

export async function createContact(data: any) {
  const db = await getDb();
  return await db.insert(auxiliaryContacts).values(data).returning();
}

export async function getContactsByInstallation(installationId: number) {
  const db = await getDb();
  return await db.select().from(auxiliaryContacts).where(eq(auxiliaryContacts.installationId, installationId));
}

export async function updateContact(id: number, data: any) {
  const db = await getDb();
  await db.update(auxiliaryContacts).set(data).where(eq(auxiliaryContacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  await db.delete(auxiliaryContacts).where(eq(auxiliaryContacts.id, id));
}

export async function createNote(data: any) {
  const db = await getDb();
  return await db.insert(installationNotes).values(data).returning();
}

export async function getNotesByInstallation(installationId: number) {
  const db = await getDb();
  return await db.select().from(installationNotes).where(eq(installationNotes.installationId, installationId)).orderBy(desc(installationNotes.createdAt));
}

export async function createStatusHistory(data: any) {
  const db = await getDb();
  return await db.insert(installationStatusHistory).values(data).returning();
}

export async function getStatusHistory(installationId: number) {
  const db = await getDb();
  return await db.select().from(installationStatusHistory).where(eq(installationStatusHistory.installationId, installationId)).orderBy(desc(installationStatusHistory.createdAt));
}

export async function createAuditLog(data: any) {
  const db = await getDb();
  return await db.insert(installationAuditLogs).values(data).returning();
}

export async function getAuditLogs(installationId: number) {
  const db = await getDb();
  return await db.select().from(installationAuditLogs).where(eq(installationAuditLogs.installationId, installationId)).orderBy(desc(installationAuditLogs.createdAt));
}

export async function createDailyAssignment(data: any) {
  const db = await getDb();
  return await db.insert(technicianDailyAssignments).values(data).returning();
}

export async function getDailyAssignments(installationId: number, date: string) {
  const db = await getDb();
  return await db.select().from(technicianDailyAssignments)
    .where(and(eq(technicianDailyAssignments.installationId, installationId), eq(technicianDailyAssignments.date, date as any)));
}

export async function updateDailyAssignmentStatus(id: number, status: string) {
  const db = await getDb();
  await db.update(technicianDailyAssignments).set({ status }).where(eq(technicianDailyAssignments.id, id));
}

export async function deleteDailyAssignment(id: number) {
  const db = await getDb();
  await db.delete(technicianDailyAssignments).where(eq(technicianDailyAssignments.id, id));
}

export async function getEmailTemplates() {
  const db = await getDb();
  return await db.select().from(emailTemplates);
}

export async function createEmailTemplate(data: any) {
  const db = await getDb();
  return await db.insert(emailTemplates).values(data).returning();
}

export async function updateEmailTemplate(id: number, data: any) {
  const db = await getDb();
  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

export async function getEmailTemplateByType(type: string) {
  const db = await getDb();
  const res = await db.select().from(emailTemplates).where(eq(emailTemplates.templateType, type as any)).limit(1);
  return res[0];
}

export async function getTechnicianShifts(technicianId: number, date: string) {
  const db = await getDb();
  return await db.select().from(technicianShifts)
    .where(and(eq(technicianShifts.technicianId, technicianId), eq(technicianShifts.date, date as any)));
}

export async function createTechnicianShift(data: any) {
  const db = await getDb();
  return await db.insert(technicianShifts).values(data).returning();
}

export async function updateTechnicianShift(id: number, data: any) {
  const db = await getDb();
  await db.update(technicianShifts).set(data).where(eq(technicianShifts.id, id));
}

export async function getNotifications(userId: number) {
  const db = await getDb();
  return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function createNotification(data: any) {
  const db = await getDb();
  return await db.insert(notifications).values(data).returning();
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function createExpense(data: any) {
  const db = await getDb();
  return await db.insert(expenses).values(data).returning();
}

export async function getExpensesByInstallation(installationId: number) {
  const db = await getDb();
  if (installationId === 0) {
    return await db.select().from(expenses).orderBy(desc(expenses.createdAt));
  }
  return await db.select().from(expenses).where(eq(expenses.installationId, installationId)).orderBy(desc(expenses.createdAt));
}

export async function updateExpense(id: number, data: any) {
  const db = await getDb();
  await db.update(expenses).set(data).where(eq(expenses.id, id));
}

export async function getExpenseById(id: number) {
  const db = await getDb();
  const res = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return res[0];
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  await db.delete(expenses).where(eq(expenses.id, id));
}
