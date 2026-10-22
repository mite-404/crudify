interface RegexPattern {
  starts?: string;
  ends?: string;
  cont: string[];
  isOr: boolean;
}

export class QueryParser {
  static operatorsMap: Record<string, string> = {
    eq: "$eq",
    ne: "$ne",
    gt: "$gt",
    gte: "$gte",
    lt: "$lt",
    lte: "$lte",
    starts: "$regex",
    ends: "$regex",
    cont: "$regex",
    excl: "$not",
    in: "$in",
    notin: "$nin",
    isnull: "$exists",
    notnull: "$exists",
    between: "$gte",
  };

  static parse(queryParams: Record<string, unknown> = {}): {
    filters: Record<string, any>;
    populate: any[];
    sort: Record<string, 1 | -1>;
    skip: number;
    limit: number;
  } {
    const filters: Record<string, any> = {};
    const populate: any[] = [];
    const sort: Record<string, 1 | -1> = {};
    const regexPatterns: Record<string, RegexPattern> = {};
    const orGroups: Record<string, any>[] = [];
    let skip = 0;
    let limit = 0;

    for (const [key, value] of Object.entries(queryParams ?? {})) {
      if (key === "populate" && typeof value === "string") {
        this.parsePopulate(value, populate);
        continue;
      }

      if (key === "sort" && typeof value === "string") {
        this.parseSort(value, sort);
        continue;
      }

      if (key === "skip" || key === "limit") {
        const parsed = this.toNonNegativeInteger(value);
        if (parsed !== undefined) {
          if (key === "skip") skip = parsed;
          else limit = parsed;
        }
        continue;
      }

      if (key.endsWith("_op") && typeof value === "string") {
        const fieldName = key.slice(0, -3);
        if (!this.isSafeFieldName(fieldName)) continue;

        regexPatterns[fieldName] ??= { cont: [], isOr: false };
        regexPatterns[fieldName].isOr = value.toLowerCase() === "or";
        continue;
      }

      if (!this.isSafeFieldName(key)) continue;

      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        this.parseOperators(key, value as Record<string, unknown>, filters, regexPatterns);
        continue;
      }

      if (Array.isArray(value)) {
        const values = value
          .filter((item) => this.isScalar(item))
          .map((item) => this.castValue(item));
        filters[key] = { $in: values };
        continue;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        filters[key] = this.castValue(value);
      }
    }

    for (const [fieldName, patterns] of Object.entries(regexPatterns)) {
      const conditions: Record<string, any>[] = [];

      if (patterns.starts) {
        conditions.push({
          [fieldName]: {
            $regex: `^${this.escapeRegex(patterns.starts)}`,
            $options: "i",
          },
        });
      }

      if (patterns.ends) {
        conditions.push({
          [fieldName]: {
            $regex: `${this.escapeRegex(patterns.ends)}$`,
            $options: "i",
          },
        });
      }

      for (const contPattern of patterns.cont) {
        conditions.push({
          [fieldName]: {
            $regex: this.escapeRegex(contPattern),
            $options: "i",
          },
        });
      }

      if (conditions.length === 0) continue;

      if (patterns.isOr) {
        orGroups.push({ $or: conditions });
        continue;
      }

      let pattern = "";
      if (patterns.starts) {
        pattern += `^${this.escapeRegex(patterns.starts)}`;
      }
      for (const contPattern of patterns.cont) {
        const escaped = this.escapeRegex(contPattern);
        pattern += pattern ? `.*${escaped}` : escaped;
      }
      if (patterns.ends) {
        const escaped = this.escapeRegex(patterns.ends);
        pattern += pattern ? `.*${escaped}$` : `${escaped}$`;
      }

      const existing =
        filters[fieldName] && typeof filters[fieldName] === "object"
          ? filters[fieldName]
          : {};
      filters[fieldName] = {
        ...existing,
        $regex: pattern,
        $options: "i",
      };
    }

    if (orGroups.length === 1) {
      filters.$or = orGroups[0].$or;
    } else if (orGroups.length > 1) {
      filters.$and = orGroups;
    }

