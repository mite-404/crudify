import { Type } from "@nestjs/common";
import { Schema } from "mongoose";
export interface ICrudifyModel {
  type: Type;
  cdto?: Type;
  udto?: Type;
  schema?: Schema;
}
