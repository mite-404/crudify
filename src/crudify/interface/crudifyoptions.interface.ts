import { CONST } from "../../shared/const.namespace";

export interface ICrudifyModuleOptions {
  uri?: string;
}

export class CrudifyModuleOptions implements ICrudifyModuleOptions {
  uri?: string;

  constructor(options: ICrudifyModuleOptions) {
    this.uri = options?.uri || CONST.MONGO_URI;
  }
}
