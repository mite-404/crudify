import { applyDecorators } from "@nestjs/common";
import "reflect-metadata";
import { ICrudify } from "./interface/crudify.interface";
import { CrudifyRoutes } from "./crudify.routes";

export function Crudify<T>(options: ICrudify & { softDelete?: boolean }) {
  return function (target: Function) {
    const prototype = target.prototype;
    const basePrototype = Object.getPrototypeOf(prototype);
    const isSoftDelete = options.softDelete ?? false;

    Reflect.defineMetadata("softDelete", isSoftDelete, prototype);

    if (!isSoftDelete) {
      if (options.routes?.exclude == undefined)
        options.routes = { exclude: [] };
      options.routes.exclude!.push("restore");
      options.routes.exclude!.push("restoreBulk");
    }
    const routes = CrudifyRoutes.routes(options);
    for (const route of routes) {
      let method = prototype[route.methodName];

      if (!method || method === basePrototype[route.methodName]) {
        method = function (this: any, ...args: any[]) {
          return basePrototype[route.methodName]?.apply(this, args);
        };

        Object.defineProperty(prototype, route.methodName, {
          value: method,
          writable: true,
          configurable: true,
        });
      }

      if (isSoftDelete && route.methodName === "delete") {
        const originalMethod = prototype[route.methodName];
        prototype[route.methodName] = async function (...args: any[]) {
          const entity = args[0];
          const deleteDto = { deletedAt: new Date() };
          return originalMethod.apply(this, [entity, deleteDto]);
        };
      }

      if (route.parameters) {
        for (const param of route.parameters) {
          param.decorator(prototype, route.methodName, param.index);
        }
      }

      const uniqueOperationId = `${target.name}_${route.methodName}`;

      Reflect.defineMetadata(
        "swagger/apiOperation",
        {
          operationId: uniqueOperationId,
          summary: `Method: ${route.methodName}`,
        },
        prototype,
        route.methodName
      );

      const methodDecorators = [
        route.httpMethod(route.path),
        ...route.decorators,
      ];

      applyDecorators(...methodDecorators)(
        prototype,
        route.methodName,
        Object.getOwnPropertyDescriptor(prototype, route.methodName)!
      );
    }
  };
}
