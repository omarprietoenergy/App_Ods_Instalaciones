import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrate = async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined");
    }

    console.log("Connecting to database...");
    let connectionString = process.env.DATABASE_URL;
    if (connectionString.includes("@localhost")) {
        console.log("Replacing localhost with 127.0.0.1 for local connection reliability...");
        connectionString = connectionString.replace("@localhost", "@127.0.0.1");
    }

    const connection = await mysql.createConnection(connectionString);
    const db = drizzle(connection);

    console.log("Running migrations...");

    // Point to the 'drizzle' folder where config puts the migrations
    await migrate(db, { migrationsFolder: path.join(__dirname, "drizzle") });

    console.log("Migrations completed successfully!");

    await connection.end();
};

runMigrate().catch((err) => {
    console.error("Migration failed!", err);
    process.exit(1);
});
