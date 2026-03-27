import bcrypt from "bcryptjs";
import { Express } from "express";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { count, inArray, desc, eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import superjson from "superjson";
import archiver from "archiver";

const t = initTRPC.context<any>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return opts.next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: protectedProcedure.mutation(async ({ ctx }) => {
      ctx.req.logout((err: any) => {
        if (err) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      });
    }),
  }),

  users: router({
    list: protectedProcedure.query(async () => await db.getAllUsers()),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'project_manager', 'technician', 'admin_manager']),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const hashedPassword = await bcrypt.hash(input.password, 10);
        return await db.createUser({
          ...input,
          password: hashedPassword,
          openId: `local-${nanoid(10)}`,
          loginMethod: "local",
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(['admin', 'project_manager', 'technician', 'admin_manager']).optional(),
        password: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.password) {
          data.password = await bcrypt.hash(data.password, 10);
        }
        return await db.updateUser(id, data);
      }),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => await db.deleteUser(input)),
    technicians: protectedProcedure.query(async () => await db.getTechnicians()),
  }),

  installations: router({
    list: protectedProcedure.query(async () => await db.getAllInstallations()),
    get: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => await db.getInstallationById(input)),
    create: protectedProcedure
      .input(z.any())
      .mutation(async ({ input }) => await db.createInstallation(input)),
    update: protectedProcedure
      .input(z.object({ id: z.number(), data: z.any() }))
      .mutation(async ({ input }) => await db.updateInstallation(input.id, input.data)),
    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => await db.deleteInstallation(input)),
    byTechnician: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin' || ctx.user.role === 'project_manager') {
        return await db.getAllInstallations();
      }
      return await db.getInstallationsByTechnician(ctx.user.id);
    }),
    today: protectedProcedure.query(async ({ ctx }) => await db.getInstallationsByTechnicianToday(ctx.user.id)),
  }),

  expenses: router({
    listByInstallation: protectedProcedure
      .input(z.object({ installationId: z.number() }))
      .query(async ({ input }) => await db.getExpensesByInstallation(input.installationId)),
    create: protectedProcedure
      .input(z.object({
        installationId: z.number(),
        date: z.string(),
        category: z.string(),
        vendor: z.string(),
        documentNumber: z.string(),
        amount: z.string(),
        receiptPhotoUrl: z.string(),
        receiptPhotoKey: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createExpense({
          ...input,
          userId: ctx.user.id,
          status: 'pending_invoicing',
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.string() }))
      .mutation(async ({ input }) => await db.updateExpense(input.id, { status: input.status })),
    getSummary: protectedProcedure.query(async () => {
      const database = await db.getDb();
      const result = await database.select({ count: count() }).from(db.expenses)
        .where(inArray(db.expenses.status, ['pending_invoicing', 'pending']));
      return { pendingCount: result[0].count };
    }),
    getRecentPendingInvoicing: protectedProcedure.query(async () => {
      const database = await db.getDb();
      const joined = await database
        .select({
          expense: db.expenses,
          installation: db.installations,
        })
        .from(db.expenses)
        .innerJoin(db.installations, eq(db.expenses.installationId, db.installations.id))
        .where(inArray(db.expenses.status, ['pending_invoicing', 'pending']))
        .orderBy(desc(db.expenses.createdAt))
        .limit(10);

      return joined.map(({ expense, installation }) => ({
        ...expense,
        installationName: installation.clientName
      }));
    }),
  }),
});

export type AppRouter = typeof appRouter;
