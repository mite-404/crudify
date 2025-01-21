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

    // Oggetto per gestire le condizioni per campo
    const conditions: Record<string, any[]> = {};
    const logicalOperators: Record<string, "$and" | "$or"> = {};
    const populateParams: Record<string, any> = {};

    for (const [key, value] of Object.entries(queryParams)) {
      // Gestione dei parametri di populate
      if (key.startsWith("populate.")) {
        const [_, field, param] = key.split(".");
        if (!populateParams[field]) {
          populateParams[field] = {
            path: field,
            select: undefined,
            match: {},
            sort: {},
          };
        }

        if (param === "select" && typeof value === "string") {
          populateParams[field].select = value.split(",").join(" ");
        } else if (param === "sort" && typeof value === "string") {
          const sortFields = value.split(",");
          for (const field of sortFields) {
            if (field.startsWith("-")) {
              populateParams[field].sort[field.slice(1)] = -1;
            } else {
              populateParams[field].sort[field] = 1;
            }
          }
        } else if (typeof value === "object" && !Array.isArray(value)) {
          // Gestione dei filtri per i campi popolati
          populateParams[field].match = {
            ...populateParams[field].match,
            [param]: this.parseFilters(value as Record<string, unknown>),
          };
        }
        continue;
      }

      // Gestione populate semplice
      if (key === "populate" && typeof value === "string") {
        const paths = value.split(",");
        for (const path of paths) {
          if (path.includes(".")) {
            // Gestione populate nested
            const nestedPaths = path.split(".");
            let currentPopulate: any = { path: nestedPaths[0] };
            let currentNested = currentPopulate;

            for (let i = 1; i < nestedPaths.length; i++) {
              currentNested.populate = { path: nestedPaths[i] };
              currentNested = currentNested.populate;
            }

            populate.push(currentPopulate);
          } else {
            populate.push({ path });
          }
        }
        continue;
      }

      // Resto del codice esistente per filtri, sort, skip, limit...
      if (key.endsWith("_op") && typeof value === "string") {
        const fieldName = key.replace("_op", "");
        logicalOperators[fieldName] =
          value.toLowerCase() === "and" ? "$and" : "$or";
        continue;
      }

      if (typeof value === "object" && !Array.isArray(value)) {
        if (!conditions[key]) {
          conditions[key] = [];
        }

        for (const [operator, operatorValue] of Object.entries(value as any)) {
          if (this.operatorsMap[operator]) {
            if (
              ["starts", "ends", "cont"].includes(operator) &&
              typeof operatorValue === "string"
            ) {
              let pattern = "";
              if (operator === "starts") pattern = `^${operatorValue}`;
              if (operator === "ends") pattern = `${operatorValue}$`;
              if (operator === "cont") pattern = operatorValue;

              conditions[key].push({
                $regex: pattern,
                $options: "i",
              });
            } else if (
              operator === "excl" &&
              typeof operatorValue === "string"
            ) {
              conditions[key].push({
                $not: {
                  $regex: operatorValue,
                  $options: "i",
                },
              });
            } else if (operator === "isnull") {
              conditions[key].push({ $exists: false });
            } else if (operator === "notnull") {
              conditions[key].push({ $exists: true });
            } else if (
              operator === "between" &&
              typeof operatorValue === "string"
            ) {
              const [start, end] = operatorValue
                .split(",")
                .map((v) => this.castValue(v));
              conditions[key].push({ $gte: start, $lte: end });
            } else {
              const mongoOperator = this.operatorsMap[operator];
              const condition: Record<string, any> = {};
              condition[mongoOperator] = this.castValue(operatorValue);
              conditions[key].push(condition);
            }
          }
        }

        if (conditions[key].length > 0) {
          const logicalOp = logicalOperators[key] || "$or";
          filters[key] = { [logicalOp]: conditions[key] };
        }
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

    // Aggiungi i parametri di populate alle configurazioni esistenti
    for (const [field, params] of Object.entries(populateParams)) {
      const existingPopulate = populate.find((p) => p.path === field);
      if (existingPopulate) {
        Object.assign(existingPopulate, params);
      } else {
        populate.push(params);
      }
    }

    return { filters, populate, sort, skip, limit };
  }

  static parseFilters(filters: Record<string, unknown>): Record<string, any> {
    const parsed: Record<string, any> = {};
    for (const [operator, value] of Object.entries(filters)) {
      if (this.operatorsMap[operator]) {
        const mongoOperator = this.operatorsMap[operator];
        parsed[mongoOperator] = this.castValue(value);
      }
    }
    return parsed;
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
