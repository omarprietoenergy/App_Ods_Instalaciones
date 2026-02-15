import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";

export { eq, and, desc, sql };
import { nanoid } from "nanoid";
import fs from "fs";
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
  type InsertUser,
  type InsertInstallation,
  type InsertDocument,
  type InsertDailyReport,
  type InsertPhoto,
  type InsertMaterial,
  type InsertAuxiliaryContact,
  type InsertInstallationNote,
  type InsertInstallationStatusHistory,
  type InsertInstallationAuditLog,
  type InsertTechnicianDailyAssignment,
  type InsertEmailTemplate,
  type Installation,
  technicianShifts,
  notifications,
  expenses,
  type InsertTechnicianShift,
  type InsertNotification,
  type InsertExpense
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { getLocalDateStr } from "./_core/utils";

// Re-export schema tables for use in routers
export { installations, installationStatusHistory, dailyReports, technicianDailyAssignments, technicianShifts, notifications, materials, expenses };

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Robust parsing for MySQL connection string
      // mysql://user:pass@host:port/dbname
      const connectionString = process.env.DATABASE_URL;
      console.log("[Database] Initializing connection with static mysql2 pool (non-promise callback version)...");

      const pool = mysql.createPool(connectionString);
      _db = drizzle(pool);
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: any = {};
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "password", "openId"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = (user as any)[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Use email as unique identifier if openId is missing
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(userData: {
  openId: string;
  name: string;
  email: string;
  role: "admin" | "project_manager" | "technician" | "admin_manager";
  loginMethod: string;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(users).values({
    openId: userData.openId,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    loginMethod: userData.loginMethod,
    lastSignedIn: new Date(),
  });
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(users).where(eq(users.id, userId));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(users).set(data).where(eq(users.id, id));
}

// TODO: add feature queries here as your schema grows.

export async function getAllInstallations() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(installations).orderBy(desc(installations.createdAt));
}

export async function getInstallationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(installations).where(eq(installations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Data Cleanup Logic for V14.1
let isCleanupDone = false;
async function runDataCleanup(db: any) {
  if (isCleanupDone) return;
  isCleanupDone = true;

  console.log("[DataCleanup] Running maintenance tasks for V14.2...");
  try {
    // 1. Fix broken Technician IDs
    const allInst = await db.select().from(installations);
    for (const inst of allInst) {
      let needsUpdate = false;
      let newIds: number[] = [];
      const raw = inst.assignedTechnicianIds;

      if (Array.isArray(raw)) {
        newIds = raw.map(id => Number(id));
      } else if (typeof raw === 'string') {
        try {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) newIds = p.map(id => Number(id));
        } catch { }
      }

      const mappedIds = newIds.map(id => {
        if (id === 775) { needsUpdate = true; return 3367; }
        if (id === 2076) { needsUpdate = true; return 3232; }
        return id;
      });

      if (needsUpdate) {
        console.log(`[DataCleanup] Fixing Inst #${inst.id}: ${JSON.stringify(newIds)} -> ${JSON.stringify(mappedIds)}`);
        await db.update(installations).set({
          assignedTechnicianIds: mappedIds
        }).where(eq(installations.id, inst.id));
      }
    }

    // 2. Fix generic or NULL openIds for local users
    const allUsers = await db.select().from(users).where(eq(users.loginMethod, "local"));
    for (const u of allUsers) {
      if (!u.openId || u.openId === "local" || u.openId === "local-undefined") {
        const newOpenId = `local-${u.id}-${nanoid(6)}`;
        console.log(`[DataCleanup] Normalizing openId for user ${u.email}: ${u.openId} -> ${newOpenId}`);
        await db.update(users).set({ openId: newOpenId }).where(eq(users.id, u.id));
      }
    }

    console.log("[DataCleanup] All maintenance tasks completed.");

    // 3. Deduplicate Daily Assignments (Safety for Unique Index)
    await deduplicateAssignments(db);

  } catch (err) {
    console.error("[DataCleanup] Error in maintenance tasks:", err);
  }
}

async function deduplicateAssignments(db: any) {
  try {
    const all = await db.select().from(technicianDailyAssignments);
    const seen = new Set<string>();
    const toDelete: number[] = [];

    // Sort by id desc (keep newest)
    all.sort((a: any, b: any) => b.id - a.id);

    for (const a of all) {
      const key = `${a.technicianId}-${a.installationId}-${a.date}`;
      if (seen.has(key)) {
        toDelete.push(a.id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      console.log(`[DataCleanup] Removing ${toDelete.length} duplicate assignments...`);
      for (const id of toDelete) {
        await db.delete(technicianDailyAssignments).where(eq(technicianDailyAssignments.id, id));
      }
    }
  } catch (e) {
    console.error("[DataCleanup] Deduplication failed:", e);
  }
}

// Helper to check if a technician is assigned (supports installations table and daily assignments)
export async function getInstallationsByTechnician(technicianId: number) {
  const db = await getDb();
  if (!db) return [];

  // Run cleanup once background
  runDataCleanup(db).catch(() => { });

  console.log(`[Diagnostic] Fetching installations for technicianId: ${technicianId}`);

  // Fetch everything to merge manually (usually list is small enough < 1000)
  const allInstallations = await db.select().from(installations).orderBy(desc(installations.createdAt));

  // 1. Check permanent assignments (installations table)
  const installationsFromTable = allInstallations.filter(inst => {
    const rawIds = inst.assignedTechnicianIds;
    const legacyId = (inst as any).assignedTechnicianId;
    let parsedIds: number[] = [];

    // Check legacy field if it exists
    if (legacyId && Number(legacyId) === Number(technicianId)) return true;

    // Check JSON array
    if (Array.isArray(rawIds)) {
      parsedIds = rawIds.map(id => Number(id));
    } else if (typeof rawIds === 'string') {
      const trimmed = rawIds.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsedIds = parsed.map(id => Number(id));
        } catch { }
      } else if (trimmed.includes(',')) {
        parsedIds = trimmed.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
      } else if (trimmed.length > 0) {
        const num = Number(trimmed);
        if (!isNaN(num)) parsedIds = [num];
      }
    }

    return parsedIds.includes(Number(technicianId));
  });

  // 2. Check daily assignments for today (technicianDailyAssignments)
  const todayStr = getLocalDateStr();
  const daily = await db.select().from(technicianDailyAssignments).where(and(
    eq(technicianDailyAssignments.technicianId, technicianId),
    eq(technicianDailyAssignments.date, todayStr as any)
  ));
  const dailyIndices = new Set(daily.map(d => d.installationId));

  // Merge (ensure uniqueness)
  const tableIds = new Set(installationsFromTable.map(i => i.id));
  const merged = [...installationsFromTable];

  for (const inst of allInstallations) {
    if (dailyIndices.has(inst.id) && !tableIds.has(inst.id)) {
      merged.push(inst);
    }
  }

  const diagMsg = `[Diagnostic] userId: ${technicianId}, ficha: ${installationsFromTable.length}, daily: ${daily.length}, final: ${merged.length}`;
  console.error(diagMsg);
  if (process.env.DIAGNOSTIC_LOG === "1") {
    try {
      const logLine = `[${new Date().toISOString()}] ${diagMsg}\n`;
      fs.appendFileSync('/home/puipcivu/logs/ods-node.log', logLine);
    } catch (e) {
      console.error("[Diagnostic] Error writing to log file:", e);
    }
  }

  return merged;
}

// Strictly only today's assignments (technicianDailyAssignments)
export async function getInstallationsByTechnicianToday(technicianId: number) {
  const db = await getDb();
  if (!db) return [];

  // Robust "Today" calculation in local time (YYYY-MM-DD)
  // This avoids UTC offsets pushing assignments to the previous/next day
  const todayStr = getLocalDateStr(); // Uses Europe/Madrid
  console.error(`[Diagnostic-Today] Fetching ONLY daily assignments for technicianId: ${technicianId}, date: ${todayStr}`);

  const daily = await db.select().from(technicianDailyAssignments).where(and(
    eq(technicianDailyAssignments.technicianId, technicianId),
    eq(technicianDailyAssignments.date, todayStr as any)
  ));

  const dailyIndices = new Set(daily.map(d => d.installationId));
  const allInstallations = await db.select().from(installations);

  const filtered = allInstallations.filter(inst => dailyIndices.has(inst.id));

  const diagMsg = `[Diagnostic-Today] userId: ${technicianId}, daily_found: ${filtered.length}`;
  console.error(diagMsg);
  if (process.env.DIAGNOSTIC_LOG === "1") {
    try {
      const logLine = `[${new Date().toISOString()}] ${diagMsg}\n`;
      fs.appendFileSync('/home/puipcivu/logs/ods-node.log', logLine);
    } catch (e) {
      console.error("[Diagnostic] Error writing to log file:", e);
    }
  }

  return filtered;
}

/**
 * Normalizes assignedTechnicianIds to ensure it's ALWAYS a valid JSON array string (at least '[]').
 * This prevents empty strings "" or "null" or null from being saved.
 */
function normalizeAssignedIds(ids: any): any {
  if (ids === undefined) return undefined;
  // Force [] for any empty/invalid state
  if (ids === null || ids === "" || ids === "null" || ids === "\"\"" || ids === "[]") return [];

  if (Array.isArray(ids)) {
    return ids.length > 0 ? ids : [];
  }
  // If it's already a string, try to parse it
  if (typeof ids === 'string') {
    try {
      const parsed = JSON.parse(ids);
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed : [];
      }
    } catch { }
  }
  // If we can't figure it out, return empty array to be safe
  return [];
}

export async function createInstallation(installation: InsertInstallation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalized = { ...installation };
  normalized.assignedTechnicianIds = normalizeAssignedIds(normalized.assignedTechnicianIds);

  const result = await db.insert(installations).values(normalized);
  return result;
}

export async function updateInstallation(id: number, data: Partial<InsertInstallation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalized = { ...data };
  if (normalized.assignedTechnicianIds !== undefined) {
    normalized.assignedTechnicianIds = normalizeAssignedIds(normalized.assignedTechnicianIds);
  }

  await db.update(installations).set(normalized).where(eq(installations.id, id));
}

export async function deleteInstallation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(installations).where(eq(installations.id, id));
}

