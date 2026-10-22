import { describe, expect, it } from "vitest";
import {
  buildAuditAction,
  extractAuditEntityId,
  extractAuditUser,
  matchesAuditPattern,
} from "./audit.utils";

describe("audit utils", () => {
  it("builds an action replacing route params", () => {
    const action = buildAuditAction({
      method: "PATCH",
      path: "/api/finance/order/6a6b3a0753210eef9724d6c7",
      params: { id: "6a6b3a0753210eef9724d6c7" },
    });

    expect(action).toBe("PATCH /api/finance/order/:id");
  });

  it("matches compact, full and class-level patterns", () => {
    const action = "GET /api/users/:id";

    expect(matchesAuditPattern("GET/:id", action)).toBe(true);
    expect(matchesAuditPattern("GET /api/users/:id", action)).toBe(true);
    expect(matchesAuditPattern("/users/:id", action)).toBe(true);
    expect(matchesAuditPattern("DELETE/:id", action)).toBe(false);
    expect(matchesAuditPattern("*", action)).toBe(true);
  });

  it("supports handler name based exclusions", () => {
    expect(
      matchesAuditPattern("findOne", "GET /api/users/:id", "findOne")
    ).toBe(true);
    expect(
      matchesAuditPattern("findAll", "GET /api/users/:id", "findOne")
    ).toBe(false);
  });

  it("extracts the user from common request shapes", () => {
    expect(extractAuditUser({ user: { _id: "1" } })).toBe("1");
    expect(extractAuditUser({ user: { sub: "subject" } })).toBe("subject");
    expect(extractAuditUser({ user: { email: "a@b.c" } })).toBe("a@b.c");
    expect(extractAuditUser({})).toBe("anonymous");
  });

  it("extracts the entity id from params or the response", () => {
    expect(extractAuditEntityId({ params: { id: "route-id" } })).toBe(
      "route-id"
    );
    expect(extractAuditEntityId({ params: {} }, { _id: "created-id" })).toBe(
      "created-id"
    );
    expect(extractAuditEntityId({ params: {} }, [{ _id: "bulk-id" }])).toBe(
      null
    );
  });
});
