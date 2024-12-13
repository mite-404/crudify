import { applyDecorators } from "@nestjs/common";
import { ApiBody, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ICrudify } from "./crudify.interface";
import { CrudifyRoutes } from "./crudify.routes";

export function Crudify<T>(options: ICrudify) {
  return function (constructor: Function) {
    const routes = CrudifyRoutes.routes(options);
    for (const route of routes) {
      if (!constructor.prototype[route.methodName]) {
        Object.defineProperty(constructor.prototype, route.methodName, {
          value: route.handler,
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
          // ApiOperation(route.swagger.operation),
          // ApiResponse(route.swagger.response as any),
          ...route.decorators,
        ];

        if ((route.swagger as any).param) {
          methodDecorators.push(ApiParam((route.swagger as any).param));
        }

        if ((route.swagger as any).body) {
          methodDecorators.push(ApiBody((route.swagger as any).body));
        }

        if ((route.swagger as any).query) {
          Object.keys((route.swagger as any).query).forEach((paramKey) => {
            const queryParam = (route.swagger as any).query[paramKey];
            methodDecorators.push(ApiQuery(queryParam));
          });
        }

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
