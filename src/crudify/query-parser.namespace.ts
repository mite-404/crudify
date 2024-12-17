export namespace QueryParser {
  export function parseFilters(rawFilters: any): Record<string, any> {
    if (!rawFilters) return {};
    let filters: any = { ...rawFilters };
    if (filters?.["filter"]) {
      delete filters?.["filter"];
      rawFilters?.["filter"].forEach((filter: any) => {
        const [key, value] = filter.split("=");
        filters[key] = value;
      });
    }

    const query: any = {};
    Object.keys(filters)
      .filter((key) => !["sort", "skip", "limit"].includes(key))
      .forEach((key) => {
        const v = filters[key]?.split(":");
        // const operator = v[0].replace('[', '').replace(']', '');
        const operator = v[0].split("]")[0].replace("[", "");
        const value = v[1];

        query[key] = {
          ...query[key],
          ...QueryParser.getMongooseOperator(operator, value),
        };
      });
    return query;
  }

  export function parseSort(sort: string): Record<string, number> | any {
    if (!sort) return {};

    const sortFields = sort.split(",");
    return sortFields.reduce((acc: any, field) => {
      const direction = field.startsWith("-") ? -1 : 1;
      const fieldName = field.replace(/^-/, "");
      acc[fieldName] = direction;
      return acc;
    }, {});
  }

  export function getMongooseOperator(
    operator: string,
    value: string
  ): Record<string, any> {
    switch (operator) {
      case "$eq":
        return { $eq: QueryParser.castValue(value) };
      case "$ne":
        return { $ne: QueryParser.castValue(value) };
      case "$gt":
        return { $gt: QueryParser.castValue(value) };
      case "$lt":
        return { $lt: QueryParser.castValue(value) };
      case "$gte":
        return { $gte: QueryParser.castValue(value) };
      case "$lte":
        return { $lte: QueryParser.castValue(value) };
      case "$starts":
        return { $regex: `^${value}`, $options: "i" };
      case "$ends":
        return { $regex: `${value}$`, $options: "i" };
      case "$cont":
        return { $regex: value, $options: "i" };
      case "$excl":
        return { $not: { $regex: value, $options: "i" } };
      case "$in":
        return { $in: value.split(",").map(QueryParser.castValue) };
      case "$notin":
        return { $nin: value.split(",").map(QueryParser.castValue) };
      case "$isnull":
        return { $exists: false };
      case "$notnull":
        return { $exists: true };
      case "$between": {
        const [start, end] = value.split(",").map(QueryParser.castValue);
        return { $gte: start, $lte: end };
      }
      default:
        return { $eq: QueryParser.castValue(value) };
    }
  }

  export function castValue(value: string): any {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value))) return Number(value);
    if (!isNaN(Date.parse(value))) return new Date(value);
    return value;
  }
}
