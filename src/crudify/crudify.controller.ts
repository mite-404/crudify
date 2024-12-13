import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Type,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CrudifyService } from "./crudify.service";

export function CreateCrudifyController<T>(
  dto: Type<T>,
  entity: Type<T>,
  name: string
) {
  @ApiTags(name)
  @Controller(name)
  class GenericMongoController {
    constructor(public readonly service: CrudifyService<T>) {}

    @Post()
    @ApiOperation({ summary: "Create an item" })
    @ApiCreatedResponse({
      description: "The item has been successfully created",
      type: dto,
    })
    @ApiBadRequestResponse({ description: "Invalid input data" })
    @ApiConflictResponse({
      description: `Conflict in creating the entity ${name}`,
    })
    @ApiBody({ description: "Data of the new entity", type: dto })
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() createDto: Partial<T>) {
      return this.service.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: `Get all items  ${name}` })
    @ApiOkResponse({ description: "List of items", type: [entity] })
    @ApiNotFoundResponse({ description: "Items not found" })
    @ApiQuery({
      name: "filter",
      required: false,
      description: "Filters to apply",
      type: [String],
    })
    @ApiQuery({
      name: "archived",
      required: false,
      description: "Return only archived elements",
      type: Boolean,
      default: false,
    })
    @ApiQuery({
      name: "sort",
      required: false,
      description: "Sorting fields",
      type: String,
    })
    @ApiQuery({
      name: "skip",
      required: false,
      description: "Number of records to skip",
      type: Number,
    })
    @ApiQuery({
      name: "limit",
      required: false,
      description: "Number of records to return",
      type: Number,
    })
    findAll(@Query() query: any) {
      return this.service.findAll(query);
    }

    @Get(":id")
    @ApiOperation({ summary: "Get an item by ID" })
    @ApiOkResponse({ description: "The found item", type: entity })
    @ApiNotFoundResponse({ description: "Item not found" })
    @ApiParam({ name: "id", description: "ID of the entity", type: String })
    findOne(@Param("id") id: string) {
      return this.service.findOne({ _id: id });
    }

    @Patch(":id")
    @ApiOperation({ summary: "Update an item" })
    @ApiOkResponse({ description: "The item has been updated", type: entity })
    @ApiBadRequestResponse({ description: "Invalid data" })
    @ApiParam({ name: "id", description: "ID of the entity", type: String })
    @ApiBody({ description: "Updated data of the entity", type: entity })
    @UsePipes(new ValidationPipe({ transform: true }))
    update(@Param("id") id: string, @Body() updateDto: Partial<T>) {
      return this.service.update(id, updateDto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete an item" })
    @ApiOkResponse({ description: "The item has been deleted" })
    @ApiNotFoundResponse({ description: "Item not found" })
    @ApiParam({ name: "id", description: "ID of the entity", type: String })
    delete(@Param("id") id: string) {
      return this.service.delete(id);
    }
  }

  return GenericMongoController;
}