// Document queries
export async function getDocumentsByInstallation(installationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(documents)
    .where(eq(documents.installationId, installationId))
    .orderBy(desc(documents.createdAt));
}

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(documents).values(document);
  return result;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(documents).where(eq(documents.id, id));
}

// Daily report queries
export async function getDailyReportsByInstallation(installationId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(dailyReports)
    .where(eq(dailyReports.installationId, installationId))
    .orderBy(desc(dailyReports.reportDate));
}

export async function getDailyReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(dailyReports).where(eq(dailyReports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDailyReport(report: InsertDailyReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dailyReports).values(report);
  return result;
}

export async function updateDailyReport(id: number, data: Partial<InsertDailyReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dailyReports).set(data).where(eq(dailyReports.id, id));
}

// Photo queries
export async function getPhotosByDailyReport(dailyReportId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(photos)
    .where(eq(photos.dailyReportId, dailyReportId))
    .orderBy(desc(photos.createdAt));
}

export async function createPhoto(photo: InsertPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(photos).values(photo);
  return result;
}

export async function deletePhoto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(photos).where(eq(photos.id, id));
}

// Materials queries
export async function getMaterialsByInstallation(installationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(materials)
    .where(eq(materials.installationId, installationId))
    .orderBy(desc(materials.createdAt));
}

