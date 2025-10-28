import { ICrudify } from "./interface/crudify.interface";
import { UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { DisableRouteGuard } from "./disable.guard";
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
  ApiExcludeEndpoint,
} from "@nestjs/swagger";
import { ControllerMethods } from "./interface/controllermethods.type";
import { IRouteConfig } from "./interface/routeconfig.interface";

export namespace CrudifyRoutesDecorator {
  export function getDecorators(options: ICrudify, route: ControllerMethods) {
    const routeconfig: IRouteConfig | undefined =
      options.routes?.config?.[route];

    if (
      options.routes?.exclude?.includes(route) ||
      routeconfig?.disabled == true
    )
      return [ApiExcludeEndpoint(), UseGuards(DisableRouteGuard)];

    let routeDecorators: MethodDecorator[] = getRouteDecorators(options, route);

    const generalUserRouteDecorators: MethodDecorator[] =
      options?.routes?.decorators || [];
    const userRouteDecorators: MethodDecorator[] =
      routeconfig?.decorators || [];
    return [
      ...routeDecorators,
      ...generalUserRouteDecorators,
      ...userRouteDecorators,
    ];
  }

  function getRouteDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    switch (route) {
      case "create":
        return createDecorators(options, route);
      case "createBulk":
        return createBulkDecorators(options, route);
      case "findAll":
        return findAllDecorators(options, route);
      case "findOne":
        return findOneDecorators(options, route);
      case "put":
        return overwriteDecorators(options, route);
      case "update":
        return updateDecorators(options, route);
      case "updateBulk":
        return updateBulkDecorators(options, route);
      case "delete":
        return deleteDecorators(options, route);
      case "deleteBulk":
        return deleteBulkDecorators(options, route);
      case "restore":
        return restoreDecorators(options, route);
      case "restoreBulk":
        return restoreBulkDecorators(options, route);
      case "count":
        return countDecorators(options, route);
      default:
        return [];
    }
  }

  function createDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Create a ${name} resource`,
        operationId: `${name}_${route}`,
      }),
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
        type: options.model.cdto || options.model.type,
      }),
    ];
  }

  function createBulkDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Create multiple ${name} resources`,
        operationId: `${name}_${route}`,
      }),
      ApiCreatedResponse({
        description: "The resources have been created",
        type: [options.model.type],
      }),
      ApiBadRequestResponse({ description: "Invalid input data" }),
      ApiConflictResponse({
        description: "Conflict in creating the resources",
      }),
      ApiBody({
        description: "Data of the new resources",
        type: [options.model.cdto || options.model.type],
      }),
    ];
  }

  function findAllDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    let path_types: any = {
      String: "string",
      Number: "number",
      Date: "string",
      Buffer: "string",
      Boolean: "boolean",
      Mixed: "string",
      ObjectId: "string",
      Array: "array",
      Decimal128: "number",
      Map: "object",
      Schema: "object",
      UUID: "string",
      BigInt: "number",
      Double: "number",
      Int32: "number",
    };
    let list: any[] = [];
    if (options.model.schema) {
      const fields = Object.keys(options.model.schema.paths);
      const operators = ["eq", "ne", "gt", "gte", "lt", "lte", "in"];
      fields.forEach((field) => {
        let type = options.model.schema!.paths[field].instance;
        let path_type = path_types[type];
        if (!path_type) {
          path_type = "string";
        }
        operators.forEach((operator) => {
          list.push({ [`${field}[${operator}]`]: { type: path_type } });
        });
      });
    }
    const patternProperties = list.reduce((acc, item) => {
      const key = Object.keys(item)[0];
      acc[key] = item[key];
      return acc;
    }, {});
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Retrieve all ${name} resources`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({
        description: `List of ${name} resources`,
        type: [options.model.type],
      }),
      ApiNotFoundResponse({ description: "Resources not found" }),
      ApiQuery({
        name: "filters",
        required: false,
        type: "object",
        style: "form",
        explode: true,
        description: "Filters to apply",
        properties: patternProperties,
        examples: {
          void: { value: {} },
          example: {
            value: {
              "filter_string[eq]": "filter_value",
              "filter_num[gt]": -1,
            },
          },
        },
        default: {},
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
    ];
  }

  function findOneDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Retrive a ${name} resource by ID`,
        operationId: `${name}_${route}`,
      }),
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
    ];
  }

  function overwriteDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Overwrite a ${name} resource`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({
        description: "The resource has been overwrited",
        type: options.model.type,
      }),
      ApiBadRequestResponse({ description: "Invalid data" }),
      ApiParam({
        name: "id",
        description: `ID of the ${name} resource`,
        type: String,
      }),
      ApiBody({
        description: "Overwrited data of the resource",
        type: options.model.udto || options.model.type,
      }),
    ];
  }

  function updateDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Update a ${name} resource`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({
        description: `The resource ${name} has been updated`,
        type: options.model.type,
      }),
      ApiBadRequestResponse({ description: "Invalid data" }),
      ApiParam({
        name: "id",
        description: `ID of the ${name} resource`,
        type: String,
      }),
      ApiBody({
        description: "Updated data of the resource",
        type: options.model.udto || options.model.type,
      }),
    ];
  }

  function updateBulkDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Update multiple ${name} resources`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({
        description: `The resources have been updated`,
        type: options.model.type,
      }),
      ApiBadRequestResponse({ description: "Invalid data" }),
      ApiBody({
        description: `Object containing filter and updated data`,
        schema: {
          type: "object",
          properties: {
            filter: {
              type: "object",
              description: "Filter to select the resources to update",
            },
            updateDto: {
              type: "object",
              description: "Data to apply to the selected resources",
            },
          },
        },
      }),
    ];
  }

  function deleteDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      ApiOperation({
        summary: `Delete a ${name} resource`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({ description: "The resource has been deleted" }),
      ApiNotFoundResponse({ description: "Resource not found" }),
      ApiParam({
        name: "id",
        description: "ID of the resource",
        type: String,
      }),
    ];
  }

  function deleteBulkDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      ApiOperation({
        summary: `Delete multiple ${name} resources`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({ description: "The resources have been deleted" }),
      ApiNotFoundResponse({ description: "Some resources not found" }),
      ApiBadRequestResponse({
        description: "Invalid input, expected an array of IDs",
      }),
      ApiBody({
        description: `Object containing filter`,
        schema: {
          type: "object",
          properties: {
            filter: {
              type: "object",
              description: "Filter to select the resources to delete",
            },
          },
        },
      }),
    ];
  }

  function restoreDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Restore a ${name} resource`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({
        description: `The resource ${name} has been restored`,
        type: options.model.type,
      }),
      ApiBadRequestResponse({ description: "Invalid data" }),
      ApiParam({
        name: "id",
        description: `ID of the ${name} resource`,
        type: String,
      }),
    ];
  }

  function restoreBulkDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      UsePipes(new ValidationPipe({ transform: true })),
      ApiOperation({
        summary: `Restore multiple ${name} resources`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({
        description: `The resources have been restored`,
        type: options.model.type,
      }),
      ApiBadRequestResponse({ description: "Invalid data" }),
      ApiBody({
        description: `Object containing filter`,
        schema: {
          type: "object",
          properties: {
            filter: {
              type: "object",
              description: "Filter to select the resources to restore",
            },
          },
        },
      }),
    ];
  }

  function countDecorators(
    options: ICrudify,
    route: ControllerMethods
  ): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      ApiOperation({
        summary: `Retrive a total count of ${name} resources`,
        operationId: `${name}_${route}`,
      }),
      ApiOkResponse({
        description: `Total count of ${name} resources`,
        type: Number,
      }),
    ];
  }
}
