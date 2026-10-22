import { AuditUserExtractor } from "./audit.interface";

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePath(value: string): string {
  let path = value.trim();
  if (!path) return "/";
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/+/g, "/");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path || "/";
}

export function buildAuditActionPath(request: any): string {
  const rawPath =
    request?.path ??
    `${request?.originalUrl ?? request?.url ?? "/"}`.split("?")[0];
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const params = request?.params ?? {};

  const segments = path.split("/").map((segment: string) => {
    const decoded = safeDecode(segment);

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      const values = Array.isArray(value)
        ? value.map((item) => String(item))
        : [String(value)];

      if (
        values.some(
          (item) =>
            item === segment ||
            item === decoded ||
            encodeURIComponent(item) === segment
        )
      ) {
        return `:${key}`;
      }
    }

    return segment;
  });

  return normalizePath(segments.join("/"));
}

export function buildAuditAction(request: any): string {
  const method = String(request?.method ?? "GET").toUpperCase();
  return `${method} ${buildAuditActionPath(request)}`;
}

function matchesPath(patternPath: string, action: string): boolean {
  const separator = action.indexOf(" ");
  const actionPath = normalizePath(
    separator === -1 ? action : action.slice(separator + 1)
  );
  const normalizedPattern = normalizePath(patternPath);

  if (normalizedPattern === actionPath) return true;

  return actionPath.endsWith(normalizedPattern);
}

export function matchesAuditPattern(
  pattern: string,
  action: string,
  handlerName?: string
): boolean {
  const value = pattern?.trim();
  if (!value || value === "*") return true;
  if (value === action) return true;

  if (value.startsWith("/")) {
    return matchesPath(value, action);
  }

  const methodMatch = /^([A-Za-z]+)\s*(.*)$/.exec(value);
  if (!methodMatch) {
    return handlerName ? value === handlerName : false;
  }

  const method = methodMatch[1].toUpperCase();
  const path = methodMatch[2].trim();

  if (!HTTP_METHODS.has(method)) {
    return handlerName ? value === handlerName : false;
  }

  if (!action.startsWith(`${method} `)) return false;
  if (!path) return true;

  return matchesPath(path, action);
}

function normalizeUser(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "anonymous";
  }
  return String(value);
}

export function extractAuditUser(
  request: any,
  extractor?: AuditUserExtractor
): string {
  try {
    if (extractor) {
      return normalizeUser(extractor(request));
    }

    const user = request?.user;
    if (typeof user === "string" || typeof user === "number") {
      return normalizeUser(user);
    }

    return normalizeUser(
      user?._id ??
        user?.id ??
        user?.sub ??
        user?.email ??
        request?.userId ??
        request?.user_id
    );
  } catch {
    return "anonymous";
  }
}

export function extractAuditEntityId(
  request: any,
  data?: any
): string | null {
  const paramId = request?.params?.id;
  if (paramId !== undefined && paramId !== null && paramId !== "") {
    return String(paramId);
  }

  if (data && !Array.isArray(data)) {
    const candidate = data._id ?? data.id;
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      return String(candidate);
    }
  }

  return null;
}
