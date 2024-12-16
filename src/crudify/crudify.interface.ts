import { Type } from "@nestjs/common";

export interface ICrudify {
  model: {
    type: Type;
    cdto?: Type;
    udto?: Type;
  };
}
