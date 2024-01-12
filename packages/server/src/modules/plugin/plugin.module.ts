import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import path from 'node:path';
import fs from 'fs-extra';
import { MinaPlayPluginConstructor } from '../../interfaces/plugins.js';
import { PluginService } from './plugin.service.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';
import { UserModule } from '../user/user.module.js';
import { PluginController } from './plugin.controller.js';
import { getMinaPlayPluginDescriptor, isMinaPlayPlugin } from '../../common/plugin.decorator.js';
import { ApplicationLogger } from '../../common/application.logger.service.js';
import { fileURLToPath } from 'node:url';

@Module({})
export class PluginModule {
  private static logger = new ApplicationLogger(PluginModule.name);

  static async registerAsync(): Promise<DynamicModule> {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const base = path.join(__dirname, '../../plugins');
    await fs.ensureDir(base);

    const files = fs
      .readdirSync(base)
      .filter((file) => path.extname(file) === '.js')
      .map((file) => path.join(base, file));

    const plugins: MinaPlayPluginConstructor[] = [];
    const imports = new Set<Type | DynamicModule | Promise<DynamicModule> | ForwardReference>();
    for (const file of files) {
      try {
        const module: object = await import(file);
        for (const attr of Object.values(module)) {
          if (isMinaPlayPlugin(attr)) {
            plugins.push(attr);

            const descriptor = getMinaPlayPluginDescriptor(attr);
            for (const import_ of descriptor.imports ?? []) {
              imports.add(import_);
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error occurred while loading plugin file: ${path.basename(file)}`,
          error.stack,
          PluginModule.name,
        );
      }
    }

    return {
      module: PluginModule,
      imports: [...new Set([AuthorizationModule, UserModule, ...imports])],
      controllers: [PluginController],
      providers: [
        {
          provide: 'PLUGINS',
          useValue: plugins,
        },
        PluginService,
      ],
      exports: [PluginService],
      global: true,
    };
  }
}
