import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
  Optional,
} from "@nestjs/common";
import { HTTP_CODE_METADATA } from "@nestjs/common/constants";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { Observable, tap } from "rxjs";
import { AUDIT_OPTIONS, NO_AUDIT_METADATA } from "./audit.constants";
import { AuditLogRecord, IAuditOptions } from "./audit.interface";
import { AuditService } from "./audit.service";
import {
  buildAuditAction,
  extractAuditEntityId,
  extractAuditUser,
  matchesAuditPattern,
} from "./audit.utils";

const METHODS_WITH_PREVIOUS_STATE = new Set(["PATCH", "PUT", "DELETE"]);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    @InjectConnection() private readonly connection: Connection,
    @Optional()
    @Inject(AUDIT_OPTIONS)
    private readonly options: IAuditOptions = {}
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    if (context.getType() !== "http") return next.handle();

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    let action = "";

    try {
      action = buildAuditAction(request);
      if (this.isExcluded(context, action)) return next.handle();
    } catch (auditError) {
      this.logger.error(
        `Unable to prepare audit log: ${(auditError as Error)?.message ?? auditError}`
      );
      return next.handle();
    }

    const startedAt = Date.now();
    const successStatusCode = this.resolveSuccessStatusCode(
      context,
      request,
      response
    );
    const oldDocument = await this.loadOldDocument(context, request);

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.writeAudit({
            request,
            response,
            action,
            startedAt,
            successStatusCode,
            oldDocument,
            data,
          });
        },
        error: (error) => {
          this.writeAudit({
            request,
            response,
            action,
            startedAt,
            successStatusCode,
            oldDocument,
            error,
          });
        },
      })
    );
  }

  private isExcluded(context: ExecutionContext, action: string): boolean {
    const handler = context.getHandler();
    const controller = context.getClass();
    const exclusions: string[] = [
      ...(Reflect.getMetadata(NO_AUDIT_METADATA, controller) ?? []),
      ...(Reflect.getMetadata(NO_AUDIT_METADATA, handler) ?? []),
    ];

    return exclusions.some((pattern) =>
      matchesAuditPattern(pattern, action, handler?.name)
    );
  }

  private writeAudit(params: {
    request: any;
    response: any;
    action: string;
    startedAt: number;
    successStatusCode: number;
    oldDocument?: any;
    data?: any;
    error?: any;
  }) {
    const {
      request,
      response,
      action,
      startedAt,
      successStatusCode,
      oldDocument,
      data,
      error,
    } = params;

    const errorStatus =
      typeof error?.getStatus === "function" ? error.getStatus() : undefined;
    const statusCode = error
      ? errorStatus ?? error?.status ?? error?.statusCode ?? 500
      : successStatusCode;

    const details: Record<string, any> = {
      method: request?.method,
      url: request?.originalUrl ?? request?.url,
      payload: request?.body,
      oldDocument,
      statusCode,
      durationMs: Date.now() - startedAt,
    };

    if (error) {
      details.error = {
        name: error?.name,
        message: error?.message,
        statusCode,
      };
    }

    const record: AuditLogRecord = {
      user: extractAuditUser(request, this.options?.userExtractor),
      action,
      entityId: extractAuditEntityId(request, data),
      details,
    };

    try {
      void Promise.resolve(this.auditService.log(record)).catch(
        (auditError) => {
          this.logger.error(
            `Unable to store audit log for ${action}: ${auditError?.message ?? auditError}`
          );
        }
      );
    } catch (auditError) {
      this.logger.error(
        `Unable to store audit log for ${action}: ${(auditError as Error)?.message ?? auditError}`
      );
    }
  }

  private resolveSuccessStatusCode(
    context: ExecutionContext,
    request: any,
    response: any
  ): number {
    const explicitStatus = Reflect.getMetadata(
      HTTP_CODE_METADATA,
      context.getHandler()
    );
    if (explicitStatus) return explicitStatus;

    const method = String(request?.method ?? "").toUpperCase();
    if (method === "POST") return 201;

    return response?.statusCode ?? 200;
  }

  private async loadOldDocument(
    context: ExecutionContext,
    request: any
  ): Promise<any | undefined> {
    const method = String(request?.method ?? "").toUpperCase();
    if (!METHODS_WITH_PREVIOUS_STATE.has(method)) return undefined;

    const id = request?.params?.id;
    if (id === undefined || id === null || id === "") return undefined;

    const model = this.resolveModel(context);
    if (!model) return undefined;

    try {
      return await model.findById(id).lean().exec();
    } catch {
      return undefined;
    }
  }

  private resolveModel(context: ExecutionContext): Model<any> | undefined {
    const controller = context.getClass();
    const modelName =
      Reflect.getMetadata("modelName", controller?.prototype) ??
      Reflect.getMetadata("modelName", controller);

    if (!modelName) return undefined;

    return this.connection?.models?.[modelName];
  }
}
