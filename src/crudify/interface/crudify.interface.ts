import { Type } from "@nestjs/common";
import { ControllerMethods } from "./controllermethods.type";
import { IRouteConfig } from "./routeconfig.interface";

import {Schema} from 'mongoose';

export interface ICrudify {
  model: {
    type: Type;
    cdto?: Type;
    udto?: Type;
    schema?:Schema
  };
  routes?: {
    config?: Partial<Record<ControllerMethods, IRouteConfig>>;
    exclude?: ControllerMethods[];
    decorators?: MethodDecorator[];
  };
}
