import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import Errsole = require("errsole");
import { LEVEL } from "./level.enum";
import { IBodyLog } from "./body.interface";

@ApiTags("Logger")
@Controller("logger")
export class LoggerController {
  @ApiOperation({ summary: "Logs an errorr" })
  @ApiParam({
    name: "level",
    description: `Log level`,
    enum: LEVEL,
    enumName: "Level",
  })
  @ApiBody({
    description: "body to log",
    type: Object,
    examples: {
      example: {
        value: {
          app: "My-ui",
          message: "Oh no...",
          trace: "StackTrace",
        },
      },
    },
  })
  @Post(":level")
  create(@Param("level") level: string, @Body() body: IBodyLog) {
    const msg: string = Object.keys(body)
      .map((key) => body[key as keyof IBodyLog])
      .filter((v) => v)
      .join(" - ");
    switch (level.toUpperCase()) {
      case LEVEL.ALERT:
        Errsole.alert(msg);
        break;
      case LEVEL.ERROR:
        Errsole.error(msg);
        break;
      case LEVEL.WARN:
        Errsole.warn(msg);
        break;
      case LEVEL.INFO:
        Errsole.info(msg);
        break;
      case LEVEL.DEBUG:
        Errsole.debug(msg);
        break;
      default:
        Errsole.log(msg);
        break;
    }
  }
}
