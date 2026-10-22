import { describe, expect, it } from "vitest";
import { NO_AUDIT_METADATA } from "./audit.constants";
import { NoAudit } from "./audit.decorator";

describe("NoAudit", () => {
  it("stores exclusions on a method", () => {
    const handler = () => undefined;
    const descriptor = { value: handler };

    NoAudit("GET/:id")(handler, "findOne", descriptor as any);

    expect(Reflect.getMetadata(NO_AUDIT_METADATA, handler)).toEqual([
      "GET/:id",
    ]);
  });

  it("stores multiple exclusions on a class", () => {
    class Controller {}

    NoAudit("GET/:id", "DELETE/:id")(Controller);

    expect(Reflect.getMetadata(NO_AUDIT_METADATA, Controller)).toEqual([
      "GET/:id",
      "DELETE/:id",
    ]);
  });

  it("uses a wildcard when no action is provided", () => {
    const handler = () => undefined;
    const descriptor = { value: handler };

    NoAudit()(handler, "findOne", descriptor as any);

    expect(Reflect.getMetadata(NO_AUDIT_METADATA, handler)).toEqual(["*"]);
  });
});
