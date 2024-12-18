import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";
import { CrudifyLogger } from "./logger.service";
@Catch(HttpException, Error)
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: CrudifyLogger) {}

  catch(exception: any, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const status = exception?.status || 500;
    this.logger.error(
      exception.message || "Internal server error",
      exception.stack,
      "AllExceptionsFilter"
    );

    response.status(status).json({
      statusCode: status,
      message: exception.message || "Internal server error",
      error: exception?.response || exception?.name || "Unknown Error",
    });
  }
}
