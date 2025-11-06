import { Module } from "@nestjs/common";
import { ConfigController } from "./config.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Config, ConfigSchema } from "./config.entity";
import { ConfigService } from "./config.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Config.name, schema: ConfigSchema }]),
  ],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
