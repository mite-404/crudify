import { ControllerMethods, ICrudify } from "./crudify.interface";
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

export namespace CrudifyRoutesDecorator {
  export function getDecorators(options: ICrudify, route: ControllerMethods) {
    if (options.routes?.exclude?.includes(route))
      return [ApiExcludeEndpoint(), UseGuards(DisableRouteGuard)];
    switch (route) {
      case "create":
        return createDecorators(options);
      case "createBulk":
        return createBulkDecorators(options);
      case "findAll":
        return findAllDecorators(options);
      case "findOne":
        return findOneDecorators(options);
      case "put":
        return overwriteDecorators(options);
      case "update":
        return updateDecorators(options);
      case "updateBulk":
        return updateBulkDecorators(options);
      case "delete":
        return deleteDecorators(options);
      case "deleteBulk":
        return deleteBulkDecorators(options);
      default:
        return [];
    }
  }

  export function createDecorators(options: ICrudify): any[] {
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

  export function createBulkDecorators(options: ICrudify): any[] {
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

  export function findAllDecorators(options: ICrudify): any[] {
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

  export function findOneDecorators(options: ICrudify): any[] {
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

  export function overwriteDecorators(options: ICrudify): any[] {
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
  export function updateDecorators(options: ICrudify): any[] {
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

  export function updateBulkDecorators(options: ICrudify): any[] {
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

  export function deleteDecorators(options: ICrudify): any[] {
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

  export function deleteBulkDecorators(options: ICrudify): any[] {
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
