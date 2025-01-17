import { Model, FilterQuery, UpdateQuery } from "mongoose";
import { QueryParser } from "./query-parser.namespace";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CrudifyService<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(createDto: Partial<T>): Promise<T | any> {
    const entity = new this.model(createDto);
    return entity.save();
  }

  async createBulk(data: T[]): Promise<T[] | any> {
    return this.model.insertMany(data);
  }

  async findAll(query: FilterQuery<T> = {}): Promise<any> {
    const filters = QueryParser.parseFilters(query);
    const sort = QueryParser.parseSort(query.sort);
    const skip = parseInt(query.skip, 10) || 0;
    const limit = parseInt(query.limit, 10) || 10;
    const results = await this.model
      .find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
    const total = await this.model.countDocuments(filters).exec();

    return { results, total, page: Math.ceil(skip / limit) };
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async count(filter: Record<string, any>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async overwrite(id: string, updateDto: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findOneAndReplace({ _id: id }, updateDto, { new: true })
      .exec();
  }

  async update(id: string, updateDto: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async updateBulk(filter: any, updateDto: UpdateQuery<T>): Promise<any> {
    return this.model.updateMany(filter, { $set: updateDto }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteBulk(ids: string[]): Promise<any> {
    return this.model.deleteMany({ _id: { $in: ids } }).exec();
  }
}
