import { Type } from "@nestjs/common";
import { ControllerMethods } from "./controllermethods.type";
import { IRouteConfig } from "./routeconfig.interface";

export interface ICrudify {
  model: {
    type: Type;
    cdto?: Type;
    udto?: Type;
  };
  routes?: {
    config?: Partial<Record<ControllerMethods, IRouteConfig>>;
    exclude?: ControllerMethods[];
    //TODO: aggiungere decorators
  };
}
