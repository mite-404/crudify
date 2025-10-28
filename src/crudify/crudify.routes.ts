import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ICrudify } from "./interface/crudify.interface";
import { CrudifyRoutesDecorator } from "./crudify.routesdecorator";
import { ControllerMethods } from "./interface/controllermethods.type";
export namespace CrudifyRoutes {
  export function routes(options: ICrudify) {
    return [
      RouteFindAll(options),
      RouteCount(options),
      RouteFindOne(options),
      RouteCreate(options),
      RouteCreateBulk(options),
      RoutePatchBulk(options),
      RouteRestoreBulk(options),
      RouteRestore(options),
      RoutePatch(options),
      RoutePut(options),
      RouteDeleteBulk(options),
      RouteDelete(options),
    ];
  }

  function RouteFindAll(options: ICrudify) {
    const methodName: ControllerMethods = "findAll";
    return {
      methodName,
      httpMethod: Get,
      path: "/",
      parameters: [{ index: 0, decorator: Query(), type: Object }],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteCount(options: ICrudify) {
    const methodName: ControllerMethods = "count";
    return {
      methodName,
      httpMethod: Get,
      path: "/count",
      parameters: [],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteFindOne(options: ICrudify) {
    const methodName: ControllerMethods = "findOne";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Get,
      path: "/:id",
      parameters: [
        {
          index: 0,
          decorator: Param("id"),
          type: String,
          description: `ID of the ${name} resource`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteCreate(options: ICrudify) {
    const methodName: ControllerMethods = "create";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Post,
      path: "/",
      parameters: [
        {
          index: 0,
          decorator: Body(),
          type: options.model.cdto || options.model.type,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteCreateBulk(options: ICrudify) {
    const methodName: ControllerMethods = "createBulk";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Post,
      path: "/bulk",
      parameters: [
        {
          index: 0,
          decorator: Body(),
          type: [options.model.cdto || options.model.type],
          description: `Array of ${name} resources to create`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RoutePatch(options: ICrudify) {
    const methodName: ControllerMethods = "update";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Patch,
      path: "/:id",
      parameters: [
        {
          index: 0,
          decorator: Param("id"),
          type: String,
          description: `ID of the ${name} resource`,
        },
        {
          index: 1,
          decorator: Body(),
          type: options.model.udto || options.model.type,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RoutePatchBulk(options: ICrudify) {
    const methodName: ControllerMethods = "updateBulk";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Patch,
      path: "/bulk",
      parameters: [
        {
          index: 0,
          decorator: Body(),
          type: Object,
          description: `Object containing filter and data to update multiple ${name} resources`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RoutePut(options: ICrudify) {
    const methodName: ControllerMethods = "put";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Put,
      path: "/:id",
      parameters: [
        {
          index: 0,
          decorator: Param("id"),
          type: String,
          description: `ID of the ${name} resource`,
        },
        {
          index: 1,
          decorator: Body(),
          type: options.model.udto || options.model.type,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteDelete(options: ICrudify) {
    const methodName: ControllerMethods = "delete";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Delete,
      path: "/:id",
      parameters: [
        {
          index: 0,
          decorator: Param("id"),
          type: String,
          description: `ID of the ${name} resource`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteDeleteBulk(options: ICrudify) {
    const methodName: ControllerMethods = "deleteBulk";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Delete,
      path: "/bulk",
      parameters: [
        {
          index: 0,
          decorator: Body(),
          type: Object,
          description: `Object containing filter and data to delete multiple ${name} resources`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteRestore(options: ICrudify) {
    const methodName: ControllerMethods = "restore";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Patch,
      path: "/:id/restore",
      parameters: [
        {
          index: 0,
          decorator: Param("id"),
          type: String,
          description: `ID of the ${name} resource`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteRestoreBulk(options: ICrudify) {
    const methodName: ControllerMethods = "restoreBulk";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Patch,
      path: "/bulk/restore",
      parameters: [
        {
          index: 0,
          decorator: Body(),
          type: Object,
          description: `Object containing filter to restore multiple ${name} resources`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }
}
