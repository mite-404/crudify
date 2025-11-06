import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Config } from "./config.entity";

@Injectable()
export class ConfigService {
  private configCache: Record<string, any> = {};

  constructor(@InjectModel(Config.name) private configModel: Model<Config>) {
    this.load();
  }

  async load(): Promise<void> {
    const configs = await this.configModel.find().exec();
    this.configCache = configs.reduce((acc: any, cfg: any) => {
      acc[cfg.modelName] = {
        enabled: cfg.enabled,
        routes: cfg.routes,
      };
      return acc;
    }, {});
  }

  isRouteEnabled(model: string, route: string): boolean {
    return this.configCache?.[model]?.routes?.[route] ?? true;
  }

  getAll(): Record<string, any> {
    return this.configCache;
  }

  async updateConfig(model: string, updates: Partial<Config>): Promise<void> {
    await this.configModel.updateOne({ modelName: model }, updates, {
      upsert: true,
    });
  }
}
