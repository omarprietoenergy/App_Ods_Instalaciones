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

let _db: any = null;
let _pool: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    _db = drizzle(_pool);
    console.log("[DB] Pool created with SSL rejectUnauthorized=false");
  }
  return _db;
}

export async function createDocument(data: any) {
  const db = await getDb();
  return await db.insert(documents).values(data).returning();
}

export async function getDocumentsByInstallation(installationId: number) {
  const db = await getDb();
  return await db.select().from(documents).where(eq(documents.installationId, installationId));
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
  return await db.select().from(photos).where(eq(photos.dailyReportId, dailyReportId));
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
  return await db.select().from(materials).where(eq(materials.installationId, installationId));
}

export async function getPendingMaterials() {
  const db = await getDb();
  return await db.select().from(materials).where(eq(materials.status, "pending"));
}

export async function updateMaterial(id: number, data: any) {
  const db = await getDb();
  await db.update(materials).set(data).where(eq(materials.id, id));
}

export async function createContact(data: any) {
  const db = await getDb();
  return await db.insert(auxiliaryContacts).values(data).returning();
}

export async function getContactsByInstallation(installationId: number) {
  const db = await getDb();
  return await db.select().from(auxiliaryContacts).where(eq(auxiliaryContacts.installationId, installationId));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  await db.delete(auxiliaryContacts).where(eq(auxiliaryContacts.id, id));
}

export async function updateContact(id: number, data: any) {
  const db = await getDb();
  await db.update(auxiliaryContacts).set(data).where(eq(auxiliaryContacts.id, id));
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
  await db.insert(installationStatusHistory).values(data);
}

export async function getStatusHistory(installationId: number) {
  const db = await getDb();
  return await db.select().from(installationStatusHistory).where(eq(installationStatusHistory.installationId, installationId)).orderBy(desc(installationStatusHistory.createdAt));
}

export async function createAuditLog(data: any) {
  const db = await getDb();
  await db.insert(installationAuditLogs).values(data);
}

export async function getAuditLogs(installationId: number) {
  const db = await getDb();
  return await db.select().from(installationAuditLogs).where(eq(installationAuditLogs.installationId, installationId)).orderBy(desc(installationAuditLogs.createdAt));
}

export async function createDailyAssignment(data: any) {
  const db = await getDb();
  return await db.insert(technicianDailyAssignments).values(data)
    .onConflictDoUpdate({
      target: [technicianDailyAssignments.technicianId, technicianDailyAssignments.installationId, technicianDailyAssignments.date],
      set: data
    }).returning();
}

export async function getDailyAssignments(technicianId: number, date: string) {
  const db = await getDb();
  return await db.select().from(technicianDailyAssignments).where(and(
    eq(technicianDailyAssignments.technicianId, technicianId),
    eq(technicianDailyAssignments.date, date)
  ));
}

export async function updateDailyAssignmentStatus(id: number, status: any) {
  const db = await getDb();
  await db.update(technicianDailyAssignments).set({ status }).where(eq(technicianDailyAssignments.id, id));
}

export async function deleteDailyAssignment(id: number) {
  const db = await getDb();
  await db.delete(technicianDailyAssignments).where(eq(technicianDailyAssignments.id, id));
}

export async function getShiftByDate(technicianId: number, date: string) {
  const db = await getDb();
  const res = await db.select().from(technicianShifts).where(and(
    eq(technicianShifts.technicianId, technicianId),
    eq(technicianShifts.date, date)
  )).limit(1);
  return res[0];
}

export async function createShift(data: any) {
  const db = await getDb();
  return await db.insert(technicianShifts).values(data).returning();
}

export async function updateShift(id: number, data: any) {
  const db = await getDb();
  await db.update(technicianShifts).set(data).where(eq(technicianShifts.id, id));
}

export async function createNotification(data: any) {
  const db = await getDb();
  await db.insert(notifications).values(data);
}

export async function getUnreadNotifications(technicianId: number) {
  const db = await getDb();
  return await db.select().from(notifications).where(and(
    eq(notifications.technicianId, technicianId),
    sql`read_at IS NULL`
  )).orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  const res = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return res[0];
}

