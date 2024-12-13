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
      swagger: {
        operation: {
          summary: `Retrieve all ${name} resources`,
        },
        response: {
          status: 200,
          description: `List of ${name} resources`,
          type: [options.model.type],
        },
        query: [
          {
            name: "filter",
            type: "string",
            description: "Filters to apply",
          },
          {
            name: "limit",
            type: "number",
            description: "Number of records to return",
          },
          {
            name: "skip",
            type: "number",
            description: "Number of records to skip",
          },
          {
            name: "sort",
            type: "string",
            description: "Sorting fields",
          },
        ],
      },
      handler: (queryParams: any) => options.service.findAll(queryParams),
      parameters: [{ index: 0, decorator: Query(), type: Object }],
      decorators: [
        ApiOperation({ summary: "Retrieve all resources" }),
        ApiOkResponse({
          description: "List of resources",
          type: [options.model.type],
        }),
        ApiNotFoundResponse({ description: "Items not found" }),
        ApiQuery({ name: "filter", required: false, type: String }),
        ApiQuery({ name: "limit", required: false, type: Number }),
        ApiQuery({ name: "skip", required: false, type: Number }),
        ApiQuery({ name: "sort", required: false, type: String }),
      ],
    };
  }

  function RouteFindOne(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "findOne",
      httpMethod: Get,
      path: "/:id",
      swagger: {
        operation: { summary: `Retrive a ${name} resource` },
        param: {
          name: "id",
          description: `ID of the ${name} resource`,
          type: "string",
        },
        body: { type: options.model.type },
        response: {
          status: 200,
          description: `Resource ${name} found`,
          type: options.model.type,
        },
      },
      handler: (id: string) => options.service.findOne(id),
      parameters: [{ index: 0, decorator: Param("id"), type: String }],
      decorators: [
        ApiOperation({ summary: "Get resource by ID" }),
        ApiOkResponse({
          description: "Found resource",
          type: options.model.type,
        }),
        ApiNotFoundResponse({ description: "Item not found" }),
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
      swagger: {
        operation: { summary: `Create a ${name} resource ` },
        body: { type: options.model.cdto },
        response: {
          status: 201,
          description: `Resource ${name} created`,
          type: options.model.type,
        },
      },
      handler: (body: typeof options.model.cdto) =>
        options.service.create(body),
      parameters: [{ index: 0, decorator: Body(), type: options.model.cdto }],
      decorators: [
        ApiOperation({ summary: "Create a resource" }),
        ApiCreatedResponse({
          description: "The item has been successfully created",
          type: options.model.type,
        }),
        ApiBadRequestResponse({ description: "Invalid input data" }),
        ApiConflictResponse({ description: "Conflict in creating the entity" }),
        ApiBody({
          description: "Data of the new entity",
          type: options.model.type,
        }),
      ],
    };
  }

  function RoutePatch(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "patch",
      httpMethod: Patch,
      path: "/:id",
      swagger: {
        operation: { summary: `Update a ${name} resource` },
        param: {
          name: "id",
          description: `ID of the ${name} resource`,
          type: "string",
        },
        body: { type: options.model.type },
        response: {
          status: 200,
          description: `Resource ${name} updated`,
          type: options.model.type,
        },
      },
      handler: (id: string, body: any) => options.service.update(id, body),
      parameters: [
        { index: 0, decorator: Param("id"), type: String },
        { index: 1, decorator: Body(), type: options.model.cdto },
      ],
      decorators: [
        ApiOperation({ summary: "Update a resource" }),
        ApiOkResponse({
          description: "The item has been updated",
          type: options.model.udto,
        }),
        ApiBadRequestResponse({ description: "Invalid data" }),
        ApiParam({
          name: "id",
          description: "ID of the resource",
          type: String,
        }),
        ApiBody({
          description: "Updated data of the entity",
          type: options.model.type,
        }),
      ],
    };
  }

  function RoutePut(options: ICrudify) {
    const name: string = options.model.type.name.toLowerCase();
    return {
      methodName: "put",
      httpMethod: Put,
      path: "/:id",
      swagger: {
        operation: { summary: `Overwrite a ${name} resource` },
        param: {
          name: "id",
          description: `ID of the ${name} resource`,
          type: "string",
        },
        body: { type: options.model.type },
        response: {
          status: 200,
          description: `Resource ${name} overwrited`,
          type: options.model.type,
        },
      },
      handler: (id: string, body: any) => options.service.update(id, body),
      parameters: [
        { index: 0, decorator: Param("id"), type: String },
        { index: 1, decorator: Body(), type: options.model.cdto },
      ],
      decorators: [
        ApiOperation({ summary: "Overwrite a resource" }),
        ApiOkResponse({
          description: "The item has been overwrited",
          type: options.model.udto,
        }),
        ApiBadRequestResponse({ description: "Invalid data" }),
        ApiParam({
          name: "id",
          description: "ID of the resource",
          type: String,
        }),
        ApiBody({
          description: "Overwrited data of the entity",
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
      swagger: {
        operation: { summary: `Delete a ${name} resource` },
        param: {
          name: "id",
          description: "ID of the resource",
          type: "string",
        },
        response: { status: 200, description: `Resource ${name} deleted` },
      },
      handler: (id: string) => options.service.delete(id),
      parameters: [{ index: 0, decorator: Param("id"), type: String }],
      decorators: [
        ApiOperation({ summary: "Delete a resource" }),
        ApiOkResponse({ description: "The item has been deleted" }),
        ApiNotFoundResponse({ description: "Item not found" }),
        ApiParam({
          name: "id",
          description: "ID of the resource",
          type: String,
        }),
      ],
    };
  }
}
