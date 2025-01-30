import { ControllerMethods } from "./controllermethods.type";
import { IRouteConfig } from "./routeconfig.interface";

export interface ICrudifyRoutes {
  config?: Partial<Record<ControllerMethods, IRouteConfig>>;
  exclude?: ControllerMethods[];
  decorators?: MethodDecorator[];
  disableBulk?: boolean;
}
