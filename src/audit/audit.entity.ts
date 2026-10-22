import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Document, Schema as MongooseSchema } from "mongoose";
import { AuditLogRecord } from "./audit.interface";
import { DEFAULT_AUDIT_COLLECTION } from "./audit.constants";

@Schema({ timestamps: true, collection: DEFAULT_AUDIT_COLLECTION })
export class AuditLog extends Document implements AuditLogRecord {
  @ApiProperty({
    description: "User that performed the request.",
    example: "694977f46f807ce321fda999",
  })
  @Prop({ required: true, index: true })
  user!: string;

  @ApiProperty({
    description: "Normalized action, for example `PATCH /api/users/:id`.",
    example: "PATCH /api/finance/order/:id",
  })
  @Prop({ required: true, index: true })
  action!: string;

  @ApiPropertyOptional({
    description: "Identifier of the affected entity, when available.",
    example: "6a6b3a0753210eef9724d6c7",
    nullable: true,
  })
  @Prop({ type: String, default: null, index: true })
  entityId!: string | null;

  @ApiProperty({
    description:
      "Additional request information such as method, url, payload and oldDocument.",
    type: Object,
  })
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  details!: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

export function createAuditLogSchema(
  collectionName: string = DEFAULT_AUDIT_COLLECTION
) {
  const schema = SchemaFactory.createForClass(AuditLog);
  schema.set("collection", collectionName);
  return schema;
}
