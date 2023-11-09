import { ConsoleLogger, DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import path from 'path';
import fs from 'fs-extra';
import { getMinaPlayPluginDescriptor, isMinaPlayPlugin } from '../../utils/plugin.decorator';
import { MinaPlayPluginConstructor } from '../../interfaces/plugins';
import { PluginService } from './plugin.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserModule } from '../user/user.module';
import { PluginController } from './plugin.controller';

@Module({})
export class PluginModule {
  private static logger = new ConsoleLogger(PluginModule.name);

  static async registerAsync(): Promise<DynamicModule> {
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
        this.logger.error(`Error occurred while loading plugin file: ${path.basename(file)}`, error.stack);
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
