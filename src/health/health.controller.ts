import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
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
  @ApiResponse({
    status: 503,
    description: "The database connection is not ready",
  })
  checkHealth() {
    const dbStatus = this.getDatabaseStatus();
    const healthy = dbStatus === "Connected";
    const payload = {
      status: healthy ? "OK" : "ERROR",
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };

    if (!healthy) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
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