    return { filters, populate, sort, skip, limit };
  }

  static castValue(value: unknown): any {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") return value;

      const isoDateRegex =
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?)?$/;
      if (isoDateRegex.test(trimmed)) {
        return new Date(trimmed);
      }

      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) return numeric;

      if (trimmed === "true") return true;
      if (trimmed === "false") return false;
      return value;
    }
    return value;
  }

  private static parseOperators(
    fieldName: string,
    operators: Record<string, unknown>,
    filters: Record<string, any>,
    regexPatterns: Record<string, RegexPattern>
  ): void {
    for (const [operator, operatorValue] of Object.entries(operators)) {
      if (!this.operatorsMap[operator]) continue;

      if (operator === "starts" || operator === "ends" || operator === "cont") {
        const values = this.asStringArray(operatorValue).filter(
          (value) => value !== ""
        );
        if (values.length === 0) continue;

        regexPatterns[fieldName] ??= { cont: [], isOr: false };
        if (operator === "starts") {
          regexPatterns[fieldName].starts = values[0];
        } else if (operator === "ends") {
          regexPatterns[fieldName].ends = values[0];
        } else {
          regexPatterns[fieldName].cont.push(...values);
        }
        continue;
      }

      if (operator === "isnull" || operator === "notnull") {
        const flag = this.toBoolean(operatorValue, true);
        const isNull = operator === "isnull" ? flag : !flag;
        filters[fieldName] = { [isNull ? "$eq" : "$ne"]: null };
        continue;
      }

      if (operator === "between") {
        const values = this.asArray(operatorValue);
        if (values.length < 2 || !values.every((item) => this.isScalar(item))) {
          continue;
        }

        const start = this.castValue(values[0]);
        const end = this.castValue(values[1]);
        filters[fieldName] = { $gte: start, $lte: end };
        continue;
      }

      if (operator === "in" || operator === "notin") {
        const values = this.asArray(operatorValue)
          .filter((item) => this.isScalar(item))
          .map((item) => this.castValue(item));
        filters[fieldName] = {
          [this.operatorsMap[operator]]: values,
        };
        continue;
      }

      if (operator === "excl") {
        const value = this.asString(operatorValue);
        if (!value) continue;

        filters[fieldName] = {
          $not: { $regex: this.escapeRegex(value), $options: "i" },
        };
        continue;
      }

      if (!this.isScalar(operatorValue)) continue;

      const value =
        operatorValue === "null" ? null : this.castValue(operatorValue);
      if (!filters[fieldName] || typeof filters[fieldName] !== "object") {
        filters[fieldName] = {};
      }
      filters[fieldName][this.operatorsMap[operator]] = value;
    }
  }

  private static parsePopulate(value: string, populate: any[]): void {
    for (const path of value.split(",")) {
      const normalized = path.trim();
      if (!this.isSafeFieldName(normalized)) continue;
      if (!populate.some((item) => item.path === normalized)) {
        populate.push({ path: normalized });
      }
    }
  }

  private static parseSort(
    value: string,
    sort: Record<string, 1 | -1>
  ): void {
    for (const field of value.split(",")) {
      const normalized = field.trim();
      if (!normalized) continue;

      const descending = normalized.startsWith("-");
      const fieldName = descending ? normalized.slice(1) : normalized;
      if (!this.isSafeFieldName(fieldName)) continue;

      sort[fieldName] = descending ? -1 : 1;
    }
  }

  private static isSafeFieldName(fieldName: string): boolean {
    if (!fieldName || fieldName.startsWith("$")) return false;

    return fieldName
      .split(".")
      .every(
        (segment) =>
          segment !== "" &&
          !segment.startsWith("$") &&
          segment !== "__proto__" &&
          segment !== "constructor" &&
          segment !== "prototype"
      );
  }

  private static isScalar(value: unknown): boolean {
    return (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  }

  private static asArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");
    }
    if (value === undefined || value === null) return [];
    return [value];
  }

  private static asString(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return undefined;
  }

  private static asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .filter((item) => this.isScalar(item))
        .map((item) => String(item));
    }

    const single = this.asString(value);
    return single === undefined ? [] : [single];
  }

  private static toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") return true;
      if (normalized === "false" || normalized === "0") return false;
    }
    return fallback;
  }

  private static toNonNegativeInteger(value: unknown): number | undefined {
    if (typeof value !== "string" && typeof value !== "number") {
      return undefined;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return undefined;

    return Math.max(0, Math.trunc(numeric));
  }

  private static escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
