import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ConfigService } from "./config.service";
import { Config } from "./config.entity";

@ApiTags("Config")
@Controller("config")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({
    summary: "Get the current configuration cache",
    description:
      "Returns the cached configuration of all models and their enabled routes.",
  })
  @ApiResponse({
    status: 200,
    description: "Configuration cache retrieved successfully.",
    schema: {
      example: {
        User: {
          enabled: true,
          routes: { create: true, update: false, delete: true },
          props: { otherProp: "value" },
        },
      },
    },
  })
  getAll() {
    return this.configService.getAll();
  }

  @Put(":model")
  @ApiOperation({
    summary: "Update configuration for a specific model",
    description:
      "Updates enabled status or specific route flags for the given model. Automatically creates the record if it does not exist.",
  })
  @ApiParam({
    name: "model",
    description: "Model name ",
    example: "User",
  })
  @ApiBody({
    description: "Partial configuration object for the given model.",
    schema: {
      example: {
        enabled: true,
        routes: {
          create: true,
          createBulk: true,
          findAll: true,
          findOne: true,
          put: true,
          update: true,
          updateBulk: true,
          delete: true,
          deleteSoft: true,
          deleteBulk: true,
          restore: true,
          restoreBulk: true,
          count: true,
        },

        props: { otherProp: "value" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Configuration updated successfully.",
  })
  async updateConfig(
    @Param("model") model: string,
    @Body() updates: Partial<Config>
  ) {
    await this.configService.updateConfig(model, updates);
    await this.configService.load();
    return { success: true, model, updates };
  }

  @Post("reload")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reload configuration cache",
    description:
      "Forces a reload of the configuration cache from the database.",
  })
  @ApiResponse({
    status: 200,
    description: "Configuration cache reloaded successfully.",
  })
  async reload() {
    await this.configService.load();
    return { success: true, message: "Configuration cache reloaded." };
  }
}
