import { IAuditOptions } from "../../audit/audit.interface";

export interface ICrudifyModuleOptions {
  uri?: string;
  audit?: boolean | IAuditOptions;
}
