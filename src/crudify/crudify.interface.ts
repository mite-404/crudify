import { Type } from "@nestjs/common";

export interface ICrudify {
  model: {
    type: Type;
    cdto?: Type;
    udto?: Type;
  };
  routes?: {
    exclude?: ControllerMethods[];
  };
}

export type ControllerMethods =
  | "create"
  | "createBulk"
  | "findAll"
  | "findOne"
  | "put"
  | "update"
  | "updateBulk"
  | "delete"
  | "deleteBulk";
