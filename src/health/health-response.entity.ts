import { ApiProperty } from "@nestjs/swagger";

export class HealthResponse {
  @ApiProperty({
    example: "OK",
    description: "General status of the application",
  })
  status?: string;

  @ApiProperty({
    example: "Connected",
    description: "Status of the database connection",
  })
  database?: string;

  @ApiProperty({
    example: "2023-10-10T12:34:56.789Z",
    description: "Timestamp of the request",
  })
  timestamp?: string;
}
