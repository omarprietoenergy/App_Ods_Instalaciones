import { getDb, getUserByEmail, eq } from "./db";
import { users } from "../drizzle/schema";
import bcrypt from "bcryptjs";

export async function seedAdminUser() {
  if (process.env.STAGING_BOOTSTRAP_ADMIN !== "true") {
    console.log("[Seed] STAGING_BOOTSTRAP_ADMIN is not 'true'. Skipping admin seeding.");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Seed] CRITICAL: Could not get database instance for seeding.");
    return;
  }

  try {
    // Check if any admin exists
    const existingAdmins = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    
    if (existingAdmins.length > 0) {
      console.log("[Seed] Admin user already exists. Skipping bootstrap seed.");
      return;
    }

    const email = process.env.INITIAL_ADMIN_EMAIL;
    const name = process.env.INITIAL_ADMIN_USERNAME || "Admin";
    const password = process.env.INITIAL_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error("[Seed] ERROR: INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD missing. Seeding aborted.");
      return;
    }

    console.log(`[Seed] Creating initial admin user: ${email}...`);
    
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      email,
      name,
      password: hashedPassword,
      role: "admin",
      loginMethod: "local",
      lastSignedIn: new Date(),
    });

    console.log("[Seed] SUCCESS: Initial admin user created successfully.");
  } catch (error) {
    console.error("[Seed] ERROR: Failed to seed admin user:", error);
  }
}
