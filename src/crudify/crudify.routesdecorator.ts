import { ICrudify } from "./interface/crudify.interface";
import { UseGuards } from "@nestjs/common";
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
    if (options.routes?.exclude?.includes(route))
      return [ApiExcludeEndpoint(), UseGuards(DisableRouteGuard)];

    let routeDecorators: MethodDecorator[] = [];
    switch (route) {
      case "create":
        routeDecorators = createDecorators(options);
      case "createBulk":
        routeDecorators = createBulkDecorators(options);
      case "findAll":
        routeDecorators = findAllDecorators(options);
      case "findOne":
        routeDecorators = findOneDecorators(options);
      case "put":
        routeDecorators = overwriteDecorators(options);
      case "update":
        routeDecorators = updateDecorators(options);
      case "updateBulk":
        routeDecorators = updateBulkDecorators(options);
      case "delete":
        routeDecorators = deleteDecorators(options);
      case "deleteBulk":
        routeDecorators = deleteBulkDecorators(options);
      default:
        routeDecorators = [];
    }

    const routeconfig: IRouteConfig | undefined =
      options.routes?.config?.[route];
    const userRouteDecorators: MethodDecorator[] =
      routeconfig?.decorators || [];

    return [...userRouteDecorators, ...routeDecorators];
  }

  function createDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
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
    ];
  }

  function createBulkDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      ApiOperation({ summary: `Create multiple ${name} resources` }),
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
        type: [options.model.type],
      }),
    ];
  }

  function findAllDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
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
    ];
  }

  function findOneDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
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
    ];
  }

  function overwriteDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
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
    ];
  }

  function updateDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
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
    ];
  }

  function updateBulkDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      ApiOperation({ summary: `Update multiple ${name} resources` }),
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
            data: {
              type: "object",
              description: "Data to apply to the selected resources",
            },
          },
        },
      }),
    ];
  }

  function deleteDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      ApiOperation({ summary: `Delete a ${name} resource` }),
      ApiOkResponse({ description: "The resource has been deleted" }),
      ApiNotFoundResponse({ description: "Resource not found" }),
      ApiParam({
        name: "id",
        description: "ID of the resource",
        type: String,
      }),
    ];
  }

  function deleteBulkDecorators(options: ICrudify): MethodDecorator[] {
    const name: string = options.model.type.name.toLowerCase();
    return [
      ApiOperation({ summary: `Delete multiple ${name} resources` }),
      ApiOkResponse({ description: "The resources have been deleted" }),
      ApiNotFoundResponse({ description: "Some resources not found" }),
      ApiBadRequestResponse({
        description: "Invalid input, expected an array of IDs",
      }),
    ];
  }
}
