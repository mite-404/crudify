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
      RouteFindOne(options),
      RouteCreate(options),
      RouteCreateBulk(options),
      RoutePatchBulk(options),
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

  function RouteFindOne(options: ICrudify) {
    const methodName: ControllerMethods = "findAll";
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
    const methodName: ControllerMethods = "findAll";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Post,
      path: "/",
      parameters: [{ index: 0, decorator: Body(), type: options.model.cdto }],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteCreateBulk(options: ICrudify) {
    const methodName: ControllerMethods = "findAll";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Post,
      path: "/bulk",
      parameters: [
        {
          index: 0,
          decorator: Body(),
          type: [options.model.cdto],
          description: `Array of ${name} resources to create`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RoutePatch(options: ICrudify) {
    const methodName: ControllerMethods = "findAll";
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
        { index: 1, decorator: Body(), type: options.model.cdto },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RoutePatchBulk(options: ICrudify) {
    const methodName: ControllerMethods = "findAll";
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
    const methodName: ControllerMethods = "findAll";
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
        { index: 1, decorator: Body(), type: options.model.cdto },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }

  function RouteDelete(options: ICrudify) {
    const methodName: ControllerMethods = "findAll";
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
    const methodName: ControllerMethods = "findAll";
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName,
      httpMethod: Delete,
      path: "/bulk",
      parameters: [
        {
          index: 0,
          decorator: Body(),
          type: Array,
          description: `Array of IDs of the ${name} resources to be deletedss`,
        },
      ],
      decorators: CrudifyRoutesDecorator.getDecorators(options, methodName),
    };
  }
}
