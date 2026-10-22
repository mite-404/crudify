import { describe, expect, it, vi } from "vitest";
import { AuditService } from "./audit.service";

describe("AuditService", () => {
  it("persists an audit record", async () => {
    const model = {
      create: vi.fn().mockResolvedValue({ _id: "log-id" }),
    };
    const service = new AuditService(model as any);

    const result = await service.log({
      user: "user-1",
      action: "GET /api/users",
      entityId: null,
      details: { method: "GET" },
    });

    expect(result).toEqual({ _id: "log-id" });
    expect(model.create).toHaveBeenCalledWith({
      user: "user-1",
      action: "GET /api/users",
      entityId: null,
      details: { method: "GET" },
    });
  });

  it("finds logs with filters, sorting and pagination", async () => {
    const query = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([{ action: "GET /api/users" }]),
    };
    const model = {
      find: vi.fn().mockReturnValue(query),
    };
    const service = new AuditService(model as any);

    const result = await service.findAll({
      user: "user-1",
      limit: "10",
      skip: "20",
    });

    expect(model.find).toHaveBeenCalledWith({ user: "user-1" });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ action: "GET /api/users" }]);
  });
});