export async function getPendingMaterials() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(materials)
    .where(eq(materials.status, 'pending'))
    .orderBy(desc(materials.createdAt));
}

export async function createMaterial(material: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(materials).values(material);
}

export async function updateMaterial(id: number, data: Partial<InsertMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(materials).set(data).where(eq(materials.id, id));
}

// Auxiliary Contacts queries
export async function getContactsByInstallation(installationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auxiliaryContacts)
    .where(eq(auxiliaryContacts.installationId, installationId));
}

export async function createContact(contact: InsertAuxiliaryContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(auxiliaryContacts).values(contact);
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(auxiliaryContacts).where(eq(auxiliaryContacts.id, id));
}

export async function updateContact(id: number, data: Partial<InsertAuxiliaryContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(auxiliaryContacts).set(data).where(eq(auxiliaryContacts.id, id));
}

// Installation Notes
export async function getNotesByInstallation(installationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(installationNotes)
    .where(eq(installationNotes.installationId, installationId))
    .orderBy(desc(installationNotes.createdAt));
}

export async function createNote(note: InsertInstallationNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(installationNotes).values(note);
}

// Status History
export async function createStatusHistory(history: InsertInstallationStatusHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(installationStatusHistory).values(history);
}

export async function getStatusHistory(installationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(installationStatusHistory)
    .where(eq(installationStatusHistory.installationId, installationId))
    .orderBy(desc(installationStatusHistory.createdAt));
}

