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
import { ICrudify } from "./crudify.interface";
import { CrudifyRoutesDecorator } from "./crudify.routesdecorator";
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
    return {
      methodName: "findAll",
      httpMethod: Get,
      path: "/",
      parameters: [{ index: 0, decorator: Query(), type: Object }],
      decorators: CrudifyRoutesDecorator.findAllDecorators(options),
    };
  }

  function RouteFindOne(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "findOne",
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
      decorators: CrudifyRoutesDecorator.findOneDecorators(options),
    };
  }

  function RouteCreate(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "create",
      httpMethod: Post,
      path: "/",
      parameters: [{ index: 0, decorator: Body(), type: options.model.cdto }],
      decorators: CrudifyRoutesDecorator.createDecorators(options),
    };
  }

  function RouteCreateBulk(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "createBulk",
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
      decorators: CrudifyRoutesDecorator.createBulkDecorators(options),
    };
  }

  function RoutePatch(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "update",
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
      decorators: CrudifyRoutesDecorator.updateDecorators(options),
    };
  }

  function RoutePatchBulk(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "updateBulk",
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
      decorators: CrudifyRoutesDecorator.updateBulkDecorators(options),
    };
  }

  function RoutePut(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "overwrite",
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
      decorators: CrudifyRoutesDecorator.overwriteDecorators(options),
    };
  }

  function RouteDelete(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "delete",
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
      decorators: CrudifyRoutesDecorator.deleteDecorators(options),
    };
  }

  function RouteDeleteBulk(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "deleteBulk",
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
      decorators: CrudifyRoutesDecorator.deleteBulkDecorators(options),
    };
  }
}
