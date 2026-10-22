import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { QueryParser } from "../crudify/query-parser.namespace";
import { AUDIT_LOG_MODEL } from "./audit.constants";
import { AuditLog } from "./audit.entity";
import { AuditLogRecord } from "./audit.interface";

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AUDIT_LOG_MODEL)
    private readonly auditLogModel: Model<AuditLog>
  ) {}

  async log(record: AuditLogRecord): Promise<AuditLog> {
    const { createdAt, ...rest } = record;
    return this.auditLogModel.create(
      (createdAt ? { ...rest, createdAt } : rest) as any
    );
  }

  async findAll(query: Record<string, any> = {}) {
    const { filters, sort, skip, limit } = QueryParser.parse(query);
    let request = this.auditLogModel.find(filters);

    request = Object.keys(sort).length
      ? request.sort(sort)
      : request.sort({ createdAt: -1 });
    if (skip) request = request.skip(skip);
    if (limit) request = request.limit(limit);

    return request.lean().exec();
  }

  async findOne(id: string) {
    return this.auditLogModel.findById(id).lean().exec();
  }
}