// Audit Logs
export async function createAuditLog(log: InsertInstallationAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(installationAuditLogs).values(log);
}

export async function getAuditLogs(installationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(installationAuditLogs)
    .where(eq(installationAuditLogs.installationId, installationId))
    .orderBy(desc(installationAuditLogs.createdAt));
}



// Daily Assignments
export async function getDailyAssignments(installationId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  // Note: date input should be 'YYYY-MM-DD' literal string comparison or Date object handling depending on driver.
  // Mysql2 date columns returned as Date objects usually.
  return await db.select().from(technicianDailyAssignments)
    .where(and(
      eq(technicianDailyAssignments.installationId, installationId),
      eq(technicianDailyAssignments.date, date as any)
    ));
}

export async function createDailyAssignment(assignment: InsertTechnicianDailyAssignment) {
  const db = await getDb();
  if (!db) throw new Error("DB error");
  return await db.insert(technicianDailyAssignments).values(assignment);
}

export async function updateDailyAssignmentStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("DB error");

  // Logic: if status 'working', set startTime? If 'completed', set endTime?
  // Use generic update for now or specific logic?
  // Let's just update fields.
  const updates: any = { status };
  if (status === 'working') {
    // updates.startTime = ... (Need to handle Time type)
  }
  return await db.update(technicianDailyAssignments)
    .set(updates)
    .where(eq(technicianDailyAssignments.id, id));
}

export async function deleteDailyAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB error");
  return await db.delete(technicianDailyAssignments).where(eq(technicianDailyAssignments.id, id));
}

// Email Templates
const DEFAULT_TEMPLATES = [
  {
    templateType: "installation_started",
    subject: "Su instalación fotovoltaica ha comenzado - {{clientName}}",
    body: `<p>Hola {{clientName}},</p>
<p>Le informamos que su instalación fotovoltaica con número de expediente {{clientId}} ha sido iniciada hoy {{startDate}}.</p>
<p>Nuestros técnicos están trabajando en su domicilio en {{address}}.</p>
<div style="margin-top: 20px;">
  <img src="{{logoUrl}}" alt="ODS Energy" style="max-width: 200px;">
</div>`,
    signature: "<p>Un saludo,<br>Equipo ODS Energy</p>",
    logoUrl: "https://app.odsenergy.net/logo.png",
    isActive: 1
  },
  {
    templateType: "installation_completed",
    subject: "Finalización de instalación fotovoltaica - {{clientId}}",
    body: `<p>Estimado/a {{clientName}},</p>
<p>Nos complace informarle que la instalación fotovoltaica {{clientId}} ha sido completada con éxito hoy {{endDate}}.</p>
<p>Gracias por confiar en ODS Energy.</p>
<div style="margin-top: 20px;">
  <img src="{{logoUrl}}" alt="ODS Energy" style="max-width: 200px;">
</div>`,
    signature: "<p>Un saludo,<br>Equipo ODS Energy</p>",
    logoUrl: "https://app.odsenergy.net/logo.png",
    isActive: 1
  },
  {
    templateType: "client_conformity",
    subject: "Documento de Conformidad - {{clientName}}",
    body: `<p>Hola {{clientName}},</p>
<p>Adjuntamos el documento de conformidad firmado para su instalación {{clientId}} con fecha {{signatureDate}}.</p>
<p>Un saludo,</p>
<p>Equipo ODS Energy</p>
<div style="margin-top: 20px;">
  <img src="{{logoUrl}}" alt="ODS Energy" style="max-width: 200px;">
</div>`,
    signature: "<p>Equipo ODS Energy</p>",
    logoUrl: "https://app.odsenergy.net/logo.png",
    isActive: 1
  }
];

