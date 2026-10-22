import { CallHandler, ExecutionContext } from "@nestjs/common";
import { lastValueFrom, of, throwError } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NO_AUDIT_METADATA } from "./audit.constants";
import { AuditInterceptor } from "./audit.interceptor";

function createContext(options: {
  method?: string;
  path?: string;
  params?: Record<string, any>;
  body?: any;
  user?: any;
  handler?: any;
  controller?: any;
}): ExecutionContext {
  const request = {
    method: options.method ?? "GET",
    path: options.path ?? "/api/users",
    originalUrl: options.path ?? "/api/users",
    url: options.path ?? "/api/users",
    params: options.params ?? {},
    body: options.body ?? {},
    user: options.user,
  };
  const response = { statusCode: 200 };

  return {
    getType: () => "http",
    switchToHttp: () =>
      ({
        getRequest: () => request,
        getResponse: () => response,
      }) as any,
    getHandler: () => options.handler ?? function handler() {},
    getClass: () => options.controller ?? class Controller {},
  } as ExecutionContext;
}

function createNext(data: any): CallHandler {
  return { handle: () => of(data) };
}

describe("AuditInterceptor", () => {
  let auditService: { log: ReturnType<typeof vi.fn> };
  let connection: {
    models: Record<string, any>;
  };
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    auditService = { log: vi.fn().mockResolvedValue({}) };
    connection = { models: {} };
    interceptor = new AuditInterceptor(
      auditService as any,
      connection as any,
      {}
    );
  });

  it("stores a successful request", async () => {
    const context = createContext({
      method: "POST",
      path: "/api/users",
      body: { name: "John" },
      user: { _id: "user-1" },
    });

    await lastValueFrom(
      await interceptor.intercept(context, createNext({ _id: "created-id" }))
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "user-1",
        action: "POST /api/users",
        entityId: "created-id",
        details: expect.objectContaining({
          method: "POST",
          payload: { name: "John" },
          statusCode: 201,
        }),
      })
    );
  });

  it("skips actions excluded on the handler", async () => {
    const handler = function findOne() {};
    Reflect.defineMetadata(NO_AUDIT_METADATA, ["GET/:id"], handler);
    const context = createContext({
      method: "GET",
      path: "/api/users/123",
      params: { id: "123" },
      handler,
    });

    await lastValueFrom(
      await interceptor.intercept(context, createNext({ _id: "123" }))
    );

    expect(auditService.log).not.toHaveBeenCalled();
  });

  it("skips actions excluded on the controller", async () => {
    class UsersController {}
    Reflect.defineMetadata(
      NO_AUDIT_METADATA,
      ["DELETE/:id"],
      UsersController
    );
    const context = createContext({
      method: "DELETE",
      path: "/api/users/123",
      params: { id: "123" },
      controller: UsersController,
    });

    await lastValueFrom(await interceptor.intercept(context, createNext({})));

    expect(auditService.log).not.toHaveBeenCalled();
  });

  it("stores the old document for update requests", async () => {
    const findById = vi.fn().mockReturnValue({
      lean: () => ({
        exec: () => Promise.resolve({ _id: "123", name: "Old" }),
      }),
    });
    connection.models.User = { findById };

    class UserController {}
    Reflect.defineMetadata("modelName", "User", UserController.prototype);

    const context = createContext({
      method: "PATCH",
      path: "/api/users/123",
      params: { id: "123" },
      body: { name: "New" },
      user: { id: "user-1" },
      controller: UserController,
    });

    await lastValueFrom(
      await interceptor.intercept(context, createNext({ _id: "123" }))
    );

    expect(findById).toHaveBeenCalledWith("123");
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: "123",
        details: expect.objectContaining({
          oldDocument: { _id: "123", name: "Old" },
          payload: { name: "New" },
        }),
      })
    );
  });

  it("stores failed requests without breaking the flow", async () => {
    const error = Object.assign(new Error("boom"), { status: 400 });
    const context = createContext({
      method: "POST",
      path: "/api/users",
      user: { id: "user-1" },
    });

    await lastValueFrom(
      await interceptor.intercept(context, {
        handle: () => throwError(() => error),
      })
    ).catch(() => undefined);

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "POST /api/users",
        details: expect.objectContaining({
          statusCode: 400,
          error: expect.objectContaining({ message: "boom" }),
        }),
      })
    );
  });
});
