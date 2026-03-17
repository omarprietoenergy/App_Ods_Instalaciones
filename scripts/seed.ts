import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[db:seed] CRITICAL: DATABASE_URL not set.");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";

  if (!adminEmail || !adminPassword) {
    console.error("[db:seed] ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
    process.exit(1);
  }

  console.log("[db:seed] Connecting to PostgreSQL...");
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  try {
    // Check if any admin exists
    const result = await pool.query(
      `SELECT id, email FROM users WHERE role = 'admin' LIMIT 1`
    );

    if (result.rows.length > 0) {
      console.log(
        `[db:seed] Admin already exists: ${result.rows[0].email} (id=${result.rows[0].id}). Skipping.`
      );
      return;
    }

    // Create admin
    console.log(`[db:seed] Creating admin: ${adminEmail}`);
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await pool.query(
      `INSERT INTO users (email, password, name, role, "loginMethod", "createdAt", "updatedAt", "lastSignedIn")
       VALUES ($1, $2, $3, 'admin', 'local', now(), now(), now())
       ON CONFLICT (email) DO UPDATE SET role = 'admin', password = $2, name = $3`,
      [adminEmail, hashedPassword, adminName]
    );

    console.log(`[db:seed] ✅ Admin user created: ${adminEmail}`);
  } catch (error: any) {
    console.error("[db:seed] ❌ Seed failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
