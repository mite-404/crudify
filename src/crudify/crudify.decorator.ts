import { applyDecorators } from "@nestjs/common";
import "reflect-metadata";
import { ICrudify } from "./interface/crudify.interface";
import { CrudifyRoutes } from "./crudify.routes";

export function Crudify<T>(options: ICrudify) {
  return function (target: Function) {
    const prototype = target.prototype;
    const basePrototype = Object.getPrototypeOf(prototype);
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
          summary: `Metodo: ${route.methodName}`,
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