export async function getAllInstallations() {
  const db = await getDb();
  return await db.select().from(installations).orderBy(desc(installations.createdAt));
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const res = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return res[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return res[0];
}

export async function createInstallation(data: any) {
  const database = await getDb();
  return await database.insert(installations).values(data).returning();
}

export async function updateInstallation(id: number, data: any) {
  const database = await getDb();
  await database.update(installations).set(data).where(eq(installations.id, id));
}

export async function deleteInstallation(id: number) {
  const database = await getDb();
  await database.delete(installations).where(eq(installations.id, id));
}

export async function getInstallationById(id: number) {
  const database = await getDb();
  const res = await database.select().from(installations).where(eq(installations.id, id)).limit(1);
  return res[0];
}

export async function getInstallationsByTechnician(technicianId: number) {
  const database = await getDb();
  // Simplified union: assignedTechnicianIds includes tech OR has daily assignment
  // Robust check for assignedTechnicianIds (JSONB)
  const results = await database.select().from(installations).where(
    sql`(${installations.assignedTechnicianIds}::jsonb ? ${String(technicianId)}) OR EXISTS (
      SELECT 1 FROM ${technicianDailyAssignments}
      WHERE ${technicianDailyAssignments.installationId} = ${installations.id}
      AND ${technicianDailyAssignments.technicianId} = ${technicianId}
    )`
  ).orderBy(desc(installations.createdAt));
  return results;
}

export async function getInstallationsByTechnicianToday(technicianId: number) {
  const database = await getDb();
  const todayStr = new Date().toISOString().split('T')[0];
  const results = await database.select({
    installation: installations
  })
    .from(technicianDailyAssignments)
    .innerJoin(installations, eq(technicianDailyAssignments.installationId, installations.id))
    .where(and(
      eq(technicianDailyAssignments.technicianId, technicianId),
      eq(technicianDailyAssignments.date, todayStr)
    ))
    .orderBy(desc(installations.createdAt));
  
  return results.map(r => r.installation);
}

export async function getAssignmentsForTechnician(technicianId: number, date: any) {
  const db = await getDb();
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  
  return await db.select({
    assignment: technicianDailyAssignments,
    installation: installations
  })
    .from(technicianDailyAssignments)
    .leftJoin(installations, eq(technicianDailyAssignments.installationId, installations.id))
    .where(and(
      eq(technicianDailyAssignments.technicianId, technicianId),
      eq(technicianDailyAssignments.date, dateStr)
    ));
}

export async function ensureDailyPlan(technicianId: number, date: any) {
  const db = await getDb();
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  
  const existing = await db.select().from(technicianDailyAssignments).where(and(
    eq(technicianDailyAssignments.technicianId, technicianId),
    eq(technicianDailyAssignments.date, dateStr)
  )).limit(1);
  
  if (existing.length === 0) {
    // If no plan today, copy from last day (optional but often requested in this app)
    // For now, just ensure it returns something or does nothing if empty
    console.log(`[DB] No daily plan found for tech=${technicianId} date=${dateStr}`);
  }
}

export async function autoPauseTechnicianActivities(technicianId: number) {
  const db = await getDb();
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  const activeAssignments = await db.select().from(technicianDailyAssignments).where(and(
    eq(technicianDailyAssignments.technicianId, technicianId),
    eq(technicianDailyAssignments.status, "working")
  ));
  
  for (const assign of activeAssignments) {
    const diff = assign.activeStartTime ? Math.floor((now.getTime() - assign.activeStartTime.getTime()) / 60000) : 0;
    await db.update(technicianDailyAssignments)
      .set({
        status: 'paused',
        activeStartTime: null,
        totalMinutes: (assign.totalMinutes || 0) + diff
      })
      .where(eq(technicianDailyAssignments.id, assign.id));
  }
}

export async function upsertUser(data: any) {
  const db = await getDb();
  return await db.insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: [users.email],
      set: data
    })
    .returning();
}

export { getUserByEmail as getUserByEmailDb };