export async function ensureDefaultTemplates() {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(emailTemplates);
  const existingTypes = new Set(existing.map(t => t.templateType));

  for (const def of DEFAULT_TEMPLATES) {
    if (!existingTypes.has(def.templateType as any)) {
      console.log(`[Database] Seeding default template: ${def.templateType}`);
      await db.insert(emailTemplates).values({
        ...def,
        templateType: def.templateType as any,
        isActive: def.isActive === 1
      });
    }
  }
}

export async function getEmailTemplates() {
  const db = await getDb();
  if (!db) return [];

  // Auto-ensure defaults
  await ensureDefaultTemplates();

  return await db.select().from(emailTemplates);
}

export async function getEmailTemplateByType(templateType: "installation_started" | "installation_completed" | "client_conformity") {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.templateType, templateType)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmailTemplate(data: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(emailTemplates).values(data);
}

export async function updateEmailTemplate(id: number, data: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}


// User queries
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getTechnicians() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users)
    .where(eq(users.role, 'technician'))
    .orderBy(users.name);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Expenses queries
export async function getExpensesByInstallation(installationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(expenses)
    .where(eq(expenses.installationId, installationId))
    .orderBy(desc(expenses.createdAt));
}

export async function createExpense(expense: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(expenses).values(expense);
}

export async function updateExpense(id: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(expenses).set(data).where(eq(expenses.id, id));
}

