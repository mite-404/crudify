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
} from "@nestjs/common";
import { CrudifyService } from "./crudify.service";
@Controller(":entity")
export class CrudifyController<T, C = Partial<T>, U = Partial<T>> {
  constructor(private readonly crudService: CrudifyService<T, C, U>) {}
  softDelete = Reflect.getMetadata("softDelete", this);

  @Post()
  create(@Body() createDto: C) {
    return this.crudService.create(createDto);
  }

  @Post("bulk")
  createBulk(@Body() data: C[]) {
    return this.crudService.createBulk(data);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.crudService.findAll(query);
  }

  @Get("count")
  count(@Query() query: any) {
    return this.crudService.count(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.crudService.findOne({ _id: id });
  }

  @Put(":id")
  put(@Param("id") id: string, @Body() updateDto: Partial<U>) {
    return this.crudService.put(id, updateDto);
  }

  @Patch("bulk")
  async updateBulk(@Body() body: { filter: any; updateDto: any }) {
    const { filter, updateDto } = body;
    return this.crudService.updateBulk(filter, updateDto);
  }

  @Patch("bulk/restore")
  async restoreBulk(@Body() body: { filter: any }) {
    const { filter } = body;
    return this.crudService.restoreBulk(filter);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateDto: Partial<T>) {
    return this.crudService.update(id, updateDto);
  }

  @Delete("bulk")
  async deleteBulk(@Body() body: { filter: any }) {
    const { filter } = body;
    if (this.softDelete) return this.crudService.softDeleteBulk(filter);
    return this.crudService.deleteBulk(filter);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    if (this.softDelete) return this.crudService.softDelete(id);
    return this.crudService.delete(id);
  }

  @Delete(":id/soft")
  deleteSoft(@Param("id") id: string) {
    return this.crudService.softDelete(id);
  }

  @Delete(":id/restore")
  restore(@Param("id") id: string) {
    return this.crudService.restore(id);
  }
}
