import { Controller, Get, Param, Query } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { NoAudit } from "./audit.decorator";

@NoAudit()
@ApiTags("Audit")
@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: "Retrieve audit logs",
    description:
      "Returns audit logs. Supports the same filters, sorting and pagination used by Crudify.",
  })
  @ApiOkResponse({ description: "List of audit logs" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "sort", required: false, type: String })
  findAll(@Query() query: Record<string, any>) {
    return this.auditService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a single audit log by ID" })
  @ApiParam({ name: "id", description: "ID of the audit log" })
  @ApiOkResponse({ description: "Audit log found" })
  findOne(@Param("id") id: string) {
    return this.auditService.findOne(id);
  }
}
