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

  static parse(queryParams: Record<string, unknown>): {
    filters: Record<string, any>;
    populate: any[];
    sort: Record<string, 1 | -1>;
    skip: number;
    limit: number;
  } {
    const filters: Record<string, any> = {};
    const populate: any[] = [];
    const sort: Record<string, 1 | -1> = {};
    let skip = 0;
    let limit = 0;

    // Struttura per tenere traccia delle regex per campo
    const regexPatterns: Record<
      string,
      {
        starts?: string;
        ends?: string;
        cont?: string[];
        isOr: boolean;
      }
    > = {};

    for (const [key, value] of Object.entries(queryParams)) {
      // Gestione dell'operatore logico
      if (key.endsWith("_op") && typeof value === "string") {
        const fieldName = key.replace("_op", "");
        if (!regexPatterns[fieldName]) {
          regexPatterns[fieldName] = {
            cont: [],
            isOr: value.toLowerCase() === "or",
          };
        } else {
          regexPatterns[fieldName].isOr = value.toLowerCase() === "or";
        }
        continue;
      }

      if (typeof value === "object" && !Array.isArray(value)) {
        const fieldName = key;
        if (!regexPatterns[fieldName]) {
          regexPatterns[fieldName] = { cont: [], isOr: false }; // Default a AND
        }

        for (const [operator, operatorValue] of Object.entries(value as any)) {
          if (this.operatorsMap[operator]) {
            if (
              ["starts", "ends", "cont"].includes(operator) &&
              typeof operatorValue === "string"
            ) {
              if (operator === "starts") {
                regexPatterns[fieldName].starts = operatorValue;
              } else if (operator === "ends") {
                regexPatterns[fieldName].ends = operatorValue;
              } else if (operator === "cont") {
                regexPatterns[fieldName].cont?.push(operatorValue);
              }
            } else if (operator === "isnull") {
              filters[fieldName] = { $exists: false };
            } else if (operator === "notnull") {
              filters[fieldName] = { $exists: true };
            } else if (
              operator === "between" &&
              typeof operatorValue === "string"
            ) {
              const [start, end] = operatorValue
                .split(",")
                .map((v) => this.castValue(v));
              filters[fieldName] = { $gte: start, $lte: end };
            } else if (
              operator === "excl" &&
              typeof operatorValue === "string"
            ) {
              filters[fieldName] = {
                $not: { $regex: operatorValue, $options: "i" },
              };
            } else {
              const value: any =
                operatorValue == "null" ? null : this.castValue(operatorValue);
              const mongoOperator = this.operatorsMap[operator];
              if (!filters[fieldName]) filters[fieldName] = {};
              filters[fieldName][mongoOperator] = value;
            }
          }
        }
      } else if (key === "populate" && typeof value === "string") {
        const paths = value.split(",");
        paths.forEach((path) => populate.push({ path }));
      } else if (key === "sort" && typeof value === "string") {
        const fields = value.split(",");
        for (const field of fields) {
          if (field.startsWith("-")) {
            sort[field.slice(1)] = -1;
          } else {
            sort[field] = 1;
          }
        }
      } else if (
        key === "skip" &&
        typeof value === "string" &&
        !isNaN(Number(value))
      ) {
        skip = parseInt(value, 10);
      } else if (
        key === "limit" &&
        typeof value === "string" &&
        !isNaN(Number(value))
      ) {
        limit = parseInt(value, 10);
      }
    }

    // Processa i pattern regex
    for (const [fieldName, patterns] of Object.entries(regexPatterns)) {
      if (patterns.isOr) {
        // Gestione OR
        const conditions = [];
        if (patterns.starts) {
          conditions.push({
            [fieldName]: { $regex: `^${patterns.starts}`, $options: "i" },
          });
        }
        if (patterns.ends) {
          conditions.push({
            [fieldName]: { $regex: `${patterns.ends}$`, $options: "i" },
          });
        }
        patterns.cont?.forEach((contPattern) => {
          conditions.push({
            [fieldName]: { $regex: contPattern, $options: "i" },
          });
        });
        if (conditions.length > 0) {
          filters.$or = conditions;
        }
      } else {
        // Gestione AND
        let pattern = "";
        if (patterns.starts) {
          pattern += `^${patterns.starts}`;
        }
        if (patterns.cont?.length) {
          patterns.cont.forEach((contPattern) => {
            pattern += pattern ? `.*${contPattern}` : contPattern;
          });
        }
        if (patterns.ends) {
          pattern += pattern ? `.*${patterns.ends}$` : `${patterns.ends}$`;
        }
        if (pattern) {
          filters[fieldName] = { $regex: pattern, $options: "i" };
        }
      }
    }

    return { filters, populate, sort, skip, limit };
  }

  static castValue(value: unknown): any {
    if (typeof value === "string") {
      if (!isNaN(Number(value))) return Number(value);
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    }
    return value;
  }
}
