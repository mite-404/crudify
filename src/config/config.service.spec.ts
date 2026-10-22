import { describe, expect, it, vi } from "vitest";
import { ConfigService } from "./config.service";

describe("ConfigService", () => {
  const createModelMock = () => ({
    find: vi.fn(),
    updateOne: vi.fn(),
  });

  it("loads configurations and exposes props", async () => {
    const model = createModelMock();
    model.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          modelName: "User",
          enabled: true,
          routes: { delete: false },
          props: { group: "admin" },
        },
      ]),
    });

    const service = new ConfigService(model as any);
    await service.load();

    expect(service.getAll()).toEqual({
      User: {
        enabled: true,
        routes: { delete: false },
        props: { group: "admin" },
      },
    });
  });

  it("disables all routes when a model is disabled", async () => {
    const model = createModelMock();
    model.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          modelName: "Product",
          enabled: false,
          routes: { findAll: true },
        },
      ]),
    });

    const service = new ConfigService(model as any);
    await service.load();

    expect(service.isRouteEnabled("Product", "findAll")).toBe(false);
    expect(service.isRouteEnabled("Product", "create")).toBe(false);
  });

  it("uses per-route configuration and defaults to enabled", async () => {
    const model = createModelMock();
    model.find.mockReturnValue({
      exec: vi.fn().mockResolvedValue([
        {
          modelName: "User",
          enabled: true,
          routes: { delete: false },
        },
      ]),
    });

    const service = new ConfigService(model as any);
    await service.load();

    expect(service.isRouteEnabled("User", "delete")).toBe(false);
    expect(service.isRouteEnabled("User", "create")).toBe(true);
    expect(service.isRouteEnabled("Unknown", "create")).toBe(true);
  });

  it("only persists allowed fields", async () => {
    const model = createModelMock();
    model.updateOne.mockResolvedValue({});

    const service = new ConfigService(model as any);
    await service.updateConfig("User", {
      modelName: "Hacked",
      enabled: false,
      routes: { create: false },
      props: { group: "admin" },
    } as any);

    expect(model.updateOne).toHaveBeenCalledWith(
      { modelName: "User" },
      {
        $set: {
          enabled: false,
          routes: { create: false },
          props: { group: "admin" },
        },
      },
      { upsert: true }
    );
  });

  it("skips the update when no allowed field is provided", async () => {
    const model = createModelMock();

    const service = new ConfigService(model as any);
    await service.updateConfig("User", { modelName: "Hacked" } as any);

    expect(model.updateOne).not.toHaveBeenCalled();
  });

  it("returns a structured disabled-route response", () => {
    const service = new ConfigService(createModelMock() as any);

    expect(service.notEnabledResponse("User", "delete")).toEqual({
      success: false,
      status: 403,
      message:
        "The route 'delete' for model 'User' is currently disabled.",
    });
  });
});
