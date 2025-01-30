import { applyDecorators } from "@nestjs/common";
import "reflect-metadata";
import { ICrudify } from "./interface/crudify.interface";
import { CrudifyRoutes } from "./crudify.routes";

export function Crudify<T>(options: ICrudify) {
  return function (target: Function) {
    const prototype = target.prototype;
    const basePrototype = Object.getPrototypeOf(prototype);
    const isSoftDelete = options.softDelete ?? false;
    disableRoutes(options, prototype, isSoftDelete);
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

export function disableRoutes(
  options: ICrudify,
  prototype: any,
  isSoftDelete: boolean
) {
  Reflect.defineMetadata("softDelete", isSoftDelete, prototype);
  if (options.routes === undefined) options.routes = { exclude: [] };
  if (options.routes?.exclude === undefined) {
    options.routes.exclude = [];
  }

  if (Array.isArray(options.routes.exclude)) {
    if (!isSoftDelete) {
      options.routes.exclude.push("restore");
      options.routes.exclude.push("restoreBulk");
    }
    if (options.routes?.disableBulk) {
      options.routes.exclude.push("createBulk");
      options.routes.exclude.push("putBulk");
      options.routes.exclude.push("updateBulk");
      options.routes.exclude.push("deleteBulk");
      options.routes.exclude.push("restoreBulk");
    }
  }
}
