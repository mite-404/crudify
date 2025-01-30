import { Model, FilterQuery, UpdateQuery } from "mongoose";
import { QueryParser } from "./query-parser.namespace";
import { Injectable } from "@nestjs/common";
import { IResponse } from "./interface/response.interface";

@Injectable()
export class CrudifyService<T, C = Partial<T>, U = Partial<T>> {
  constructor(protected readonly model: Model<T>) {}

  async create(createDto: C): Promise<T | any> {
    const entity = new this.model(createDto);
    return entity.save();
  }

  async createBulk(data: C[]): Promise<T[] | any> {
    return this.model.insertMany(data);
  }

  async findAll(query: FilterQuery<T> = {}): Promise<IResponse<T>> {
    const { filters, populate, sort, skip, limit } = QueryParser.parse(query);
    const results = await this.model
      .find(filters)
      .populate(populate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.model.countDocuments(filters).exec();

    return { results, total, page: Math.ceil(skip / limit) };
  }

  async findOne(filter: FilterQuery<any>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async count(filter: Record<string, any>): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async put(id: string, updateDto: UpdateQuery<U>): Promise<T | null> {
    return this.model
      .findOneAndReplace({ _id: id }, updateDto, { new: true })
      .exec();
  }

  async update(id: string, updateDto: UpdateQuery<T>): Promise<T | null> {
    return this.model
      .findOneAndUpdate({ _id: id }, updateDto, { new: true })
      .exec();
  }

  async updateBulk(filter: any, updateDto: UpdateQuery<U>): Promise<any> {
    return this.model.updateMany(filter, { $set: updateDto }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteBulk(filter: any): Promise<any> {
    return this.model.deleteMany(filter).exec();
  }

  async softDelete(id: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate({ _id: id }, { deletedAt: new Date() }, { new: true })
      .exec();
  }

  async softDeleteBulk(filter: any): Promise<any> {
    return this.model
      .updateMany(filter, { $set: { deletedAt: new Date() } })
      .exec();
  }

  async restore(id: string): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, { deletedAt: null }, { new: true });
  }

  async restoreBulk(filter: any): Promise<any> {
    return this.model.updateMany(filter, { $set: { deletedAt: null } }).exec();
  }
}
