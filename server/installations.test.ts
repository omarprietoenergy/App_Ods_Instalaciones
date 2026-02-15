import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(role: AuthenticatedUser["role"] = "admin"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@odsenergy.net",
    name: "Test User",
    loginMethod: "manus",
    role,
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

describe("installations router", () => {
  it("allows admin to create installation", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.installations.create({
      address: "Calle Test 123, Madrid",
      clientName: "Cliente Test",
      clientEmail: "cliente@test.com",
      installationType: "Residencial 5kW",
      budget: "15.000€",
    });

    expect(result).toEqual({ success: true });
  });

  it("allows project_manager to create installation", async () => {
    const ctx = createMockContext("project_manager");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.installations.create({
      address: "Calle Test 456, Barcelona",
      clientName: "Cliente Test 2",
      installationType: "Comercial 10kW",
    });

    expect(result).toEqual({ success: true });
  });

  it("prevents technician from creating installation", async () => {
    const ctx = createMockContext("technician");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.installations.create({
        address: "Calle Test 789",
        clientName: "Cliente Test 3",
        installationType: "Residencial 3kW",
      })
    ).rejects.toThrow("No tienes permiso para crear instalaciones");
  });

  it("allows admin to list all installations", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const installations = await caller.installations.list();
    expect(Array.isArray(installations)).toBe(true);
  });

  it("allows technician to list their assigned installations", async () => {
    const ctx = createMockContext("technician");
    const caller = appRouter.createCaller(ctx);

    const installations = await caller.installations.list();
    expect(Array.isArray(installations)).toBe(true);
  });
});

describe("users router", () => {
  it("allows admin to list all users", async () => {
    const ctx = createMockContext("admin");
    const caller = appRouter.createCaller(ctx);

    const users = await caller.users.list();
    expect(Array.isArray(users)).toBe(true);
  });

  it("allows project_manager to list technicians", async () => {
    const ctx = createMockContext("project_manager");
    const caller = appRouter.createCaller(ctx);

    const technicians = await caller.users.listTechnicians();
    expect(Array.isArray(technicians)).toBe(true);
  });

  it("prevents technician from listing users", async () => {
    const ctx = createMockContext("technician");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.users.list()).rejects.toThrow(
      "No tienes permiso para listar usuarios"
    );
  });
});
