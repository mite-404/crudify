import { DynamicModule, Module, Type } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CrudifyService } from "./crudify.service";
import { CreateCrudifyController } from "./crudify.controller";

@Module({})
export class CrudifyModule {
  static forFeature<T>(
    schema: any,
    entity: Type<T>,
    dto: Type<T>,
    customService: Type<any>,
    customController?: Type<any>
  ): DynamicModule {
    const name: string = entity.name;
    const controller =
      customController ||
      CreateCrudifyController(dto, entity, name.toLowerCase());

    return {
      module: CrudifyModule,
      imports: [MongooseModule.forFeature([{ name, schema }])],
      providers: [
        {
          provide: customService || CrudifyService,
          useFactory: (model) => {
            if (customService) {
              return new customService(model);
            }
            return new CrudifyService(model);
          },
          inject: [`${name}Model`],
        },
      ],
      controllers: [controller],
    };
  }
}
