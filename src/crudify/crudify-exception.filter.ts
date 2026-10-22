import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

interface ErrorLike {
  name?: string;
  message?: string;
  code?: number | string;
}

@Catch()
export class CrudifyExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    const { status, message, error } = this.normalize(exception);

    response.status(status).json({ statusCode: status, message, error });
  }

  private normalize(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === "string") {
        return { status, message: response, error: exception.name };
      }

      if (response && typeof response === "object") {
        const body = response as Record<string, unknown>;
        return {
          status,
          message:
            (body.message as string | string[]) ?? exception.message,
          error: (body.error as string) ?? exception.name,
        };
      }

      return { status, message: exception.message, error: exception.name };
    }

    const err = exception as ErrorLike;

    if (err?.name === "CastError") {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: err.message ?? "Invalid value",
        error: "Bad Request",
      };
    }

    if (err?.name === "ValidationError") {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: err.message ?? "Validation failed",
        error: "Bad Request",
      };
    }

    if (err?.code === 11000 || err?.code === "11000") {
      return {
        status: HttpStatus.CONFLICT,
        message: "A record with the same unique value already exists",
        error: "Conflict",
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: "Internal Server Error",
    };
  }
}
