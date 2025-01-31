import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { HealthResponse } from "./health-response.entity";

@ApiTags("Health Check")
@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: "Check application and database health" })
  @ApiResponse({
    status: 200,
    description: "Health check successful",
    type: HealthResponse,
  })
  @ApiResponse({ status: 500, description: "Internal server error" })
  checkHealth() {
    const appStatus = "OK";
    const dbStatus = this.getDatabaseStatus();
    const timestamp = new Date().toISOString();

    return {
      status: appStatus,
      database: dbStatus,
      timestamp,
    };
  }

  private getDatabaseStatus() {
    const readyState = this.connection.readyState;
    switch (readyState) {
      case 0:
        return "Disconnected";
      case 1:
        return "Connected";
      case 2:
        return "Connecting";
      case 3:
        return "Disconnecting";
      case 99:
        return "Uninitialized";
      default:
        return "Unknown";
    }
  }
}
