import bcrypt from "bcryptjs";
import { type Express, type Request, type Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const googleClient = new OAuth2Client();

export function registerLocalAuthRoutes(app: Express) {
    // Local Login
    app.post("/api/auth/login", async (req: Request, res: Response) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        try {
            // Hotfix v15.3.0.1: Fail fast if DB not configured
            const database = await db.getDb();
            if (!database) {
                console.error("[Auth] Database not configured or connection failed");
                return res.status(500).json({ error: "DB_NOT_CONFIGURED: Database connection not available. Check .env configuration." });
            }

            const user = await db.getUserByEmail(email);
            if (!user || !user.password) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                return res.status(401).json({ error: "Invalid credentials" });
            }

            // Fix: Force stable local-ID for session
            const sessionToken = await sdk.createSessionToken(`local-${user.id}`, {
                name: user.name || "",
                expiresInMs: ONE_YEAR_MS,
            });

            const cookieOptions = getSessionCookieOptions(req);
            res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

            res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        } catch (error) {
            console.error("[Auth] Login failed", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Google Login
    app.post("/api/auth/google", async (req: Request, res: Response) => {
        const { credential } = req.body; // Google Identity Services JWT

        if (!credential) {
            return res.status(400).json({ error: "Google credential is required" });
        }

        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                return res.status(400).json({ error: "Invalid Google token" });
            }

            const { email, name, sub: googleId } = payload;

            let user = await db.getUserByEmail(email);

            if (!user) {
                // RESTRICTED: No auto-registration
                console.warn(`[Auth] Blocked registration attempt from unauthorized Google account: ${email}`);
                return res.status(403).json({ error: "No tienes permiso para acceder. Contacta con un administrador." });
            }

            if (!user.openId) {
                // Link google account to existing local account
                await db.upsertUser({
                    ...user,
                    openId: `google-${googleId}`,
                    loginMethod: "google",
                } as any);
                // Re-fetch to get updated user
                user = await db.getUserByEmail(email);
            }

            if (!user) throw new Error("Failed to sync user");

            const sessionToken = await sdk.createSessionToken(user.openId || `google-${googleId}`, {
                name: user.name || "",
                expiresInMs: ONE_YEAR_MS,
            });

            const cookieOptions = getSessionCookieOptions(req);
            res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

            res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        } catch (error) {
            console.error("[Auth] Google Login failed", error);
            res.status(500).json({ error: "Google login failed" });
        }
    });

    // Logout
    app.post("/api/auth/logout", (req: Request, res: Response) => {
        const cookieOptions = getSessionCookieOptions(req);
        res.clearCookie(COOKIE_NAME, cookieOptions);
        res.json({ success: true });
    });
}
