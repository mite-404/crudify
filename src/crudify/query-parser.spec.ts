import { describe, expect, it } from "vitest";
import { QueryParser } from "./query-parser.namespace";

describe("QueryParser", () => {
  describe("filters", () => {
    it("casts primitive query values", () => {
      expect(QueryParser.parse({ age: "25" }).filters).toEqual({ age: 25 });
      expect(QueryParser.parse({ active: "true" }).filters).toEqual({
        active: true,
      });
      expect(QueryParser.parse({ name: "John" }).filters).toEqual({
        name: "John",
      });
      expect(QueryParser.parse({ name: "" }).filters).toEqual({ name: "" });
    });

    it("casts date values", () => {
      const { filters } = QueryParser.parse({ createdAt: "2025-01-01" });

      expect(filters.createdAt).toBeInstanceOf(Date);
    });

    it("supports comparison operators", () => {
      const { filters } = QueryParser.parse({
        age: { gte: "18", lt: "65" },
      });

      expect(filters).toEqual({ age: { $gte: 18, $lt: 65 } });
    });

    it("casts values used by in and notin", () => {
      expect(QueryParser.parse({ age: { in: "18,25" } }).filters).toEqual({
        age: { $in: [18, 25] },
      });
      expect(
        QueryParser.parse({ age: { notin: ["18", "25"] } }).filters
      ).toEqual({ age: { $nin: [18, 25] } });
    });

    it("supports between", () => {
      expect(QueryParser.parse({ age: { between: "18,25" } }).filters).toEqual({
        age: { $gte: 18, $lte: 25 },
      });
      expect(QueryParser.parse({ age: { between: "18" } }).filters).toEqual({});
    });

    it("supports null checks", () => {
      expect(
        QueryParser.parse({ deletedAt: { isnull: "true" } }).filters
      ).toEqual({ deletedAt: { $eq: null } });
      expect(
        QueryParser.parse({ deletedAt: { isnull: "false" } }).filters
      ).toEqual({ deletedAt: { $ne: null } });
      expect(QueryParser.parse({ email: { notnull: "true" } }).filters).toEqual(
        { email: { $ne: null } }
      );
    });

    it("escapes user input before building regular expressions", () => {
      expect(QueryParser.parse({ name: { cont: "a+b" } }).filters).toEqual({
        name: { $regex: "a\\+b", $options: "i" },
      });
      expect(QueryParser.parse({ name: { excl: "a+b" } }).filters).toEqual({
        name: { $not: { $regex: "a\\+b", $options: "i" } },
      });
    });

    it("combines starts and ends with AND by default", () => {
      expect(
        QueryParser.parse({
          email: { starts: "john", ends: "gmail.com" },
        }).filters
      ).toEqual({
        email: { $regex: "^john.*gmail\\.com$", $options: "i" },
      });
    });

    it("supports OR conditions", () => {
      const { filters } = QueryParser.parse({
        email: { starts: "john", ends: "gmail.com" },
        email_op: "or",
      });

      expect(filters.$or).toHaveLength(2);
      expect(filters.$or[0]).toEqual({
        email: { $regex: "^john", $options: "i" },
      });
      expect(filters.$or[1]).toEqual({
        email: { $regex: "gmail\\.com$", $options: "i" },
      });
    });

    it("combines OR groups on different fields with AND", () => {
      const { filters } = QueryParser.parse({
        email: { starts: "john" },
        email_op: "or",
        name: { starts: "jane" },
        name_op: "or",
      });

      expect(filters.$and).toHaveLength(2);
      expect(filters.$and[0].$or).toHaveLength(1);
      expect(filters.$and[1].$or).toHaveLength(1);
    });

    it("combines regex filters with other operators on the same field", () => {
      expect(
        QueryParser.parse({ name: { starts: "Jo", ne: "John" } }).filters
      ).toEqual({
        name: { $ne: "John", $regex: "^Jo", $options: "i" },
      });
    });

    it("accepts arrays for regex operators", () => {
      expect(QueryParser.parse({ name: { cont: ["Jo", "hn"] } }).filters).toEqual(
        {
          name: { $regex: "Jo.*hn", $options: "i" },
        }
      );
    });

    it("maps the literal null operator value to null", () => {
      expect(QueryParser.parse({ deletedAt: { eq: "null" } }).filters).toEqual({
        deletedAt: { $eq: null },
      });
    });

    it("rejects object values for scalar operators", () => {
      expect(
        QueryParser.parse({ age: { eq: { $ne: "1" } } }).filters
      ).toEqual({});
    });

    it("ignores empty regex values", () => {
      expect(QueryParser.parse({ name: { cont: "" } }).filters).toEqual({});
      expect(QueryParser.parse({ name: { excl: "" } }).filters).toEqual({});
    });

    it("converts repeated values to an in filter", () => {
      expect(QueryParser.parse({ tag: ["a", "b"] }).filters).toEqual({
        tag: { $in: ["a", "b"] },
      });
    });

    it("rejects prototype pollution and operator injection attempts", () => {
      const query = JSON.parse(
        '{"__proto__":{"polluted":true},"constructor":{"eq":"x"},"$where":"1"}'
      );

      const { filters } = QueryParser.parse(query);

      expect(filters).toEqual({});
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it("rejects operator segments in field paths", () => {
      const { filters, sort, populate } = QueryParser.parse({
        "profile.$where": "1",
        sort: "profile.$where",
        populate: "profile.$where",
      });

      expect(filters).toEqual({});
      expect(sort).toEqual({});
      expect(populate).toEqual([]);
    });
  });

  describe("pagination", () => {
    it("parses skip and limit", () => {
      const { skip, limit } = QueryParser.parse({ skip: "20", limit: "10" });

      expect(skip).toBe(20);
      expect(limit).toBe(10);
    });

    it("clamps negative values to zero", () => {
      const { skip, limit } = QueryParser.parse({ skip: "-20", limit: "-10" });

      expect(skip).toBe(0);
      expect(limit).toBe(0);
    });

    it("ignores invalid pagination values", () => {
      const { filters, skip, limit } = QueryParser.parse({
        skip: "invalid",
        limit: "invalid",
      });

      expect(skip).toBe(0);
      expect(limit).toBe(0);
      expect(filters).toEqual({});
    });
  });

  describe("sort and populate", () => {
    it("parses and sanitizes sort fields", () => {
      const { sort } = QueryParser.parse({
        sort: "-createdAt,name,-$where",
      });

      expect(sort).toEqual({ createdAt: -1, name: 1 });
    });

    it("parses populate paths without duplicates", () => {
      const { populate } = QueryParser.parse({
        populate: "posts, comments, posts, __proto__",
      });

      expect(populate).toEqual([{ path: "posts" }, { path: "comments" }]);
    });
  });
});
