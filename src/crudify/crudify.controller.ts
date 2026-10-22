import {
  Body,
  Controller,
  Delete,
  Get,
  Optional,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseFilters,
} from "@nestjs/common";
import { CrudifyService } from "./crudify.service";
import { CrudifyExceptionFilter } from "./crudify-exception.filter";
import { ConfigService } from "../config/config.service";
import { ControllerMethods } from "./interface/controllermethods.type";
import { QueryParser } from "./query-parser.namespace";

@UseFilters(CrudifyExceptionFilter)
@Controller(":entity")
export class CrudifyController<T, C = Partial<T>, U = Partial<T>> {
  constructor(
    private readonly crudService: CrudifyService<T, C, U>,
    @Optional() private readonly configService?: ConfigService
  ) {}

  softDelete: boolean = Reflect.getMetadata("softDelete", this) ?? false;
  modelName: string = Reflect.getMetadata("modelName", this);

  @Post()
  create(@Body() createDto: C) {
    if (!this.isRouteEnabled("create"))
      return this.disabledResponse("create");
    return this.crudService.create(createDto);
  }

  @Post("bulk")
  createBulk(@Body() data: C[]) {
    if (!this.isRouteEnabled("createBulk"))
      return this.disabledResponse("createBulk");
    return this.crudService.createBulk(data);
  }

  @Get()
  findAll(@Query() query: any) {
    if (!this.isRouteEnabled("findAll"))
      return this.disabledResponse("findAll");
    return this.crudService.findAll(query);
  }

  @Get("count")
  count(@Query() query: any) {
    if (!this.isRouteEnabled("count")) return this.disabledResponse("count");
    return this.crudService.count(QueryParser.parse(query).filters);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    if (!this.isRouteEnabled("findOne"))
      return this.disabledResponse("findOne");
    return this.crudService.findOne({ _id: id });
  }

  @Put(":id")
  put(@Param("id") id: string, @Body() updateDto: Partial<U>) {
    if (!this.isRouteEnabled("put")) return this.disabledResponse("put");
    return this.crudService.put(id, updateDto);
  }

  @Patch("bulk")
  async updateBulk(@Body() body: { filter: any; updateDto: any }) {
    if (!this.isRouteEnabled("updateBulk"))
      return this.disabledResponse("updateBulk");
    const { filter, updateDto } = body;
    return this.crudService.updateBulk(filter, updateDto);
  }

  @Patch("bulk/restore")
  async restoreBulk(@Body() body: { filter: any }) {
    if (!this.isRouteEnabled("restoreBulk"))
      return this.disabledResponse("restoreBulk");
    const { filter } = body;
    return this.crudService.restoreBulk(filter);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: Partial<T>) {
    if (!this.isRouteEnabled("update")) return this.disabledResponse("update");
    return this.crudService.update(id, updateDto);
  }

  @Delete("bulk")
  async deleteBulk(@Body() body: { filter: any }) {
    if (!this.isRouteEnabled("deleteBulk"))
      return this.disabledResponse("deleteBulk");
    const { filter } = body;
    if (this.softDelete) return this.crudService.softDeleteBulk(filter);
    return this.crudService.deleteBulk(filter);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    if (!this.isRouteEnabled("delete")) return this.disabledResponse("delete");
    if (this.softDelete) return this.crudService.softDelete(id);
    return this.crudService.delete(id);
  }

  @Delete(":id/soft")
  deleteSoft(@Param("id") id: string) {
    if (!this.isRouteEnabled("deleteSoft"))
      return this.disabledResponse("deleteSoft");
    return this.crudService.softDelete(id);
  }

  @Delete(":id/restore")
  restore(@Param("id") id: string) {
    if (!this.isRouteEnabled("restore")) return this.disabledResponse("restore");
    return this.crudService.restore(id);
  }

  private isRouteEnabled(route: ControllerMethods): boolean {
    if (!this.configService) return true;
    return this.configService.isRouteEnabled(this.modelName, route);
  }

  private disabledResponse(route: ControllerMethods) {
    return this.configService?.notEnabledResponse(this.modelName, route);
  }
}
