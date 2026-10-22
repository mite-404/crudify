import { applyDecorators } from "@nestjs/common";
import "reflect-metadata";
import { ICrudify } from "./interface/crudify.interface";
import { CrudifyRoutes } from "./crudify.routes";
import { NO_AUDIT_METADATA } from "../audit/audit.constants";

export function Crudify<T>(options: ICrudify) {
  return function (target: Function) {
    if (!options?.model?.type) {
      throw new Error("@Crudify requires options.model.type");
    }

    const prototype = target.prototype;
    const basePrototype = Object.getPrototypeOf(prototype);
    const isSoftDelete = options.softDelete ?? false;
    Reflect.defineMetadata("model", options.model, prototype);
    Reflect.defineMetadata("modelName", options.model.type.name, prototype);

    const normalizedOptions = disableRoutes(options, prototype, isSoftDelete);
    const routes = CrudifyRoutes.routes(normalizedOptions);
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

        const noAudit = Reflect.getMetadata(
          NO_AUDIT_METADATA,
          originalMethod
        );
        if (noAudit) {
          Reflect.defineMetadata(
            NO_AUDIT_METADATA,
            noAudit,
            prototype[route.methodName]
          );
        }
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
): ICrudify {
  Reflect.defineMetadata("softDelete", isSoftDelete, prototype);

  const exclude = [...(options.routes?.exclude ?? [])];
  if (options.routes?.disableBulk) {
    for (const route of [
      "createBulk",
      "updateBulk",
      "deleteBulk",
      "restoreBulk",
    ] as const) {
      if (!exclude.includes(route)) exclude.push(route);
    }
  }

  return {
    ...options,
    routes: options.routes ? { ...options.routes, exclude } : undefined,
  };
}
