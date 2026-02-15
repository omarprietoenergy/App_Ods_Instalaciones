import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@odsenergy.es",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createNonAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "tech-user",
    email: "tech@odsenergy.es",
    name: "Tech User",
    loginMethod: "manus",
    role: "technician",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("users.create", () => {
  it("allows admin to create a new user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.create({
      name: "Test Technician",
      email: "test.tech@odsenergy.es",
      role: "technician",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects non-admin users from creating users", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.create({
        name: "Test User",
        email: "test@odsenergy.es",
        role: "technician",
      })
    ).rejects.toThrow("Solo los administradores pueden crear usuarios");
  });

  it("validates email format", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.create({
        name: "Test User",
        email: "invalid-email",
        role: "technician",
      })
    ).rejects.toThrow();
  });

  it("accepts all valid roles", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const roles: Array<"admin" | "project_manager" | "technician" | "admin_manager"> = [
      "admin",
      "project_manager",
      "technician",
      "admin_manager",
    ];

    for (const role of roles) {
      const result = await caller.users.create({
        name: `Test ${role}`,
        email: `test.${role}@odsenergy.es`,
        role,
      });

      expect(result).toEqual({ success: true });
    }
  });
});

describe("users.delete", () => {
  it("allows admin to delete a user", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create a user to delete
    await caller.users.create({
      name: "User to Delete",
      email: "delete@odsenergy.es",
      role: "technician",
    });

    // Then delete it (using a different ID to avoid self-deletion)
    const result = await caller.users.delete({ userId: 999 });
    expect(result).toEqual({ success: true });
  });

  it("allows project_manager to delete a user", async () => {
    const ctx: TrpcContext = {
      user: {
        id: 3,
        openId: "pm-user",
        email: "pm@odsenergy.es",
        name: "PM User",
        loginMethod: "manus",
        role: "project_manager",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.users.delete({ userId: 999 });
    expect(result).toEqual({ success: true });
  });

  it("prevents technician from deleting users", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.delete({ userId: 999 })
    ).rejects.toThrow("No tienes permiso para eliminar usuarios");
  });

  it("prevents user from deleting themselves", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.users.delete({ userId: 1 }) // Same as admin user ID
    ).rejects.toThrow("No puedes eliminar tu propia cuenta");
  });
});
