export interface AuditLogRecord {
  user: string;
  action: string;
  entityId: string | null;
  details: Record<string, any>;
  createdAt?: Date | string;
}

export type AuditUserExtractor = (
  request: any
) => string | null | undefined;

export interface IAuditOptions {
  enabled?: boolean;
  collectionName?: string;
  userExtractor?: AuditUserExtractor;
}
