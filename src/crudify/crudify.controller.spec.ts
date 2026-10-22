import { describe, expect, it, vi } from "vitest";
import { CrudifyController } from "./crudify.controller";

describe("CrudifyController", () => {
  const createCrudService = () => ({
    findAll: vi.fn().mockReturnValue("result"),
    create: vi.fn().mockReturnValue("created"),
    count: vi.fn().mockReturnValue(3),
  });

  it("works without a ConfigService", () => {
    const service = createCrudService();
    const controller = new CrudifyController(service as any);

    controller.modelName = "User";

    expect(controller.findAll({})).toBe("result");
    expect(controller.create({} as any)).toBe("created");
  });

  it("parses count filters like findAll", () => {
    const service = createCrudService();
    const controller = new CrudifyController(service as any);

    controller.modelName = "User";

    expect(controller.count({ age: { gte: "18" } })).toBe(3);
    expect(service.count).toHaveBeenCalledWith({ age: { $gte: 18 } });
  });

  it("returns the disabled-route response when a route is disabled", () => {
    const service = createCrudService();
    const configService = {
      isRouteEnabled: vi.fn().mockReturnValue(false),
      notEnabledResponse: vi.fn().mockReturnValue({ status: 403 }),
    };
    const controller = new CrudifyController(
      service as any,
      configService as any
    );

    controller.modelName = "User";

    expect(controller.findAll({})).toEqual({ status: 403 });
    expect(service.findAll).not.toHaveBeenCalled();
  });
});