export async function getExpenseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function getTechnicianPerformance() {
  const db = await getDb();
  if (!db) return [];

  // Get all technicians
  const technicians = await db.select().from(users).where(eq(users.role, 'technician'));
  const result = [];

  for (const tech of technicians) {
    // 1. Total Daily Reports Hours
    const reports = await db.select().from(dailyReports).where(eq(dailyReports.userId, tech.id));
    const totalHoursWorked = reports.reduce((sum, r) => sum + r.hoursWorked, 0);

    // 2. Completed Installations (where technician is assigned)
    // AssignedTechnicianIds is JSON array. Drizzle doesn't support easy JSON array contains query in all drivers.
    // We will filter in memory for now or use raw sql if needed. Memory ok for small scale.
    const allInstallations = await db.select().from(installations);
    const completedInstallations = allInstallations.filter(i => {
      const assigned = i.assignedTechnicianIds as number[] | null;
      return i.status === 'completed' && Array.isArray(assigned) && assigned.includes(tech.id);
    });

    // 3. Avg Completion Time
    let totalDays = 0;
    let countWithDates = 0;
    completedInstallations.forEach(i => {
      if (i.startDate && i.endDate) {
        const diffTime = Math.abs(new Date(i.endDate).getTime() - new Date(i.startDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDays += diffDays;
        countWithDates++;
      }
    });

    result.push({
      id: tech.id,
      name: tech.name,
      totalHoursWorked,
      completedInstallations: completedInstallations.length,
      avgCompletionTime: countWithDates > 0 ? Math.round(totalDays / countWithDates) : 0
    });
  }

  return result;
}

export async function getMaterialsAnalysis() {
  const db = await getDb();
  if (!db) return [];

  const allMaterials = await db.select().from(materials);

  // Group by name
  const counts: Record<string, { name: string, quantity: number, requests: number }> = {};

  allMaterials.forEach(m => {
    if (!counts[m.materialName]) {
      counts[m.materialName] = { name: m.materialName, quantity: 0, requests: 0 };
    }
    counts[m.materialName].quantity += m.quantity;
    counts[m.materialName].requests += 1;
  });

  // Sort by quantitydesc
  return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
}

export async function getWorkTrends() {
  const db = await getDb();
  if (!db) return [];

  const allInstallations = await db.select().from(installations);

  // Group by Month (last 12 months)
  const trends: Record<string, { name: string, installations: number, breakdowns: number, maintenance: number }> = {};

  allInstallations.forEach(i => {
    if (!i.startDate) return;
    const date = new Date(i.startDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('default', { month: 'short' });

    if (!trends[key]) {
      trends[key] = { name: monthName, installations: 0, breakdowns: 0, maintenance: 0 };
    }

    if (i.workOrderType === 'installation') trends[key].installations++;
    else if (i.workOrderType === 'breakdown') trends[key].breakdowns++;
    else if (i.workOrderType === 'maintenance') trends[key].maintenance++;
  });

  // Convert to array and sort
  return Object.entries(trends)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(entry => entry[1]);
}

// Technician Shifts (Fichaje)
export async function getShiftByDate(technicianId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  // date string YYYY-MM-DD
  const result = await db.select().from(technicianShifts).where(and(
    eq(technicianShifts.technicianId, technicianId),
    eq(technicianShifts.date, date as any)
  )).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createShift(shift: InsertTechnicianShift) {
  const db = await getDb();
  if (!db) throw new Error("DB error");
  return await db.insert(technicianShifts).values(shift);
}

export async function updateShift(id: number, data: Partial<InsertTechnicianShift>) {
  const db = await getDb();
  if (!db) throw new Error("DB error");
  await db.update(technicianShifts).set(data).where(eq(technicianShifts.id, id));
}

// Notifications
export async function createNotification(notif: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("DB error");
  return await db.insert(notifications).values(notif);
}

export async function getUnreadNotifications(userId?: number, type?: string) {
  const db = await getDb();
  if (!db) return [];

  if (type) {
    return await db.select().from(notifications).where(and(
      sql`readAt IS NULL`,
      eq(notifications.type, type as any)
    )).orderBy(desc(notifications.createdAt));
  }

  return await db.select().from(notifications)
    .where(sql`readAt IS NULL`)
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB error");
  await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, id));
}

// Logic: Ensure Plan (Calendar-aware v15.2.3 reconciled)
export async function ensureDailyPlan(technicianId: number, date: Date | string) {
  const db = await getDb();
  if (!db) return;

  const dateStr = getLocalDateStr(date);
  const requestedDate = new Date(dateStr);

  // 1. PRIMARY SOURCE: Master Calendar (installations table ranges)
  const allInstallations = await db.select().from(installations).where(and(
    sql`status NOT IN ('completed', 'cancelled')`
  ));

  const calendarItems = allInstallations.filter(inst => {
    // Check if tech is assigned
    const rawIds = inst.assignedTechnicianIds;
    const legacyId = (inst as any).assignedTechnicianId;
    let parsedIds: number[] = [];

    if (legacyId && Number(legacyId) === Number(technicianId)) {
      parsedIds.push(Number(legacyId));
    }

    if (Array.isArray(rawIds)) {
      parsedIds = [...parsedIds, ...rawIds.map(id => Number(id))];
    } else if (typeof rawIds === 'string' && rawIds.trim().length > 0) {
      try {
        const p = JSON.parse(rawIds);
        if (Array.isArray(p)) parsedIds = [...parsedIds, ...p.map(id => Number(id))];
      } catch {
        if (rawIds.includes(',')) {
          parsedIds = [...parsedIds, ...rawIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))];
        } else {
          const num = Number(rawIds.trim());
          if (!isNaN(num)) parsedIds.push(num);
        }
      }
    }

    if (!parsedIds.includes(Number(technicianId))) return false;

    // Check Date Range logic
    if (!inst.startDate) return false;
    const startStr = getLocalDateStr(inst.startDate);
    const endStr = inst.endDate ? getLocalDateStr(inst.endDate) : startStr;

    return dateStr >= startStr && dateStr <= endStr;
  });

  // 2. Fetch current daily assignments for this date
  const existing = await db.select().from(technicianDailyAssignments).where(and(
    eq(technicianDailyAssignments.technicianId, technicianId),
    eq(technicianDailyAssignments.date, dateStr as any)
  ));

  if (calendarItems.length > 0) {
    // RECONCILE: Add missing, remove stale system ones
    const calendarIds = new Set(calendarItems.map(c => c.id));
    const existingInstallationIds = new Set(existing.map(e => e.installationId));

    // Remove stale 'system' assignments
    const toRemove = existing.filter(e => e.assignmentSource === 'system' && !calendarIds.has(e.installationId));
    for (const r of toRemove) {
      await db.delete(technicianDailyAssignments).where(eq(technicianDailyAssignments.id, r.id));
    }

    // Add missing calendar items
    const toAdd = calendarItems.filter(c => !existingInstallationIds.has(c.id));
    for (const inst of toAdd) {
      await db.insert(technicianDailyAssignments).values({
        technicianId,
        installationId: inst.id,
        date: dateStr as any,
        status: 'assigned',
        approvalStatus: 'approved',
        assignmentSource: 'system',
        totalMinutes: 0
      });
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
      console.log(`[DailyPlan] reconciled date=${dateStr} tech=${technicianId} added=${toAdd.length} removed=${toRemove.length}`);
    }
    return;
  }

  // 3. FALLBACK SOURCE: Clone if NO calendar and NO existing plan
  if (existing.length === 0) {
    console.log(`[DailyPlan] date=${dateStr} tech=${technicianId} source=search-clonable`);
    let foundAssignments: any[] = [];
    let clonedFrom = "";

    for (let i = 1; i <= 5; i++) {
      const sourceDate = new Date(requestedDate);
      sourceDate.setDate(sourceDate.getDate() - i);
      const sDateStr = getLocalDateStr(sourceDate);

      const prev = await db.select().from(technicianDailyAssignments).where(and(
        eq(technicianDailyAssignments.technicianId, technicianId),
        eq(technicianDailyAssignments.date, sDateStr as any)
      ));

      if (prev.length > 0) {
        foundAssignments = prev.filter(p => !['completed', 'cancelled'].includes(p.status as any));
        clonedFrom = sDateStr;
        break;
      }
    }

    if (foundAssignments.length > 0) {
      for (const assign of foundAssignments) {
        await db.insert(technicianDailyAssignments).values({
          technicianId,
          installationId: assign.installationId,
          date: dateStr as any,
          status: 'assigned',
          approvalStatus: 'approved',
          assignmentSource: 'system',
          totalMinutes: 0
        });
      }
      console.log(`[DailyPlan] date=${dateStr} tech=${technicianId} source=clone count=${foundAssignments.length} from=${clonedFrom}`);
    } else {
      console.log(`[DailyPlan] date=${dateStr} tech=${technicianId} source=none count=0`);
    }
  }
}

