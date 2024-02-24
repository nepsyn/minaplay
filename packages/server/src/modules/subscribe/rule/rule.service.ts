import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rule } from './rule.entity.js';
import { DeepPartial, FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { FileService } from '../../file/file.service.js';
import IsolatedVM from 'isolated-vm';
import { RuleHooks, RuleVm } from './rule.interface.js';
import TypeScript from 'typescript';

@Injectable()
export class RuleService {
  constructor(@InjectRepository(Rule) private ruleRepository: Repository<Rule>, private fileService: FileService) {}

  private isolate = new IsolatedVM.Isolate();

  async buildRuleHook<T extends keyof RuleHooks>(hook: IsolatedVM.Reference) {
    if (hook.typeof === 'function') {
      return (...args: Parameters<RuleHooks[T]>) =>
        hook.applySync(null, args, {
          arguments: {
            copy: true,
          },
          result: {
            promise: true,
            copy: true,
          },
        }) as ReturnType<RuleHooks[T]>;
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
    const hooks = {
      validate: await this.buildRuleHook<'validate'>(validateHook),
      describe: await this.buildRuleHook<'describe'>(describeHook),
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
      release,
    };
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
    const result = await this.ruleRepository.delete(where);

    for (const rule of rules) {
      if (rule.file) {
        await this.fileService.delete({ id: rule.file.id });
      }
    }

    return result.affected > 0;
  }
}
