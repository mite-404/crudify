import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { CrudifyExceptionFilter } from "./crudify-exception.filter";

describe("CrudifyExceptionFilter", () => {
  const createHost = () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    return {
      host: {
        switchToHttp: () => ({
          getResponse: () => ({ status }),
        }),
      } as any,
      status,
      json,
    };
  };

  it("preserves HttpException responses", () => {
    const { host, status, json } = createHost();
    const filter = new CrudifyExceptionFilter();

    filter.catch(new BadRequestException("Invalid input"), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: "Invalid input",
      error: "Bad Request",
    });
  });

  it("maps Mongoose CastError to a 400 response", () => {
    const { host, status } = createHost();
    const filter = new CrudifyExceptionFilter();
    const error = Object.assign(new Error("Cast to ObjectId failed"), {
      name: "CastError",
    });

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(400);
  });

  it("maps duplicate key errors to a 409 response", () => {
    const { host, status, json } = createHost();
    const filter = new CrudifyExceptionFilter();
    const error = Object.assign(new Error("Duplicate key"), { code: 11000 });

    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: "A record with the same unique value already exists",
      error: "Conflict",
    });
  });

  it("hides internal error details", () => {
    const { host, status, json } = createHost();
    const filter = new CrudifyExceptionFilter();

    filter.catch(new Error("database credentials leaked"), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: "Internal server error",
      error: "Internal Server Error",
    });
  });
});