// Activity Logic Helpers
export async function getAssignmentsForTechnician(technicianId: number, date: Date | string) {
  const db = await getDb();
  if (!db) return [];
  const dateStr = getLocalDateStr(date);

  // We need to join with installations to get details
  // Using explicit join if possible or just fetch raw assignments + separate fetch?
  // Drizzle select().from(assignments).leftJoin(...)
  // Given we need installation title, address, type.
  return await db.select({
    assignment: technicianDailyAssignments,
    installation: installations
  })
    .from(technicianDailyAssignments)
    .leftJoin(installations, eq(technicianDailyAssignments.installationId, installations.id))
    .where(and(
      eq(technicianDailyAssignments.technicianId, technicianId),
      eq(technicianDailyAssignments.date, dateStr as any)
    ));
}

export async function autoPauseTechnicianActivities(technicianId: number) {
  const db = await getDb();
  if (!db) return;

  // Find currently working assignment
  const working = await db.select().from(technicianDailyAssignments).where(and(
    eq(technicianDailyAssignments.technicianId, technicianId),
    eq(technicianDailyAssignments.status, 'working')
  ));

  for (const assign of working) {
    const now = new Date();
    const diff = assign.activeStartTime ? Math.floor((now.getTime() - assign.activeStartTime.getTime()) / 60000) : 0;

    await db.update(technicianDailyAssignments)
      .set({
        status: 'paused',
        totalMinutes: (assign.totalMinutes || 0) + diff,
        activeStartTime: null
      })
      .where(eq(technicianDailyAssignments.id, assign.id));

    console.log(`[AutoPause] Paused assignment ${assign.id} for user ${technicianId}. Added ${diff} min.`);
  }
}
