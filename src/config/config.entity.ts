import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Document, model, Model } from "mongoose";
import { ControllerMethods } from "../crudify/interface/controllermethods.type";

@Schema({ timestamps: true })
export class Config extends Document {
  @ApiProperty({
    description: "Unique name of the model this configuration applies to.",
    example: "User",
  })
  @Prop({ required: true, unique: true })
  modelName!: string;

  @ApiPropertyOptional({
    description:
      "Defines which CRUD routes are enabled for this model. Each key represents a route (e.g. create, update, delete, list, get).",
    example: {
      create: true,
      createBulk: true,
      findAll: true,
      findOne: true,
      put: true,
      update: true,
      updateBulk: true,
      delete: true,
      deleteSoft: true,
      deleteBulk: true,
      restore: true,
      restoreBulk: true,
      count: true,
    },
    type: Object,
  })
  @Prop({
    type: Object,
  })
  routes?: Partial<Record<ControllerMethods, boolean>>;

  @ApiPropertyOptional({
    description:
      "Indicates whether this model is globally enabled or disabled in the CRUD system.",
    example: true,
    default: true,
  })
  @Prop({ default: true })
  enabled?: boolean;

  @ApiPropertyOptional({
    description: "Other props",
    type: Object,
  })
  @Prop({
    type: Object,
  })
  props?: Partial<Record<string, any>>;
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
export const ConfigModel: Model<Config> = model<Config>("Config", ConfigSchema);
