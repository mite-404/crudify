import { applyDecorators } from "@nestjs/common";
import { ICrudify } from "./interface/crudify.interface";
import { CrudifyRoutes } from "./crudify.routes";

export function Crudify<T>(options: ICrudify) {
  return function (constructor: Function) {
    const routes = CrudifyRoutes.routes(options);
    for (const route of routes) {
      if (constructor.prototype[route.methodName]) {
        Object.defineProperty(constructor.prototype, route.methodName, {
          value: constructor.prototype[route.methodName],
          writable: true,
          configurable: true,
        });

        if (route.parameters) {
          for (const param of route.parameters) {
            param.decorator(
              constructor.prototype,
              route.methodName,
              param.index
            );
          }
        }

        const methodDecorators = [
          route.httpMethod(route.path),
          ...route.decorators,
        ];

        applyDecorators(...methodDecorators)(
          constructor.prototype,
          route.methodName,
          Object.getOwnPropertyDescriptor(
            constructor.prototype,
            route.methodName
          )!
        );
      }
    }
  };
}
