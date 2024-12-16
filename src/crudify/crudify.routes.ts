import {
  applyDecorators,
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { ICrudify } from "./crudify.interface";
export namespace CrudifyRoutes {
  export function routes(options: ICrudify) {
    return [
      RouteFindAll(options),
      RouteFindOne(options),
      RouteCreate(options),
      RoutePatch(options),
      RoutePut(options),
      RouteDelete(options),
    ];
  }

  function RouteFindAll(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "findAll",
      httpMethod: Get,
      path: "/",
      parameters: [{ index: 0, decorator: Query(), type: Object }],
      decorators: [
        ApiOperation({ summary: `Retrieve all ${name} resources` }),
        ApiOkResponse({
          description: `List of ${name} resources`,
          type: [options.model.type],
        }),
        ApiNotFoundResponse({ description: "Resources not found" }),
        ApiQuery({
          name: "filter",
          required: false,
          type: String,
          description: "Filters to apply",
        }),
        ApiQuery({
          name: "limit",
          required: false,
          type: Number,
          description: "Number of records to return",
        }),
        ApiQuery({
          name: "skip",
          required: false,
          type: Number,
          description: "Number of records to skip",
        }),
        ApiQuery({
          name: "sort",
          required: false,
          type: String,
          description: "Sorting fields",
        }),
      ],
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
      decorators: [
        ApiOperation({ summary: `Retrive a ${name} resource by ID` }),
        ApiOkResponse({
          description: `Resource ${name} found`,
          type: options.model.type,
        }),
        ApiNotFoundResponse({ description: "Resource not found" }),
        ApiParam({
          name: "id",
          description: "ID of the resource",
          type: String,
        }),
      ],
    };
  }

  function RouteCreate(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "create",
      httpMethod: Post,
      path: "/",
      parameters: [{ index: 0, decorator: Body(), type: options.model.cdto }],
      decorators: [
        ApiOperation({ summary: `Create a ${name} resource` }),
        ApiCreatedResponse({
          description: `The resource  ${name} has been successfully created`,
          type: options.model.type,
        }),
        ApiBadRequestResponse({ description: "Invalid input data" }),
        ApiConflictResponse({
          description: "Conflict in creating the resource",
        }),
        ApiBody({
          description: "Data of the new resource",
          type: options.model.type,
        }),
      ],
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
      decorators: [
        ApiOperation({ summary: `Update a ${name} resource` }),
        ApiOkResponse({
          description: `The resource ${name} has been updated`,
          type: options.model.udto,
        }),
        ApiBadRequestResponse({ description: "Invalid data" }),
        ApiParam({
          name: "id",
          description: `ID of the ${name} resource`,
          type: String,
        }),
        ApiBody({
          description: "Updated data of the resource",
          type: options.model.type,
        }),
      ],
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
      decorators: [
        ApiOperation({ summary: `Overwrite a ${name} resource` }),
        ApiOkResponse({
          description: "The resource has been overwrited",
          type: options.model.udto,
        }),
        ApiBadRequestResponse({ description: "Invalid data" }),
        ApiParam({
          name: "id",
          description: `ID of the ${name} resource`,
          type: String,
        }),
        ApiBody({
          description: "Overwrited data of the resource",
          type: options.model.type,
        }),
      ],
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
      decorators: [
        ApiOperation({ summary: `Delete a ${name} resource` }),
        ApiOkResponse({ description: "The resource has been deleted" }),
        ApiNotFoundResponse({ description: "Resource not found" }),
        ApiParam({
          name: "id",
          description: "ID of the resource",
          type: String,
        }),
      ],
    };
  }
}
