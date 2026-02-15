
import { sql } from "drizzle-orm";
import { getDb } from "./db";

export async function runMigrations() {
    // Hotfix v15.3: Skip migrations in production by default to avoid permission errors
    if (process.env.NODE_ENV === 'production' && process.env.RUN_MIGRATIONS !== 'true') {
        console.log("[Migration] Skipped in production (RUN_MIGRATIONS != true).");
        return;
    }

    console.log("[Migration] Checking database schema...");
    const db = await getDb();
    if (!db) {
        console.error("[Migration] DB not available, skipping migrations.");
        return;
    }

    try {
        // 1. Add description column to documents if not exists
        try {
            // Robust way for MySQL 5.7/8.0 without native "IF NOT EXISTS" for columns
            const [columns]: any = await db.execute(sql`SHOW COLUMNS FROM documents LIKE 'description'`);
            if (Array.isArray(columns) && columns.length === 0) {
                await db.execute(sql`ALTER TABLE documents ADD COLUMN description TEXT`);
                console.log("[Migration] Added 'description' column to documents.");
            } else {
                console.log("[Migration] 'description' column already exists in documents.");
            }
        } catch (err: any) {
            console.error("[Migration] Error checking/adding description column:", err);
        }

        // 2. Create installationAuditLogs
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS installationAuditLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        installationId INT NOT NULL,
        userId INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log("[Migration] Checked/Created installationAuditLogs table.");

        // 3. Create technicianDailyAssignments
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS technicianDailyAssignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        installationId INT NOT NULL,
        technicianId INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('assigned', 'working', 'paused', 'completed') NOT NULL DEFAULT 'assigned',
        startTime TIME,
        endTime TIME,
        totalHours INT DEFAULT 0,
        notes TEXT,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log("[Migration] Checked/Created technicianDailyAssignments table.");

        // 4. Update technicianDailyAssignments (v15.2)
        try {
            const [columns]: any = await db.execute(sql`SHOW COLUMNS FROM technicianDailyAssignments LIKE 'approvalStatus'`);
            if (Array.isArray(columns) && columns.length === 0) {
                await db.execute(sql`
                    ALTER TABLE technicianDailyAssignments 
                    ADD COLUMN approvalStatus ENUM('approved', 'pending') DEFAULT 'approved' NOT NULL,
                    ADD COLUMN assignmentSource ENUM('pm', 'system', 'technician') DEFAULT 'pm' NOT NULL,
                    ADD COLUMN totalMinutes INT DEFAULT 0,
                    ADD COLUMN activeStartTime TIMESTAMP NULL,
                    ADD UNIQUE INDEX unique_assignment (technicianId, installationId, date);
                `);
                console.log("[Migration] Extended technicianDailyAssignments (v15.2).");
            }
        } catch (err) {
            console.error("[Migration] Error updating technicianDailyAssignments:", err);
        }

        // 5. Create technicianShifts (v15.2)
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS technicianShifts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                technicianId INT NOT NULL,
                date DATE NOT NULL,
                status ENUM('active', 'paused', 'ended') NOT NULL DEFAULT 'active',
                startAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                endAt TIMESTAMP NULL,
                totalMinutes INT DEFAULT 0,
                activeStartAt TIMESTAMP NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_shift (technicianId, date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("[Migration] Checked/Created technicianShifts table.");

        // 6. Create notifications (v15.2)
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('assignment_pending', 'material_update', 'system') NOT NULL,
                installationId INT,
                technicianId INT,
                date DATE,
                message TEXT NOT NULL,
                readAt TIMESTAMP NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("[Migration] Checked/Created notifications table.");

        // 7. Update expenses status enum (v15.3 P1)
        try {
            // Check if 'pending_invoicing' exists in column definition (naive check or just try alter)
            // MySQL ENUM updates are idempotent if we provide the full list.
            await db.execute(sql`
                ALTER TABLE expenses MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'pending_invoicing', 'invoiced', 'void') NOT NULL DEFAULT 'pending_invoicing';
            `);
            console.log("[Migration] Updated expenses status enum.");
        } catch (err) {
            console.error("[Migration] Error updating expenses status:", err);
        }

        console.log("[Migration] Schema check complete.");
    } catch (error) {
        console.error("[Migration] Critical Check Failed:", error);
    }
}
