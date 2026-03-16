import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import { getUserByEmail, getDb, eq } from "../db";
import { users } from "../../drizzle/schema";
import bcrypt from "bcryptjs";

export function registerLocalAuthRoutes(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ods-energy-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const db = await getDb();
          if (!db) {
             return done(null, false, { message: "Servicio no disponible: Base de datos no conectada." });
          }

          // Real check if table exists or query fails
          try {
            const user = await getUserByEmail(email);
            if (!user) {
              return done(null, false, { message: "Usuario o contraseña incorrectos." });
            }

            if (!user.password) {
               return done(null, false, { message: "Usuario sin contraseña local. Use otro método de login." });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
              return done(null, false, { message: "Usuario o contraseña incorrectos." });
            }

            return done(null, user);
          } catch (dbErr: any) {
            console.error("[Auth] Database query error:", dbErr);
            if (dbErr.code === '42P01') { // Postgres undefined_table
              return done(null, false, { message: "El sistema no está inicializado. Por favor ejecute las migraciones." });
            }
            return done(null, false, { message: "Error interno al acceder a la base de datos." });
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const db = await getDb();
      if (!db) return done(new Error("DB not available"));
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login fallido" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    res.json(req.user);
  });
}
