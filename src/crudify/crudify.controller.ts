import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { CrudifyService } from "./crudify.service";
import { ConfigService } from "../config/config.service";
@Controller(":entity")
export class CrudifyController<T, C = Partial<T>, U = Partial<T>> {
  constructor(
    private readonly crudService: CrudifyService<T, C, U>, //
    private readonly configService?: ConfigService
  ) {}
  softDelete = Reflect.getMetadata("softDelete", this);
  modelName = Reflect.getMetadata("modelName", this);
  @Post()
  create(@Body() createDto: C) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "create"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "create");
    return this.crudService.create(createDto);
  }

  @Post("bulk")
  createBulk(@Body() data: C[]) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "createBulk"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(
        this.modelName,
        "createBulk"
      );
    return this.crudService.createBulk(data);
  }

  @Get()
  findAll(@Query() query: any) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "findAll"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "findAll");
    return this.crudService.findAll(query);
  }

  @Get("count")
  count(@Query() query: any) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "count"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "count");
    return this.crudService.count(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "findOne"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "findOne");
    return this.crudService.findOne({ _id: id });
  }

  @Put(":id")
  put(@Param("id") id: string, @Body() updateDto: Partial<U>) {
    const isEnabled = this.configService?.isRouteEnabled(this.modelName, "put");
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "put");
    return this.crudService.put(id, updateDto);
  }

  @Patch("bulk")
  async updateBulk(@Body() body: { filter: any; updateDto: any }) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "updateBulk"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(
        this.modelName,
        "updateBulk"
      );
    const { filter, updateDto } = body;
    return this.crudService.updateBulk(filter, updateDto);
  }

  @Patch("bulk/restore")
  async restoreBulk(@Body() body: { filter: any }) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "restoreBulk"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(
        this.modelName,
        "restoreBulk"
      );
    const { filter } = body;
    return this.crudService.restoreBulk(filter);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: Partial<T>) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "update"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "update");
    return this.crudService.update(id, updateDto);
  }

  @Delete("bulk")
  async deleteBulk(@Body() body: { filter: any }) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "deleteBulk"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(
        this.modelName,
        "deleteBulk"
      );
    const { filter } = body;
    if (this.softDelete) return this.crudService.softDeleteBulk(filter);
    return this.crudService.deleteBulk(filter);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "delete"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "delete");
    if (this.softDelete) return this.crudService.softDelete(id);
    return this.crudService.delete(id);
  }

  @Delete(":id/soft")
  deleteSoft(@Param("id") id: string) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "deleteSoft"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(
        this.modelName,
        "deleteSoft"
      );
    return this.crudService.softDelete(id);
  }

  @Delete(":id/restore")
  restore(@Param("id") id: string) {
    const isEnabled = this.configService?.isRouteEnabled(
      this.modelName,
      "restore"
    );
    if (!isEnabled)
      return this.configService?.notEnabledResponse(this.modelName, "restore");
    return this.crudService.restore(id);
  }
}
