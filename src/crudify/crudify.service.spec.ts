import { describe, expect, it, vi } from "vitest";
import { CrudifyService } from "./crudify.service";

describe("CrudifyService", () => {
  const createModelMock = (results: unknown[] = [], total = 0) => {
    const findQuery = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(results),
    };
    const countQuery = {
      exec: vi.fn().mockResolvedValue(total),
    };

    return {
      model: {
        find: vi.fn().mockReturnValue(findQuery),
        countDocuments: vi.fn().mockReturnValue(countQuery),
      },
      findQuery,
    };
  };

  it("calculates a one-based page number", async () => {
    const { model, findQuery } = createModelMock([{ id: 1 }], 42);
    const service = new CrudifyService<any>(model as any);

    const response = await service.findAll({ skip: "20", limit: "10" });

    expect(response).toEqual({
      results: [{ id: 1 }],
      total: 42,
      page: 3,
    });
    expect(findQuery.skip).toHaveBeenCalledWith(20);
    expect(findQuery.limit).toHaveBeenCalledWith(10);
    expect(findQuery.populate).toHaveBeenCalled();
    expect(findQuery.sort).toHaveBeenCalled();
  });

  it("returns page one when no limit is provided", async () => {
    const { model } = createModelMock([], 0);
    const service = new CrudifyService<any>(model as any);

    const response = await service.findAll();

    expect(response.page).toBe(1);
  });

  it("preserves atomic operators in updateBulk", async () => {
    const exec = vi.fn().mockResolvedValue({ modifiedCount: 1 });
    const updateMany = vi.fn().mockReturnValue({ exec });
    const service = new CrudifyService<any>({ updateMany } as any);
    const update = { $inc: { counter: 1 } };

    await service.updateBulk({ active: true }, update);

    expect(updateMany).toHaveBeenCalledWith({ active: true }, update);
  });

  it("wraps plain fields in $set in updateBulk", async () => {
    const exec = vi.fn().mockResolvedValue({ modifiedCount: 1 });
    const updateMany = vi.fn().mockReturnValue({ exec });
    const service = new CrudifyService<any>({ updateMany } as any);

    await service.updateBulk({ active: true }, { name: "updated" });

    expect(updateMany).toHaveBeenCalledWith(
      { active: true },
      { $set: { name: "updated" } }
    );
  });
});
