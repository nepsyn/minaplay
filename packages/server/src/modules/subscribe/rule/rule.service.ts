import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rule } from './rule.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { FileService } from '../../file/file.service.js';
import IsolatedVM from 'isolated-vm';
import { RuleHooks, RuleVm } from './rule.interface.js';
import TypeScript from 'typescript';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { RULE_CODE_DIR } from '../../../constants.js';
import fs from 'fs-extra';
import { generateMD5 } from '../../../utils/generate-md5.util.js';
import { FileSourceEnum } from '../../../enums/index.js';
import { User } from '../../user/user.entity.js';
import { PluginService } from '../../plugin/plugin.service.js';
import { PluginSourceParser } from '../../plugin/plugin.interface.js';

@Injectable()
export class RuleService {
  constructor(
    @InjectRepository(Rule) private ruleRepository: Repository<Rule>,
    private fileService: FileService,
    private pluginService: PluginService,
  ) {}

  private isolate = new IsolatedVM.Isolate();

  async buildRuleHook<T extends keyof RuleHooks>(type: T, hook: IsolatedVM.Reference) {
    if (hook.typeof === 'function') {
      return (...args: any[]) =>
        hook.applySync(null, args, {
          arguments: {
            copy: true,
          },
          result: {
            promise: true,
            copy: true,
          },
        });
    } else if (hook.typeof === 'string') {
      const delegate: string = await hook.copy();
      const [pluginId, parserName] = delegate.split(':');
      const control = this.pluginService.getControlById(pluginId);
      const parser = control?.parserMap.get(parserName);
      if (!parser) {
        return () => {
          throw new Error(`Cannot find parser '${delegate}'`);
        };
      }

      let handlerName: keyof PluginSourceParser = undefined;
      switch (type) {
        case 'validate':
          handlerName = 'validateFeedEntry';
          break;
        case 'describe':
          handlerName = 'describeDownloadItem';
          break;
      }
      const handler = parser.service[handlerName];

      if (!parser.features[handlerName]) {
        return () => {
          throw new Error(`Parser '${delegate}' has no hook handler for '${type}'`);
        };
      }

      return async (...args: any[]) => await handler.apply(parser.service, args);
    } else {
      return undefined;
    }
  }

  async createRuleVm(code: string): Promise<RuleVm> {
    const module = await this.isolate.compileModule(
      TypeScript.transpileModule(code, {
        compilerOptions: {
          target: TypeScript.ScriptTarget.ES2017,
          esModuleInterop: true,
        },
      }).outputText,
    );
    const context = await this.isolate.createContext();

    await module.instantiate(context, () => undefined);
    await module.evaluate({ timeout: 1000, reference: true });
    const exports = await module.namespace.get('default', { reference: true });

    const validateHook = await exports.get('validate', { reference: true });
    const describeHook = await exports.get('describe', { reference: true });
    const meta = await exports.get('meta', { reference: true });
    const hooks = {
      validate: await this.buildRuleHook('validate', validateHook),
      describe: await this.buildRuleHook('describe', describeHook),
    };

    const release = () => {
      validateHook.release();
      describeHook.release();

      hooks.validate = undefined;
      hooks.describe = undefined;

      exports.release();
      module.release();
      context.release();
    };

    return {
      context,
      module,
      hooks,
      meta: (await meta.copy()) ?? {},
      release,
    };
  }

  async createCodeFile(code: string, user?: User) {
    const filename = randomUUID().replace(/-/g, '') + '.ts';
    const filepath = path.join(RULE_CODE_DIR, filename);
    await fs.ensureDir(RULE_CODE_DIR);
    await fs.writeFile(filepath, code);
    const fileStat = await fs.stat(filepath);
    return await this.fileService.save(
      {
        user: user && { id: user.id },
        filename: filename,
        name: filename,
        size: fileStat.size,
        md5: await generateMD5(code),
        source: FileSourceEnum.USER_UPLOAD,
        path: filepath,
      },
      true,
    );
  }

  async save(rule: DeepPartial<Rule>) {
    return await this.ruleRepository.save(rule);
  }

  async findOneBy(where: FindOptionsWhere<Rule>) {
    return await this.ruleRepository.findOneBy(where);
  }

  async findAndCount(options?: FindManyOptions<Rule>) {
    return await this.ruleRepository.findAndCount(options);
  }

  async delete(where: FindOptionsWhere<Rule>) {
    const rules = await this.ruleRepository.find({ where });
    for (const rule of rules) {
      if (rule.file) {
        await this.fileService.delete({ id: rule.file.id });
      }
    }

    const result = await this.ruleRepository.delete(where);
    return result.affected > 0;
  }
}
