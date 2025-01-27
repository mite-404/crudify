import { ICrudifyModel } from "./model.interface";
import { ICrudifyRoutes } from "./routes.interface";

export interface ICrudify {
  model: ICrudifyModel;
  routes?: ICrudifyRoutes;
}
