import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Config } from "./config.entity";

@Injectable()
export class ConfigService implements OnModuleInit {
  private configCache: Record<string, any> = {};

  constructor(@InjectModel(Config.name) private configModel: Model<Config>) {}

  async onModuleInit() {
    await this.load();
  }

  async load(): Promise<void> {
    const configs = await this.configModel.find().exec();
    this.configCache = configs.reduce((acc: any, cfg: any) => {
      acc[cfg.modelName] = {
        enabled: cfg.enabled !== false,
        routes: cfg.routes,
        props: cfg.props,
      };
      return acc;
    }, {});
  }

  isRouteEnabled(model: string, route: string): boolean {
    const modelCfg = this.configCache[model];
    if (!modelCfg) return true;
    if (modelCfg.enabled === false) return false;
    return modelCfg.routes?.[route] ?? true;
  }

  getAll(): Record<string, any> {
    return this.configCache;
  }

  async updateConfig(
    model: string,
    updates: Partial<Config> = {}
  ): Promise<void> {
    const allowedUpdates: Partial<Config> = {};
    if (updates.enabled !== undefined) allowedUpdates.enabled = updates.enabled;
    if (updates.routes !== undefined) allowedUpdates.routes = updates.routes;
    if (updates.props !== undefined) allowedUpdates.props = updates.props;

    if (Object.keys(allowedUpdates).length === 0) return;

    await this.configModel.updateOne(
      { modelName: model },
      { $set: allowedUpdates },
      { upsert: true }
    );
  }

  notEnabledResponse(modelName: string, route: string) {
    return {
      success: false,
      status: 403,
      message: `The route '${route}' for model '${modelName}' is currently disabled.`,
    };
  }
}
